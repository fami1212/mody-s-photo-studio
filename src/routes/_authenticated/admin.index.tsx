import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

const cards = [
  {
    to: "/admin/dossiers" as const,
    title: "Dossiers & photos",
    body: "Créez un dossier par shooting, envoyez les photos et générez un lien de téléchargement pour le client.",
  },
  {
    to: "/admin/publications" as const,
    title: "Publications",
    body: "Publiez un shooting sur le site : titre, texte, catégorie et photos choisies dans un dossier.",
  },
];

function AdminHome() {
  return (
    <main className="mx-auto max-w-[92rem] px-4 py-10 sm:px-5 sm:py-14">
      <h1 className="font-display text-4xl uppercase leading-none tracking-tight sm:text-6xl">
        Espace de Mody
      </h1>
      <p className="mt-4 max-w-[50ch] text-pretty text-muted-foreground">
        Tout ce que vous ajoutez ici apparaît automatiquement sur le site public.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-3xl border-2 border-foreground bg-card p-6 transition-transform hover:-translate-y-0.5"
          >
            <h2 className="font-display text-2xl uppercase tracking-tight">{card.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
