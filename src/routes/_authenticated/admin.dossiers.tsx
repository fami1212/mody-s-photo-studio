import { createFileRoute } from "@tanstack/react-router";
import { Copy, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { PHOTOS_BUCKET, randomToken, signPreviewUrls, slugify } from "@/lib/admin-storage";
import { createVariants, optimizeExisting } from "@/lib/image-variants";

export const Route = createFileRoute("/_authenticated/admin/dossiers")({
  head: () => ({ meta: [{ title: "Dossiers — Admin Mody" }, { name: "robots", content: "noindex" }] }),
  component: FoldersPage,
});

type Folder = { id: string; name: string; description: string | null; cover_photo_id: string | null };
type Photo = {
  id: string;
  storage_path: string;
  thumb_path: string | null;
  display_path: string | null;
  file_name: string | null;
  position: number;
};
type ShareLink = {
  id: string;
  token: string;
  label: string | null;
  is_active: boolean;
  expires_at: string | null;
};

function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const active = folders.find((f) => f.id === activeId) ?? null;

  const loadFolders = useCallback(async () => {
    const { data, error } = await supabase
      .from("folders")
      .select("id, name, description, cover_photo_id")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setFolders(data ?? []);
    setLoading(false);
    setActiveId((current) => current ?? data?.[0]?.id ?? null);
  }, []);

  const loadFolderContent = useCallback(async (folderId: string) => {
    const [{ data: rows }, { data: shares }] = await Promise.all([
      supabase
        .from("photos")
        .select("id, storage_path, thumb_path, display_path, file_name, position")
        .eq("folder_id", folderId)
        .order("position", { ascending: true }),
      supabase
        .from("share_links")
        .select("id, token, label, is_active, expires_at")
        .eq("folder_id", folderId)
        .order("created_at", { ascending: false }),
    ]);
    const list = rows ?? [];
    setPhotos(list);
    setLinks(shares ?? []);
    const signed = await signPreviewUrls(list.map((p) => p.thumb_path ?? p.storage_path));
    setUrls(Object.fromEntries(list.map((p) => [p.storage_path, signed[p.thumb_path ?? p.storage_path]])));
  }, []);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    if (activeId) void loadFolderContent(activeId);
    else {
      setPhotos([]);
      setLinks([]);
    }
  }, [activeId, loadFolderContent]);

  async function createFolder() {
    if (name.trim().length < 2) {
      toast.error("Donnez un nom au dossier.");
      return;
    }
    const { data, error } = await supabase
      .from("folders")
      .insert({ name: name.trim(), description: description.trim() || null })
      .select("id, name, description, cover_photo_id")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setDescription("");
    setFolders((current) => [data, ...current]);
    setActiveId(data.id);
    toast.success("Dossier créé.");
  }

  async function renameFolder(folder: Folder) {
    const next = window.prompt("Nouveau nom du dossier", folder.name);
    if (!next || next.trim().length < 2) return;
    const { error } = await supabase
      .from("folders")
      .update({ name: next.trim() })
      .eq("id", folder.id);
    if (error) return toast.error(error.message);
    setFolders((current) =>
      current.map((f) => (f.id === folder.id ? { ...f, name: next.trim() } : f)),
    );
  }

  async function deleteFolder(folder: Folder) {
    if (!window.confirm(`Supprimer « ${folder.name} » et toutes ses photos ?`)) return;
    const { data: rows } = await supabase
      .from("photos")
      .select("id, storage_path, thumb_path, display_path")
      .eq("folder_id", folder.id);
    const ids = (rows ?? []).map((r) => r.id);
    await supabase.from("folders").update({ cover_photo_id: null }).eq("id", folder.id);
    await supabase.from("share_links").delete().eq("folder_id", folder.id);
    await supabase.from("posts").update({ folder_id: null }).eq("folder_id", folder.id);
    if (ids.length) {
      await supabase.from("post_photos").delete().in("photo_id", ids);
      await supabase.from("posts").update({ cover_photo_id: null }).in("cover_photo_id", ids);
      await supabase.from("photos").delete().eq("folder_id", folder.id);
    }
    const { error } = await supabase.from("folders").delete().eq("id", folder.id);
    if (error) return toast.error(error.message);
    if (rows?.length) {
      await supabase.storage
        .from(PHOTOS_BUCKET)
        .remove(rows.flatMap((r) => [r.storage_path, r.thumb_path, r.display_path]).filter(Boolean) as string[]);
    }
    setFolders((current) => current.filter((f) => f.id !== folder.id));
    setActiveId((current) => (current === folder.id ? null : current));
    toast.success("Dossier supprimé.");
  }

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    event.target.value = "";
    if (!activeId || files.length === 0) return;
    setUploading(true);
    let position = photos.length;
    let added = 0;

    for (const file of files) {
      const ext = (file.name.split(".").pop()?.toLowerCase() ?? "jpg").replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      const path = `${activeId}/${crypto.randomUUID()}-${slugify(file.name) || "photo"}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, file, { contentType: file.type || "image/jpeg", cacheControl: "31536000" });
      if (uploadError) {
        toast.error(`${file.name} : ${uploadError.message}`);
        continue;
      }
      let variants = {};
      try {
        variants = await createVariants(file, path);
      } catch {
        // original still usable
      }
      const { error } = await supabase
        .from("photos")
        .insert({ folder_id: activeId, storage_path: path, file_name: file.name.slice(0, 200), position, ...variants });
      if (error) {
        toast.error(error.message);
        continue;
      }
      position += 1;
      added += 1;
    }

    setUploading(false);
    if (added) toast.success(`${added} photo(s) envoyée(s).`);
    await loadFolderContent(activeId);
  }

  async function optimizeOld() {
    if (!activeId) return;
    const todo = photos.filter((p) => !p.thumb_path);
    if (todo.length === 0) return toast.info("Toutes les photos sont déjà optimisées.");
    setUploading(true);
    const n = await optimizeExisting(todo);
    setUploading(false);
    toast.success(`${n} photo(s) optimisée(s).`);
    await loadFolderContent(activeId);
  }

  async function deletePhoto(photo: Photo) {
    if (!window.confirm("Supprimer cette photo ?")) return;
    await supabase.from("post_photos").delete().eq("photo_id", photo.id);
    await supabase.from("posts").update({ cover_photo_id: null }).eq("cover_photo_id", photo.id);
    await supabase.from("folders").update({ cover_photo_id: null }).eq("cover_photo_id", photo.id);
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) return toast.error(error.message);
    await supabase.storage
      .from(PHOTOS_BUCKET)
      .remove([photo.storage_path, photo.thumb_path, photo.display_path].filter(Boolean) as string[]);
    setPhotos((current) => current.filter((p) => p.id !== photo.id));
  }

  async function setCover(photo: Photo) {
    if (!activeId) return;
    const { error } = await supabase
      .from("folders")
      .update({ cover_photo_id: photo.id })
      .eq("id", activeId);
    if (error) return toast.error(error.message);
    setFolders((current) =>
      current.map((f) => (f.id === activeId ? { ...f, cover_photo_id: photo.id } : f)),
    );
    toast.success("Couverture mise à jour.");
  }

  async function createShareLink() {
    if (!activeId) return;
    const label = window.prompt("Nom du client (facultatif)") ?? null;
    const { data, error } = await supabase
      .from("share_links")
      .insert({ folder_id: activeId, token: randomToken(), label: label?.trim() || null })
      .select("id, token, label, is_active, expires_at")
      .single();
    if (error) return toast.error(error.message);
    setLinks((current) => [data, ...current]);
    toast.success("Lien de partage créé.");
  }

  async function toggleLink(link: ShareLink) {
    const { error } = await supabase
      .from("share_links")
      .update({ is_active: !link.is_active })
      .eq("id", link.id);
    if (error) return toast.error(error.message);
    setLinks((current) =>
      current.map((l) => (l.id === link.id ? { ...l, is_active: !l.is_active } : l)),
    );
  }

  async function setExpiry(link: ShareLink) {
    const value = window.prompt("Date d'expiration (AAAA-MM-JJ), vide = aucune", "");
    if (value === null) return;
    const expires = value.trim() ? new Date(`${value.trim()}T23:59:59`).toISOString() : null;
    const { error } = await supabase
      .from("share_links")
      .update({ expires_at: expires })
      .eq("id", link.id);
    if (error) return toast.error(error.message);
    setLinks((current) =>
      current.map((l) => (l.id === link.id ? { ...l, expires_at: expires } : l)),
    );
  }

  async function deleteLink(link: ShareLink) {
    const { error } = await supabase.from("share_links").delete().eq("id", link.id);
    if (error) return toast.error(error.message);
    setLinks((current) => current.filter((l) => l.id !== link.id));
  }

  async function copyLink(link: ShareLink) {
    await navigator.clipboard.writeText(`${window.location.origin}/partage/${link.token}`);
    toast.success("Lien copié.");
  }

  return (
    <main className="mx-auto grid max-w-[92rem] gap-6 px-4 py-8 sm:px-5 lg:grid-cols-[22rem_1fr]">
      <section className="space-y-5">
        <div className="rounded-3xl border-2 border-foreground bg-card p-5">
          <h2 className="font-display text-2xl uppercase tracking-tight">Nouveau dossier</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="folder-name">Nom</Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mariage Sara & Amine"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="folder-desc">Description</Label>
              <Textarea
                id="folder-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Lieu, date, notes…"
              />
            </div>
            <Button className="w-full rounded-full" onClick={createFolder}>
              Créer le dossier
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border-2 border-foreground bg-card p-5">
          <h2 className="font-display text-2xl uppercase tracking-tight">Dossiers</h2>
          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
          ) : folders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Aucun dossier pour le moment.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {folders.map((folder) => (
                <li
                  key={folder.id}
                  className={`flex items-center gap-2 rounded-2xl border-2 border-foreground px-3 py-2 ${
                    folder.id === activeId ? "bg-foreground text-cream" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(folder.id)}
                    className="min-w-0 flex-1 truncate text-left text-sm font-bold"
                  >
                    {folder.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => renameFolder(folder)}
                    className="text-xs underline underline-offset-2"
                  >
                    Renommer
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFolder(folder)}
                    aria-label={`Supprimer ${folder.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-5">
        {!active ? (
          <p className="rounded-3xl border-2 border-dashed border-foreground/40 p-8 text-center text-muted-foreground">
            Choisissez ou créez un dossier pour envoyer des photos.
          </p>
        ) : (
          <>
            <div className="rounded-3xl border-2 border-foreground bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl uppercase tracking-tight">{active.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {photos.length} photo(s) dans ce dossier
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {uploading ? "Envoi…" : "Envoyer des photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={uploadFiles}
                    disabled={uploading}
                  />
                </label>
                {photos.some((p) => !p.thumb_path) && (
                  <Button type="button" variant="outline" className="rounded-full" onClick={optimizeOld} disabled={uploading}>
                    Optimiser les anciennes photos
                  </Button>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo) => (
                  <figure
                    key={photo.id}
                    className="overflow-hidden rounded-2xl border-2 border-foreground"
                  >
                    <img
                      src={urls[photo.storage_path]}
                      alt={photo.file_name ?? "Photo"}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                    <figcaption className="flex items-center justify-between gap-2 border-t-2 border-foreground px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => setCover(photo)}
                        className="inline-flex items-center gap-1 text-xs font-bold"
                      >
                        <Star
                          className={`size-3.5 ${active.cover_photo_id === photo.id ? "fill-primary text-primary" : ""}`}
                        />
                        Couv.
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePhoto(photo)}
                        aria-label="Supprimer la photo"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border-2 border-foreground bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl uppercase tracking-tight">
                  Liens de téléchargement
                </h2>
                <Button variant="secondary" className="rounded-full" onClick={createShareLink}>
                  Créer un lien
                </Button>
              </div>
              {links.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Aucun lien. Créez-en un pour que le client télécharge ses photos.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li
                      key={link.id}
                      className="rounded-2xl border-2 border-foreground/20 p-3 text-sm"
                    >
                      <p className="font-bold">{link.label ?? "Lien client"}</p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        /partage/{link.token}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {link.is_active ? "Actif" : "Désactivé"}
                        {link.expires_at
                          ? ` · expire le ${new Date(link.expires_at).toLocaleDateString("fr-FR")}`
                          : " · sans expiration"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" className="rounded-full" onClick={() => copyLink(link)}>
                          <Copy className="size-3.5" /> Copier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => toggleLink(link)}
                        >
                          {link.is_active ? "Désactiver" : "Activer"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setExpiry(link)}
                        >
                          Expiration
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => deleteLink(link)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
