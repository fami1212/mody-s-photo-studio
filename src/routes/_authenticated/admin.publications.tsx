import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { signPreviewUrls, slugify } from "@/lib/admin-storage";
import { prepareShootingSeo } from "@/lib/marketing-images";

export const Route = createFileRoute("/_authenticated/admin/publications")({
  head: () => ({ meta: [
    { title: "Publications — Admin Mody" },
    { name: "description", content: "Gestion des shootings et de leurs aperçus par Mody Photography." },
    { property: "og:title", content: "Publications — Admin Mody" },
    { property: "og:description", content: "Gestion des shootings et de leurs aperçus par Mody Photography." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: PostsPage,
});

type Folder = { id: string; name: string };
type Photo = { id: string; storage_path: string; thumb_path: string | null; display_path: string | null };
type Post = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  status: string;
  shot_on: string | null;
  body: string | null;
  cover_photo_id: string | null;
};

const categories = ["Mariage", "Baptême", "Studio", "Extérieur", "Éditorial"];
const PHOTO_PAGE_SIZE = 48;

function previewPath(photo: Photo) {
  return photo.thumb_path ?? photo.display_path ?? photo.storage_path;
}

function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const photoRequestId = useRef(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [body, setBody] = useState("");
  const [shotOn, setShotOn] = useState("");
  const [busy, setBusy] = useState(false);

  const loadPosts = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, slug, title, category, status, shot_on, body, cover_photo_id")
      .order("created_at", { ascending: false });
    setPosts(data ?? []);
  }, []);

  useEffect(() => {
    void loadPosts();
    void supabase
      .from("folders")
      .select("id, name")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setFolders(data ?? []);
        setFolderId((current) => current || (data?.[0]?.id ?? ""));
      });
  }, [loadPosts]);

  useEffect(() => {
    const requestId = ++photoRequestId.current;
    let active = true;
    setPhotos([]);
    setUrls({});
    setSelected([]);
    setHasMorePhotos(false);
    if (!folderId) {
      setLoadingPhotos(false);
      return () => {
        active = false;
      };
    }
    setLoadingPhotos(true);
    void (async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, storage_path, thumb_path, display_path")
        .eq("folder_id", folderId)
        .order("position", { ascending: true })
        .order("id", { ascending: true })
        .range(0, PHOTO_PAGE_SIZE);
      if (error) throw error;
      const page = data ?? [];
      const list = page.slice(0, PHOTO_PAGE_SIZE);
      const previewPaths = list.map(previewPath);
      const signed = await signPreviewUrls(previewPaths);
      if (!active || requestId !== photoRequestId.current) return;
      setPhotos(list);
      setUrls(Object.fromEntries(list.map((photo) => [photo.id, signed[previewPath(photo)] ?? ""])));
      setHasMorePhotos(page.length > PHOTO_PAGE_SIZE);
    })()
      .catch((error: unknown) => {
        if (active && requestId === photoRequestId.current) {
          toast.error(error instanceof Error ? error.message : "Chargement des photos impossible.");
        }
      })
      .finally(() => {
        if (active && requestId === photoRequestId.current) setLoadingPhotos(false);
      });
    return () => {
      active = false;
    };
  }, [folderId]);

  async function loadMorePhotos() {
    if (!folderId || loadingPhotos || !hasMorePhotos) return;
    const requestId = photoRequestId.current;
    const offset = photos.length;
    setLoadingPhotos(true);
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("id, storage_path, thumb_path, display_path")
        .eq("folder_id", folderId)
        .order("position", { ascending: true })
        .order("id", { ascending: true })
        .range(offset, offset + PHOTO_PAGE_SIZE);
      if (error) throw error;
      const page = data ?? [];
      const list = page.slice(0, PHOTO_PAGE_SIZE);
      const previewPaths = list.map(previewPath);
      const signed = await signPreviewUrls(previewPaths);
      if (requestId !== photoRequestId.current) return;
      setPhotos((current) => [...current, ...list]);
      setUrls((current) => ({
        ...current,
        ...Object.fromEntries(list.map((photo) => [photo.id, signed[previewPath(photo)] ?? ""])),
      }));
      setHasMorePhotos(page.length > PHOTO_PAGE_SIZE);
    } catch (error) {
      if (requestId === photoRequestId.current) {
        toast.error(error instanceof Error ? error.message : "Chargement des photos impossible.");
      }
    } finally {
      if (requestId === photoRequestId.current) setLoadingPhotos(false);
    }
  }

  function togglePhoto(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  async function createPost(status: "draft" | "published") {
    if (title.trim().length < 3) return void toast.error("Ajoutez un titre.");
    if (selected.length === 0) return void toast.error("Choisissez au moins une photo.");
    setBusy(true);
    try {
      const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          slug,
          title: title.trim(),
          category: category ?? null,
          body: body.trim() || null,
          shot_on: shotOn || null,
          folder_id: folderId || null,
          cover_photo_id: selected[0] ?? null,
          status,
          published_at: status === "published" ? new Date().toISOString() : null,
        })
        .select("id, slug, title, category, status, shot_on, body, cover_photo_id")
        .single();
      if (error) throw error;

      const { error: linkError } = await supabase
        .from("post_photos")
        .insert(selected.map((photoId, index) => ({ post_id: post.id, photo_id: photoId, position: index })));
      if (linkError) throw linkError;
      await prepareShootingSeo(post);

      setPosts((current) => [post, ...current]);
      setTitle("");
      setBody("");
      setShotOn("");
      setSelected([]);
      toast.success(status === "published" ? "Publication en ligne." : "Brouillon enregistré.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publication impossible");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(post: Post) {
    const next = post.status === "published" ? "draft" : "published";
    if (next === "published") {
      try { await prepareShootingSeo({ ...post, status: next }); }
      catch { return void toast.error("Préparation de l’aperçu impossible. Réessayez."); }
    }
    const { error } = await supabase
      .from("posts")
      .update({
        status: next,
        published_at: next === "published" ? new Date().toISOString() : null,
      })
      .eq("id", post.id);
    if (error) return void toast.error(error.message);
    setPosts((current) => current.map((p) => (p.id === post.id ? { ...p, status: next } : p)));
  }

  async function deletePost(post: Post) {
    if (!window.confirm(`Supprimer « ${post.title} » ?`)) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return void toast.error(error.message);
    setPosts((current) => current.filter((p) => p.id !== post.id));
  }

  async function refreshPreviews() {
    setBusy(true);
    try {
      for (const post of posts) await prepareShootingSeo(post);
      toast.success("Aperçus des shootings actualisés.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Actualisation impossible"); }
    finally { setBusy(false); }
  }

  return (
    <main className="admin-page space-y-5">
      <header>
        <h1 className="font-display text-3xl uppercase tracking-tight">Publications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Créez un shooting ou gérez les publications existantes.</p>
      </header>
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid h-auto w-full max-w-lg grid-cols-2">
          <TabsTrigger value="create">Nouvelle publication</TabsTrigger>
          <TabsTrigger value="manage">Gérer ({posts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <section className="admin-card">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mariage Sara & Amine" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Catégorie</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full rounded-md border-2 border-foreground bg-background px-3 text-sm font-medium"
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shot-on">Date du shooting</Label>
                <Input id="shot-on" type="date" value={shotOn} onChange={(e) => setShotOn(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="body">Texte</Label>
                <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Racontez le shooting…" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="folder">Dossier source</Label>
                <select
                  id="folder"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="h-10 w-full rounded-md border-2 border-foreground bg-background px-3 text-sm font-medium"
                >
                  <option value="">— Choisir un dossier —</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-bold">
                Photos ({selected.length} choisie(s), la 1re sert de couverture)
              </p>
              <p className="text-xs text-muted-foreground">{photos.length} chargée(s)</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {photos.map((photo, photoIndex) => {
                const index = selected.indexOf(photo.id);
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => togglePhoto(photo.id)}
                    aria-label={`Choisir la photo ${photoIndex + 1}`}
                    aria-pressed={index >= 0}
                    className={`relative overflow-hidden rounded-2xl border-2 ${index >= 0 ? "border-primary" : "border-foreground/20"}`}
                  >
                    <img
                      src={urls[photo.id] || undefined}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full object-cover"
                    />
                    {index >= 0 && (
                      <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {loadingPhotos && <p className="mt-3 text-sm text-muted-foreground">Chargement des miniatures…</p>}
            {!loadingPhotos && photos.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">Ce dossier n'a pas encore de photos.</p>
            )}
            {hasMorePhotos && (
              <Button variant="outline" className="mt-4 w-full rounded-full sm:w-auto" disabled={loadingPhotos} onClick={loadMorePhotos}>
                Charger 48 photos supplémentaires
              </Button>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1 rounded-full" disabled={busy || loadingPhotos} onClick={() => createPost("published")}>
                Publier sur le site
              </Button>
              <Button variant="outline" className="flex-1 rounded-full" disabled={busy || loadingPhotos} onClick={() => createPost("draft")}>
                Enregistrer en brouillon
              </Button>
            </div>
          </section>
        </TabsContent>
        <TabsContent value="manage">
          <section className="admin-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl uppercase tracking-tight">Publications existantes</h2>
              <Button variant="outline" disabled={busy} onClick={refreshPreviews}>Actualiser les aperçus</Button>
            </div>
            {posts.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Aucune publication.</p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {posts.map((post) => (
                  <li key={post.id} className="rounded-2xl border-2 border-foreground/20 p-3">
                    <p className="font-bold">{post.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {post.category ?? "—"} · {post.status === "published" ? "En ligne" : "Brouillon"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => toggleStatus(post)}>
                        {post.status === "published" ? "Retirer du site" : "Publier"}
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-full" aria-label={`Supprimer ${post.title}`} onClick={() => deletePost(post)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </main>
  );
}
