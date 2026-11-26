import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { signPreviewUrls } from "@/lib/admin-storage";
import { uploadMarketingImage } from "@/lib/marketing-images";
import heroMody from "@/assets/hero-mody.jpg";

export const Route = createFileRoute("/_authenticated/admin/accueil")({
  head: () => ({ meta: [
    { title: "Photo d’accueil — Admin Mody" },
    { name: "description", content: "Choix de la photo d’accueil de Mody Photography." },
    { property: "og:title", content: "Photo d’accueil — Admin Mody" },
    { property: "og:description", content: "Gestion de la photo d’accueil de Mody Photography." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: HomepageSettings,
});

function HomepageSettings() {
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [folderId, setFolderId] = useState("");
  const [photos, setPhotos] = useState<{ id: string; storage_path: string; display_path: string | null; thumb_path: string | null; file_name: string | null }[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [photoId, setPhotoId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(heroMody);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const [{ data: rows, error }, { data: appearance }] = await Promise.all([
        supabase.from("folders").select("id, name").order("created_at", { ascending: false }),
        supabase.from("site_appearance").select("hero_path").eq("id", "home").maybeSingle(),
      ]);
      if (error) toast.error(error.message);
      setFolders(rows ?? []);
      if (appearance?.hero_path) {
        const signed = await signPreviewUrls([appearance.hero_path]);
        setPreview(signed[appearance.hero_path] ?? heroMody);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPhotoId("");
    void (async () => {
      if (!folderId) { setPhotos([]); return; }
      const { data, error } = await supabase.from("photos").select("id, storage_path, display_path, thumb_path, file_name").eq("folder_id", folderId).order("position");
      if (error) return void toast.error(error.message);
      const rows = data ?? [];
      const signed = await signPreviewUrls(rows.map(p => p.thumb_path ?? p.display_path ?? p.storage_path));
      if (!cancelled) { setPhotos(rows); setUrls(signed); }
    })();
    return () => { cancelled = true; };
  }, [folderId]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function save(reset = false) {
    if (!reset && !file && !photoId) return void toast.error("Choisissez une photo.");
    setBusy(true);
    try {
      let heroPath: string | null = null;
      let sharePath: string | null = null;
      if (!reset) {
        let source: Blob | null = file;
        if (!source) {
          const photo = photos.find(p => p.id === photoId);
          if (!photo) throw new Error("Choisissez une photo.");
          const result = await supabase.storage.from("photos").download(photo.display_path ?? photo.storage_path);
          if (result.error) throw result.error;
          source = result.data;
        }
        if (!source) throw new Error("Photo indisponible");
        [heroPath, sharePath] = await Promise.all([uploadMarketingImage(source, "hero"), uploadMarketingImage(source, "share")]);
      }
      const { error } = await supabase.from("site_appearance").upsert({ id: "home", hero_path: heroPath, share_path: sharePath });
      if (error) throw error;
      if (heroPath) {
        const signed = await signPreviewUrls([heroPath]);
        setPreview(signed[heroPath] ?? heroMody);
      } else setPreview(heroMody);
      setFile(null); setPhotoId("");
      toast.success(reset ? "Photo d’origine restaurée." : "Photo d’accueil enregistrée.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Enregistrement impossible"); }
    finally { setBusy(false); }
  }

  return (
    <main className="admin-page space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Personnalisation du site</p>
        <h1 className="admin-page-title mt-2 font-display uppercase">Photo d’accueil</h1>
        <p className="mt-3 max-w-[60ch] text-sm text-muted-foreground sm:text-base">
          Choisissez l’image qui mettra votre studio en avant sur la page d’accueil.
        </p>
      </header>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <figure className="admin-card h-fit overflow-hidden p-2">
          <img src={preview} alt="Aperçu de la photo d’accueil" className="aspect-[16/10] w-full rounded-2xl bg-muted object-cover" />
          <figcaption className="px-3 py-3 text-xs font-medium text-muted-foreground">Aperçu de la couverture actuelle</figcaption>
        </figure>
        <section className="admin-card space-y-5">
          <div className="space-y-2">
            <Label htmlFor="hero-upload">Importer une photo</Label>
            <label htmlFor="hero-upload" className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/30 bg-muted/50 px-4 py-3 text-sm font-semibold transition hover:bg-muted">
              <Upload aria-hidden="true" className="size-4" />
              {file ? file.name : "Choisir une image JPG, PNG ou WebP"}
            </label>
            <input id="hero-upload" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={e => {
              const next = e.target.files?.[0];
              if (!next) return;
              if (!["image/jpeg", "image/png", "image/webp"].includes(next.type) || next.size > 20 * 1024 * 1024) return void toast.error("Choisissez une photo JPG, PNG ou WebP de moins de 20 Mo.");
              setFile(next); setPhotoId("");
            }} />
            <p className="text-xs text-muted-foreground">Taille maximale : 20 Mo.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-folder">Ou choisir dans un dossier</Label>
            <select id="hero-folder" value={folderId} onChange={e => setFolderId(e.target.value)} className="admin-touch-target w-full rounded-xl border border-input bg-background px-3 text-sm">
              <option value="">Choisir un dossier</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map(photo => <Button key={photo.id} variant="outline" aria-label={`Choisir ${photo.file_name ?? "la photo"}`} aria-pressed={photoId === photo.id} className={`h-auto min-w-0 overflow-hidden rounded-xl p-0 ${photoId === photo.id ? "ring-2 ring-primary" : ""}`} onClick={() => { setFile(null); setPhotoId(photo.id); setPreview(urls[photo.thumb_path ?? photo.display_path ?? photo.storage_path] ?? heroMody); }}>
                <img src={urls[photo.thumb_path ?? photo.display_path ?? photo.storage_path]} alt={photo.file_name ?? "Photo du dossier"} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
              </Button>)}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button className="admin-touch-target w-full" disabled={busy || (!file && !photoId)} onClick={() => save()}><Save /> {busy ? "Enregistrement…" : "Enregistrer la photo"}</Button>
            <Button variant="outline" className="admin-touch-target w-full" disabled={busy} onClick={() => save(true)}><RotateCcw /> Photo d’origine</Button>
          </div>
        </section>
      </div>
    </main>
  );
}