import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { CalendarDays, FolderOpen, Home, ImagePlus, LayoutDashboard, LogOut } from "lucide-react";

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

const adminNavigation = [
  { to: "/admin" as const, label: "Tableau", icon: LayoutDashboard },
  { to: "/admin/accueil" as const, label: "Accueil", icon: Home },
  { to: "/admin/dossiers" as const, label: "Dossiers", icon: FolderOpen },
  { to: "/admin/publications" as const, label: "Publications", icon: ImagePlus },
  { to: "/admin/reservations" as const, label: "Réservations", icon: CalendarDays },
];

function AdminLayout() {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="admin-shell font-body text-foreground">
      <header className="admin-topbar">
        <div className="mx-auto grid max-w-[92rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <Link to="/admin" className="inline-flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-foreground p-2.5">
              <img src={modyLogo} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">Mody Photography</span>
              <span className="block text-xs text-muted-foreground">Espace studio</span>
            </span>
          </Link>
          <nav
            aria-label="Navigation admin"
            className="admin-nav-scroll col-span-2 flex min-w-0 gap-1 overflow-x-auto md:col-span-1 md:justify-center"
          >
            {adminNavigation.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                {...(to === "/admin" ? { activeOptions: { exact: true } } : {})}
                activeProps={{ className: "bg-foreground text-background" }}
                className="admin-nav-link admin-touch-target flex min-w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 px-2 py-1.5 text-[0.68rem] font-semibold sm:min-w-[5.25rem] md:min-w-0 md:flex-row md:gap-2 md:px-3 md:text-xs"
              >
                <Icon aria-hidden="true" className="size-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <Button
            variant="ghost"
            className="admin-touch-target gap-2 px-2 sm:px-3"
            onClick={signOut}
            aria-label="Se déconnecter"
          >
            <LogOut aria-hidden="true" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>
      </header>
      <Outlet />
      <ChatPanel
        mode="admin"
        title="Assistant Mody"
        greeting="Bonjour Mody ! Je fonctionne sans IA externe ni crédits. Je peux résumer vos réservations, lister les dossiers et liens actifs, préparer des textes modèles, et guider le changement d’un statut avec confirmation."
      />
    </div>
  );
}
