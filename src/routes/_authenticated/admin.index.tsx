import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarCheck, FolderOpen, ImagePlus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

const cards = [
  {
    to: "/admin/reservations" as const,
    title: "Réservations",
    body: "Toutes les demandes reçues par le formulaire et l'assistant : statuts, notes et réponse WhatsApp.",
    icon: CalendarCheck,
    action: "Voir les demandes",
  },
  {
    to: "/admin/dossiers" as const,
    title: "Dossiers & photos",
    body: "Créez un dossier par shooting, envoyez les photos et générez un lien de téléchargement pour le client.",
    icon: FolderOpen,
    action: "Gérer les dossiers",
  },
  {
    to: "/admin/publications" as const,
    title: "Publications",
    body: "Publiez un shooting sur le site : titre, texte, catégorie et photos choisies dans un dossier.",
    icon: ImagePlus,
    action: "Gérer les publications",
  },
];

function AdminHome() {
  const { data: newCount = 0 } = useQuery({
    queryKey: ["bookings", "new-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      return count ?? 0;
    },
  });

  return (
    <main className="admin-page space-y-8">
      <header className="overflow-hidden rounded-[2rem] bg-foreground px-6 py-8 text-background sm:px-10 sm:py-11">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/65">Votre studio · Vue d’ensemble</p>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl uppercase leading-none tracking-tight sm:text-6xl">Bonjour Mody.</h1>
            <p className="mt-4 max-w-[50ch] text-pretty text-sm text-background/75 sm:text-base">
              Gérez vos clients, vos images et les publications de votre studio depuis un seul endroit.
            </p>
          </div>
          <Link
            to="/admin/reservations"
            className="admin-touch-target inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            {newCount > 0 ? `${newCount} demande${newCount > 1 ? "s" : ""} à traiter` : "Voir les réservations"}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Accès rapide</p>
            <h2 className="mt-1 font-display text-2xl uppercase tracking-tight sm:text-3xl">Que souhaitez-vous faire ?</h2>
          </div>
          {newCount > 0 && (
            <span className="hidden rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary sm:inline-flex">
              {newCount} nouvelle{newCount > 1 ? "s" : ""} réservation{newCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="admin-card group flex min-h-52 flex-col transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <card.icon aria-hidden="true" className="size-5" />
              </span>
              {card.to === "/admin/reservations" && newCount > 0 && (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  {newCount} nouvelle{newCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <h3 className="mt-5 font-display text-2xl uppercase tracking-tight">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold group-hover:text-primary">
              {card.action}<ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        ))}
        </div>
      </section>
    </main>
  );
}
