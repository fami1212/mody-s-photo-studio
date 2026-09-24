import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera } from "lucide-react";

import modyLogo from "@/assets/mody-logo-transparent.png";
import { Button } from "@/components/ui/button";
import { listPublishedPosts } from "@/lib/gallery.functions";

export const Route = createFileRoute("/shootings/")({
  loader: () => listPublishedPosts(),
  head: () => ({
    meta: [
      { title: "Shootings — Mody Photography" },
      { name: "description", content: "Découvrez les derniers shootings photo publiés par Mody à Casablanca." },
      { property: "og:title", content: "Shootings — Mody Photography" },
      { property: "og:description", content: "Portraits, mariages, studio et extérieur : les dernières séries de Mody." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShootingsPage,
});

function ShootingsPage() {
  const { posts } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b-2 border-foreground px-4 py-4 sm:px-5">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4">
          <Link to="/" className="rounded-full bg-foreground px-3 py-1.5">
            <img src={modyLogo} alt="Mody Photography" className="h-7 w-auto" />
          </Link>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b-2 border-foreground bg-primary px-4 py-12 text-primary-foreground sm:px-5 sm:py-16">
          <div className="mx-auto max-w-[92rem]">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Journal photo</p>
            <h1 className="mt-3 max-w-5xl font-display text-6xl uppercase leading-[0.86] sm:text-8xl lg:text-9xl">
              Les shootings de Mody.
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-[92rem] px-4 py-10 sm:px-5 sm:py-16">
          {posts.length === 0 ? (
            <div className="border-y-2 border-foreground py-16 text-center">
              <Camera className="mx-auto size-10" aria-hidden="true" />
              <h2 className="mt-4 font-display text-3xl uppercase">Premier shooting bientôt</h2>
              <p className="mt-2 text-sm text-muted-foreground">Les prochaines séries publiées par Mody apparaîtront ici.</p>
            </div>
          ) : (
            <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <article key={post.slug} className={index % 3 === 1 ? "lg:translate-y-8" : ""}>
                  <Link to="/shootings/$slug" params={{ slug: post.slug }} className="group block">
                    <div className="overflow-hidden rounded-2xl border-2 border-foreground bg-muted">
                      {post.cover ? (
                        <img src={post.cover} alt={`Couverture du shooting ${post.title}`} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="grid aspect-[4/5] place-items-center bg-secondary">
                          <Camera className="size-12" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-4 pt-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{post.category ?? "Shooting"}</p>
                        <h2 className="mt-1 font-display text-3xl uppercase leading-none">{post.title}</h2>
                        {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
                      </div>
                      <ArrowRight className="mt-1 size-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}