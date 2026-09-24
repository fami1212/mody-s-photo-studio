import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Images, Loader2 } from "lucide-react";
import { useState } from "react";

import modyLogo from "@/assets/mody-logo-transparent.png";
import { Button } from "@/components/ui/button";
import { getSharedFolder } from "@/lib/gallery.functions";

export const Route = createFileRoute("/partage/$token")({
  loader: ({ params }) => getSharedFolder({ data: { token: params.token } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.status === "ok" ? `${loaderData.folder.name} — Mody Photography` : "Lien indisponible — Mody Photography" },
      { name: "description", content: "Galerie privée remise par Mody Photography." },
      { property: "og:title", content: "Galerie privée — Mody Photography" },
      { property: "og:description", content: "Accédez à vos photos et téléchargez-les depuis votre galerie privée." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SharedFolderPage,
});

function SharedFolderPage() {
  const result = Route.useLoaderData();
  const [downloading, setDownloading] = useState(false);

  if (result.status !== "ok") {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-center text-foreground">
        <div>
          <Images className="mx-auto size-10" aria-hidden="true" />
          <h1 className="mt-4 font-display text-5xl uppercase">Lien {result.status === "expired" ? "expiré" : "indisponible"}</h1>
          <p className="mt-3 text-muted-foreground">Demandez un nouveau lien à Mody pour accéder aux photos.</p>
          <Button asChild className="mt-6 rounded-full"><Link to="/">Voir le site de Mody</Link></Button>
        </div>
      </main>
    );
  }

  async function downloadAll() {
    if (result.status !== "ok" || result.photos.length === 0) return;
    setDownloading(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      await Promise.all(result.photos.map(async (photo, index) => {
        const response = await fetch(photo.downloadUrl);
        if (!response.ok) throw new Error("Téléchargement impossible");
        const fallback = `photo-${index + 1}.jpg`;
        zip.file(photo.fileName || fallback, await response.blob());
      }));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${result.folder.name.replace(/[^a-zA-Z0-9À-ÿ -]/g, "").trim() || "photos-mody"}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b-2 border-foreground px-4 py-4 sm:px-5">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4">
          <Link to="/" className="rounded-full bg-foreground px-3 py-1.5"><img src={modyLogo} alt="Mody Photography" className="h-7 w-auto" /></Link>
          <Button onClick={downloadAll} disabled={downloading || result.photos.length === 0} className="rounded-full">
            {downloading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
            <span className="hidden sm:inline">Tout télécharger</span>
            <span className="sm:hidden">Télécharger</span>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b-2 border-foreground bg-secondary px-4 py-10 sm:px-5 sm:py-14">
          <div className="mx-auto max-w-[92rem]">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Galerie privée{result.folder.label ? ` · ${result.folder.label}` : ""}</p>
            <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-7xl">{result.folder.name}</h1>
            {result.folder.description && <p className="mt-4 max-w-2xl text-muted-foreground">{result.folder.description}</p>}
            <p className="mt-5 text-sm font-bold">{result.photos.length} photo{result.photos.length > 1 ? "s" : ""}</p>
          </div>
        </section>

        <section className="mx-auto max-w-[92rem] px-4 py-8 sm:px-5 sm:py-12">
          {result.photos.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">Ce dossier ne contient pas encore de photos.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {result.photos.map((photo, index) => (
                <figure key={photo.id} className="group relative overflow-hidden rounded-xl border-2 border-foreground bg-muted">
                  <img src={photo.url} alt={`Photo ${index + 1} de ${result.folder.name}`} loading="lazy" className="aspect-square w-full object-cover" />
                  <Button asChild size="icon" className="absolute bottom-2 right-2 rounded-full" aria-label={`Télécharger la photo ${index + 1}`}>
                    <a href={photo.downloadUrl}><Download aria-hidden="true" /></a>
                  </Button>
                </figure>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}