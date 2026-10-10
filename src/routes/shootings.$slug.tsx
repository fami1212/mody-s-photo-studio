import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Camera } from "lucide-react";

import modyLogo from "@/assets/mody-logo-transparent.png";
import { Button } from "@/components/ui/button";
import { getPublishedPost } from "@/lib/gallery.functions";
import { getRequestOrigin } from "@/lib/origin.functions";
import { shootingDescription } from "@/lib/marketing-images";

export const Route = createFileRoute("/shootings/$slug")({
  loader: async ({ params }) => {
    const [result, origin] = await Promise.all([getPublishedPost({ data: { slug: params.slug } }), getRequestOrigin()]);
    if (!result.post) throw notFound();
    return { ...result.post, origin };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title}${loaderData.category ? ` · ${loaderData.category}` : ""} — Mody Photography` : "Shooting indisponible — Mody Photography";
    const description = loaderData?.seoDescription || shootingDescription(loaderData?.title ?? "Shooting", loaderData?.category, loaderData?.body);
    const image = loaderData?.hasShareImage ? new URL(`/api/public/media?kind=shooting&slug=${encodeURIComponent(loaderData.slug)}`, loaderData.origin).href : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { property: "og:url", content: `/shootings/${loaderData?.slug ?? ""}` },
        { property: "og:locale", content: "fr_MA" },
        ...(image?.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
              { property: "og:image:width", content: "1200" },
              { property: "og:image:height", content: "630" },
              { property: "og:image:alt", content: loaderData?.title ?? "Shooting Mody Photography" },
              { name: "twitter:image:alt", content: loaderData?.title ?? "Shooting Mody Photography" },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: `/shootings/${loaderData?.slug ?? ""}` }],
    };
  },
  notFoundComponent: ShootingNotFound,
  component: ShootingPage,
});

function ShootingPage() {
  const post = Route.useLoaderData();
  const date = post.shotOn
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(`${post.shotOn}T12:00:00`))
    : null;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b-2 border-foreground px-4 py-4 sm:px-5">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4">
          <Link to="/" className="rounded-full bg-foreground px-3 py-1.5">
            <img src={modyLogo} alt="Mody Photography" className="h-7 w-auto" />
          </Link>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/shootings"><ArrowLeft aria-hidden="true" /> Tous les shootings</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b-2 border-foreground px-4 py-12 sm:px-5 sm:py-16">
          <div className="mx-auto max-w-[92rem]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{post.category ?? "Shooting"}</p>
            <h1 className="mt-3 max-w-6xl font-display text-6xl uppercase leading-[0.86] sm:text-8xl lg:text-9xl">{post.title}</h1>
            <div className="mt-7 grid gap-6 md:grid-cols-[1fr_2fr]">
              <div className="flex items-center gap-2 text-sm font-bold">
                {date && <><CalendarDays className="size-4" aria-hidden="true" /> {date}</>}
              </div>
              {post.body && <p className="max-w-3xl whitespace-pre-line text-base leading-relaxed text-muted-foreground sm:text-lg">{post.body}</p>}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[92rem] px-4 py-8 sm:px-5 sm:py-12">
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {post.photos.map((photo, index) => (
              <figure key={photo.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border-2 border-foreground bg-muted">
                <img src={photo.url} alt={`${post.title} — photo ${index + 1}`} loading={index < 3 ? "eager" : "lazy"} className="h-auto w-full object-cover" />
              </figure>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ShootingNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 text-center text-foreground">
      <div>
        <Camera className="mx-auto size-10" aria-hidden="true" />
        <h1 className="mt-4 font-display text-5xl uppercase">Shooting introuvable</h1>
        <p className="mt-3 text-muted-foreground">Cette série n'est plus publiée ou n'existe pas.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/shootings">Voir les shootings</Link></Button>
      </div>
    </main>
  );
}