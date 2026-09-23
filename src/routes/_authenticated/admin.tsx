import { createFileRoute, Link } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Espace admin — Mody" },
      { name: "description", content: "Espace privé de Mody : dossiers, photos et publications." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Espace admin — Mody" },
      { property: "og:description", content: "Espace privé de gestion des shootings." },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const { user } = Route.useRouteContext();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-muted-foreground">Connecté en tant que {user?.email}</p>
        <h1 className="mt-2 text-4xl font-bold text-foreground">Espace admin</h1>
        <p className="mt-4 text-muted-foreground">
          Les dossiers, l'envoi de photos et les publications arrivent ici.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm font-medium"
          >
            Voir le site
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </main>
  );
}
