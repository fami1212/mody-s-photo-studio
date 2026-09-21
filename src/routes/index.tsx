import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

import heroMody from "@/assets/hero-mody.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mody — Photographe" },
      {
        name: "description",
        content:
          "Portfolio de Mody, photographe : portraits, mode, rue et éditorial. Réservez votre séance.",
      },
      { property: "og:title", content: "Mody — Photographe" },
      {
        property: "og:description",
        content:
          "Portraits, mode, rue et éditorial — des images qui font s'arrêter le scroll.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
],
  }),
  component: Index,
});

const disciplines = [
  { label: "Portraits", dot: "text-tomato" },
  { label: "Mode", dot: "text-mint" },
  { label: "Rue", dot: "text-butter" },
  { label: "Éditorial", dot: "text-pink" },
  { label: "Marque", dot: "text-lilac" },
];

const frames = [
  { src: gallery1, alt: "Portrait mode sous néons, contre un mur de briques", bg: "bg-pink/50" },
  { src: gallery2, alt: "Scène de rue au soleil couchant, cycliste et ombres longues", bg: "bg-butter/60" },
  { src: gallery3, alt: "Nature morte en studio, bol en céramique sur chêne ancien", bg: "bg-mint/50" },
  { src: gallery4, alt: "Portrait éditorial sur un rooftop, rire spontané", bg: "bg-lilac/50" },
];

const services = [
  {
    title: "Journée portrait",
    body: "Demi-journée de séance, conseils de stylisme et 30 images retouchées livrées dans une galerie privée.",
    price: "à partir de 320 €",
    priceClass: "text-butter",
    cardClass: "bg-ink text-cream",
    bodyClass: "text-cream/70",
  },
  {
    title: "Kit de marque",
    body: "Produits, lifestyle et portraits de fondateurs accordés à votre palette et à votre voix.",
    price: "à partir de 900 €",
    priceClass: "text-cream",
    cardClass: "bg-tomato text-cream",
    bodyClass: "text-cream/80",
  },
  {
    title: "Éditorial complet",
    body: "Concept, équipe, repérage de lieux et direction artistique prête à imprimer, du début à la fin.",
    price: "sur devis",
    priceClass: "text-lilac",
    cardClass: "bg-card text-ink",
    bodyClass: "text-ink/70",
  },
];

function Index() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-body text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-5 pb-16 pt-12 sm:pt-16">
          <div className="mx-auto max-w-[92rem]">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-3 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/70">
                Photographe · Portraits & Éditorial
              </span>
            </div>
            <h1 className="font-display text-[clamp(3.5rem,15vw,12rem)] uppercase leading-[0.85] tracking-tight text-balance">
              <span className="rise block">Mody</span>
              <span className="rise block" style={{ animationDelay: "0.08s" }}>
                shoote le
              </span>
              <span className="rise block" style={{ animationDelay: "0.16s" }}>
                <span className="text-primary">fort</span> &amp; le
              </span>
              <span className="rise block" style={{ animationDelay: "0.24s" }}>
                doux.
              </span>
            </h1>

            <div className="mt-10 grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <img
                  src={heroMody}
                  alt="Portrait éditorial de Mody, appareil argentique en main, lumière chaude de studio"
                  width={1200}
                  height={760}
                  className="photo-frame aspect-[16/10] w-full rounded-3xl object-cover"
                />
              </div>
              <div className="flex flex-col justify-between gap-6 lg:col-span-4">
                <p className="max-w-[40ch] text-pretty text-base leading-relaxed text-foreground/80 sm:text-lg">
                  Je cherche l'image qui fait s'arrêter le scroll — portraits,
                  marques et histoires de rue, racontées avec de la vraie
                  lumière et zéro remplissage.
                </p>
                <a
                  href="#galerie"
                  className="inline-flex items-center justify-between gap-3 rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground ring-2 ring-foreground transition-transform hover:-translate-y-0.5"
                >
                  <span>Voir la galerie</span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-foreground text-primary">
                    ↓
                  </span>
                </a>
              </div>
            </div>
          </div>

          <div className="floaty absolute right-6 top-40 hidden size-24 place-items-center rounded-full bg-mint text-center text-[10px] font-bold uppercase leading-tight tracking-[0.15em] text-cream ring-2 ring-foreground md:grid lg:grid">
            <span>
              Dispo
              <br />
              2026
            </span>
          </div>
        </section>

        {/* Discipline marquee */}
        <div className="border-y-2 border-foreground bg-foreground py-4">
          <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-center gap-x-8 gap-y-1 px-5 text-sm font-bold uppercase tracking-[0.2em] text-cream/80">
            {disciplines.map((d, i) => (
              <span key={d.label} className="flex items-center gap-8">
                {i > 0 && <span className={d.dot}>✦</span>}
                <span>{d.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <section id="galerie" className="scroll-mt-20 px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-[92rem]">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-4xl uppercase leading-none tracking-tight text-balance sm:text-5xl">
                Images choisies
              </h2>
              <p className="max-w-[32ch] text-pretty text-sm font-medium text-muted-foreground">
                Une sélection de travaux récents — tournée en argentique et en
                numérique.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {frames.map((frame) => (
                <figure
                  key={frame.src}
                  className={`group w-full overflow-hidden rounded-2xl ${frame.bg} photo-frame`}
                >
                  <img
                    src={frame.src}
                    alt={frame.alt}
                    loading="lazy"
                    width={768}
                    height={1024}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-20 px-5 pb-16">
          <div className="mx-auto grid max-w-[92rem] gap-5 md:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className={`rounded-3xl p-7 ring-1 ring-black/5 ${s.cardClass}`}>
                <h3 className="font-display text-2xl uppercase tracking-tight">{s.title}</h3>
                <p className={`mt-3 max-w-[34ch] text-pretty text-sm leading-relaxed ${s.bodyClass}`}>
                  {s.body}
                </p>
                <p className={`mt-5 text-lg font-bold ${s.priceClass}`}>{s.price}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="scroll-mt-20 px-5 pb-20">
          <div className="mx-auto max-w-[92rem] rounded-[2rem] bg-mint p-8 ring-2 ring-foreground sm:p-12">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="font-display text-4xl uppercase leading-[0.9] tracking-tight text-balance text-cream sm:text-6xl">
                  Créons quelque
                  <br />
                  chose de fort.
                </h2>
                <p className="mt-4 max-w-[40ch] text-pretty text-base leading-relaxed text-cream/85">
                  Racontez-moi l'histoire que vous voulez raconter —
                  j'apporterai l'appareil, la lumière et l'audace.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <a
                  href="mailto:hello@mody.photo"
                  className="inline-flex items-center justify-center rounded-2xl bg-cream px-6 py-4 text-lg font-bold text-ink ring-2 ring-foreground transition-transform hover:-translate-y-0.5"
                >
                  hello@mody.photo
                </a>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-cream transition-transform hover:-translate-y-0.5"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://behance.net"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-cream transition-transform hover:-translate-y-0.5"
                  >
                    Behance
                  </a>
                  <a
                    href="https://vimeo.com"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-cream transition-transform hover:-translate-y-0.5"
                  >
                    Vimeo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-foreground px-5 py-8">
        <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">
            © 2026 Mody Photographie
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            Shot with patience &amp; good coffee.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[92rem] items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-2 ring-foreground">
            M
          </span>
          <span className="text-xl font-bold tracking-tight">Mody</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium sm:flex">
          <a href="#galerie" className="transition-colors hover:text-primary">
            Galerie
          </a>
          <a href="#services" className="transition-colors hover:text-primary">
            Services
          </a>
          <a href="#contact" className="transition-colors hover:text-primary">
            Contact
          </a>
        </nav>
        <a
          href="mailto:hello@mody.photo"
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-cream ring-1 ring-foreground transition-transform hover:-translate-y-0.5"
        >
          <span>Réserver une séance</span>
          <span className="shrink-0">→</span>
        </a>
      </div>
    </header>
  );
}
