import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";

import modyLogo from "@/assets/mody-logo-transparent.png";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/ChatPanel";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Espace admin — Mody Photography" },
      {
        name: "description",
        content: "Espace privé de Mody : dossiers photos, envois et publications de shootings.",
      },
      { property: "og:title", content: "Espace admin — Mody Photography" },
      { property: "og:description", content: "Gestion des dossiers photos et des publications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link to="/" className="rounded-full bg-foreground px-3 py-1.5">
            <img src={modyLogo} alt="Mody Photography" className="h-6 w-auto" />
          </Link>
          <nav className="order-3 flex w-full gap-2 overflow-x-auto text-sm font-bold sm:order-none sm:w-auto">
            <Link
              to="/admin/dossiers"
              className="whitespace-nowrap rounded-full border-2 border-foreground px-4 py-2"
              activeProps={{ className: "bg-foreground text-cream" }}
            >
              Dossiers
            </Link>
            <Link
              to="/admin/publications"
              className="whitespace-nowrap rounded-full border-2 border-foreground px-4 py-2"
              activeProps={{ className: "bg-foreground text-cream" }}
            >
              Publications
            </Link>
            <Link
              to="/admin/reservations"
              className="whitespace-nowrap rounded-full border-2 border-foreground px-4 py-2"
              activeProps={{ className: "bg-foreground text-cream" }}
            >
              Réservations
            </Link>
          </nav>
          <Button variant="outline" className="rounded-full" onClick={signOut}>
            Se déconnecter
          </Button>
        </div>
      </header>
      <Outlet />
      <ChatPanel
        mode="admin"
        title="Assistant Mody"
        greeting="Bonjour Mody ! Je peux résumer vos réservations, changer un statut, lister vos dossiers et liens, ou rédiger une publication ou une réponse WhatsApp."
      />
    </div>
  );
}
