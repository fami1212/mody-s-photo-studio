import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Camera, Copy, LockKeyhole, MessageCircle, Send, Sparkles } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";

import heroMody from "@/assets/hero-mody.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import modyLogo from "@/assets/mody-logo-transparent.png";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/ChatPanel";
import { submitBooking } from "@/lib/bookings.functions";
import { listRecentPublishedPhotos } from "@/lib/gallery.functions";

export const Route = createFileRoute("/")({
  loader: () => listRecentPublishedPhotos(),
  head: () => ({
    meta: [
      { title: "Mody — Photographe" },
      {
        name: "description",
        content:
          "Portfolio de Mody, photographe : portraits, mode, rue et éditorial. Réservez votre séance.",
      },
      { property: "og:title", content: "Mody Photography — Tarifs & réservation" },
      {
        property: "og:description",
        content:
          "Tarifs photo et vidéo de Mody à Casablanca, avec réservation dans l'app ou sur WhatsApp Pro.",
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

const WHATSAPP_NUMBER = "212645914716";
const WHATSAPP_DISPLAY = "+212 6 45 91 47 16";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const socialLinks = [
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@modyphotographer?_r=1&_t=ZS-95pzf6ZAyDH",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/moomojr?igsh=YmlmcHVwaTA4c3Rx&utm_source=qr",
  },
  {
    label: "Snap",
    href: "https://snapchat.com/t/5HuNVcAs",
  },
];

const frames = [
  { src: gallery1, alt: "Portrait mode sous néons, contre un mur de briques", bg: "bg-pink/50" },
  { src: gallery2, alt: "Scène de rue au soleil couchant, cycliste et ombres longues", bg: "bg-butter/60" },
  { src: gallery3, alt: "Nature morte en studio, bol en céramique sur chêne ancien", bg: "bg-mint/50" },
  { src: gallery4, alt: "Portrait éditorial sur un rooftop, rire spontané", bg: "bg-lilac/50" },
];

const services = [
  {
    title: "Studio & extérieurs",
    body: "Séances rapides ou complètes, en studio ou dehors, avec sélection retouchée et livraison prête à publier.",
    price: "à partir de 200dh",
    priceClass: "text-butter",
    cardClass: "bg-ink text-cream",
    bodyClass: "text-cream/70",
  },
  {
    title: "Mariages & baptêmes",
    body: "Reportage photo pour les moments familiaux, avec déplacement partout sur Casablanca.",
    price: "à partir de 800dh",
    priceClass: "text-cream",
    cardClass: "bg-tomato text-cream",
    bodyClass: "text-cream/80",
  },
  {
    title: "Vidéo Réel",
    body: "Un format court pensé pour TikTok, Instagram et Snap, dynamique et prêt pour les réseaux.",
    price: "300dh",
    priceClass: "text-lilac",
    cardClass: "bg-card text-ink",
    bodyClass: "text-ink/70",
  },
];

const pricingSections = [
  {
    title: "Mariages & Baptême",
    note: "Déplacement partout sur Casablanca. Hors Casablanca, les frais de transport sont à prévoir.",
    headerClass: "bg-foreground text-cream",
    offers: [
      { label: "30 Photos", price: "800dh" },
      { label: "60 Photos", price: "1500dh" },
      { label: "80 Photos", price: "2000dh" },
      { label: "Video Réel", price: "300dh" },
    ],
  },
  {
    title: "Studio - Extérieurs",
    note: "Pour les shootings extérieurs, les frais de transport sont à prévoir.",
    headerClass: "bg-primary text-primary-foreground",
    offers: [
      { label: "4 Photos", price: "200dh" },
      { label: "8 Photos", price: "400dh" },
      { label: "10 Photos", price: "500dh" },
      { label: "Video Réel", price: "300dh" },
    ],
  },
];

const allOffers = pricingSections.flatMap((section) =>
  section.offers.map((offer) => `${offer.label} — ${section.title} — ${offer.price}`),
);

const initialReservation = {
  nom: "",
  telephone: "",
  date: "",
  formule: allOffers[0] ?? "",
  message: "",
};

const reservationSchema = z.object({
  nom: z.string().trim().min(2, "Ajoutez un nom complet.").max(80, "Le nom est trop long."),
  telephone: z
    .string()
    .trim()
    .regex(/^[+0-9 ().-]{8,24}$/, "Ajoutez un numéro de téléphone valide."),
  date: z.string().trim().min(1, "Ajoutez une date ou une période." ).max(40, "La date est trop longue."),
  formule: z.string().trim().min(1, "Choisissez une formule." ).max(140, "La formule est trop longue."),
  message: z.string().trim().max(500, "Le message est trop long."),
});

function createWhatsappHref(formule: string, details?: typeof initialReservation) {
  const lines = [
    "Bonjour Mody, je veux réserver une séance photo.",
    `Formule : ${formule || "à choisir"}`,
    details?.nom.trim() ? `Nom : ${details.nom.trim()}` : "",
    details?.telephone.trim() ? `Téléphone : ${details.telephone.trim()}` : "",
    details?.date.trim() ? `Date souhaitée : ${details.date.trim()}` : "",
    details?.message.trim() ? `Message : ${details.message.trim()}` : "",
  ].filter(Boolean);

  return `${WHATSAPP_URL}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function Index() {
  const { photos: publishedPhotos } = Route.useLoaderData();
  const [reservation, setReservation] = useState(initialReservation);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  const whatsappHref = useMemo(
    () => createWhatsappHref(reservation.formule, reservation),
    [reservation],
  );

  function selectOffer(formule: string) {
    setReservation((current) => ({ ...current, formule }));
    setFeedback("");
    document.getElementById("reservation")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleReservationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = reservationSchema.safeParse(reservation);

    if (!result.success) {
      setFeedbackType("error");
      setFeedback(result.error.issues[0]?.message ?? "Vérifiez les informations de réservation.");
      return;
    }

    setReservation(result.data);
    try {
      const res = await submitBooking({
        data: {
          name: result.data.nom,
          phone: result.data.telephone,
          offer: result.data.formule,
          event_date: result.data.date,
          message: result.data.message,
        },
      });
      if (!res.ok) {
        setFeedbackType("error");
        setFeedback(res.error);
        return;
      }
      setFeedbackType("success");
      setFeedback("Demande envoyée à Mody ! Il vous recontacte vite. Vous pouvez aussi l'envoyer sur WhatsApp Pro.");
    } catch {
      setFeedbackType("error");
      setFeedback("Envoi impossible pour le moment. Utilisez le bouton WhatsApp.");
    }
  }

  async function copyReservation() {
    const text = decodeURIComponent(whatsappHref.split("text=")[1] ?? "");
    await navigator.clipboard.writeText(text);
    setFeedbackType("success");
    setFeedback("La demande de réservation est copiée.");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-body text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <Header />
      <ChatPanel
        mode="booking"
        title="Réserver avec l'assistant"
        greeting="Salut ! Je suis l'assistant de Mody. Je peux vous renseigner sur les tarifs et enregistrer votre réservation. Que souhaitez-vous shooter ?"
      />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-5 pb-16 pt-12 sm:pt-16">
          <div className="mx-auto max-w-[92rem]">
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded-full bg-foreground px-4 py-2 ring-2 ring-foreground">
                <img src={modyLogo} alt="Mody Photography" className="h-9 w-auto" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/70">
                Photographe · Casablanca
              </span>
            </div>
            <p className="mb-5 max-w-3xl font-display text-2xl uppercase leading-none text-primary sm:text-4xl">
              Every shoot is a masterpiece
            </p>
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
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Button asChild className="h-auto justify-between rounded-2xl px-6 py-4 text-lg ring-2 ring-foreground transition-transform hover:-translate-y-0.5">
                    <a href="#reservation">
                      <span>Réserver maintenant</span>
                      <MessageCircle aria-hidden="true" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="h-auto justify-between rounded-2xl px-6 py-4 text-lg ring-2 ring-foreground transition-transform hover:-translate-y-0.5">
                    <a href="#galerie">
                      <span>Voir la galerie</span>
                      <Camera aria-hidden="true" />
                    </a>
                  </Button>
                </div>
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
              {(publishedPhotos.length > 0 ? publishedPhotos : frames).slice(0, 8).map((frame) => {
                const isPublished = "url" in frame;
                const image = isPublished ? frame.url : frame.src;
                const content = (
                  <figure className={`group w-full overflow-hidden rounded-2xl ${isPublished ? "bg-muted" : frame.bg} photo-frame`}>
                    <img
                      src={image}
                      alt={isPublished ? "Shooting récent de Mody" : frame.alt}
                      loading="lazy"
                      width={768}
                      height={1024}
                      className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </figure>
                );
                return isPublished ? (
                  <Link key={frame.id} to="/shootings/$slug" params={{ slug: frame.slug }}>{content}</Link>
                ) : (
                  <div key={frame.src}>{content}</div>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end">
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/shootings">Tous les shootings <ArrowRight aria-hidden="true" /></Link>
              </Button>
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

        {/* Tarifs */}
        <section id="tarifs" className="scroll-mt-20 border-y-2 border-foreground bg-foreground px-5 py-16 text-cream sm:py-20">
          <div className="mx-auto max-w-[92rem]">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground">
                  <Sparkles aria-hidden="true" className="size-4" />
                  Tarifs officiels
                </p>
                <h2 className="font-display text-5xl uppercase leading-none text-balance sm:text-7xl">
                  Tarifs Mody
                </h2>
              </div>
              <p className="max-w-[35ch] text-pretty text-sm font-medium text-cream/75">
                Choisissez une formule, puis réservez directement dans l'app ou avec le WhatsApp Pro de Mody.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {pricingSections.map((section) => (
                <article key={section.title} className="overflow-hidden rounded-3xl border-2 border-cream bg-card text-foreground">
                  <div className={`${section.headerClass} p-6`}>
                    <h3 className="font-display text-4xl uppercase leading-none sm:text-5xl">{section.title}</h3>
                  </div>
                  <div className="divide-y-2 divide-foreground/15">
                    {section.offers.map((offer) => {
                      const formule = `${offer.label} — ${section.title} — ${offer.price}`;
                      return (
                        <div key={formule} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div className="flex items-center justify-between gap-5">
                            <p className="text-xl font-bold">{offer.label}</p>
                            <span className="h-2 min-w-16 flex-1 rounded-full bg-muted" />
                            <p className="text-2xl font-bold text-primary">{offer.price}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => selectOffer(formule)}>
                              <CalendarDays aria-hidden="true" />
                              App
                            </Button>
                            <Button asChild size="sm" className="rounded-full">
                              <a href={createWhatsappHref(formule)} target="_blank" rel="noreferrer">
                                <MessageCircle aria-hidden="true" />
                                WhatsApp
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="border-t-2 border-foreground/15 p-5 text-sm font-medium text-muted-foreground">
                    {section.note}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Reservation */}
        <section id="reservation" className="scroll-mt-24 px-5 py-16 sm:py-20">
          <div className="mx-auto grid min-w-0 max-w-[92rem] gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <div className="min-w-0">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cream">
                <Send aria-hidden="true" className="size-4" />
                Réservation
              </p>
              <h2 className="font-display text-5xl uppercase leading-none text-balance sm:text-7xl">
                Dans l'app ou WhatsApp Pro.
              </h2>
              <p className="mt-5 max-w-[42ch] text-pretty text-base leading-relaxed text-muted-foreground">
                Le formulaire prépare la demande dans l'app. Le bouton WhatsApp ouvre le message prêt à envoyer au numéro professionnel de Mody.
              </p>
              <div className="mt-6 rounded-3xl bg-foreground p-6 text-cream ring-2 ring-foreground">
                <img src={modyLogo} alt="Mody Photography" className="h-14 w-auto" />
                <p className="mt-5 break-words text-xl font-bold sm:text-3xl">{WHATSAPP_DISPLAY}</p>
              </div>
            </div>

            <form onSubmit={handleReservationSubmit} className="min-w-0 rounded-3xl border-2 border-foreground bg-card p-4 sm:p-7">
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  Nom
                  <input
                    value={reservation.nom}
                    onChange={(event) => setReservation((current) => ({ ...current, nom: event.target.value }))}
                    className="h-12 min-w-0 w-full rounded-xl border-2 border-foreground bg-background px-4 text-base font-medium outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Votre nom"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Téléphone
                  <input
                    value={reservation.telephone}
                    onChange={(event) => setReservation((current) => ({ ...current, telephone: event.target.value }))}
                    className="h-12 min-w-0 w-full rounded-xl border-2 border-foreground bg-background px-4 text-base font-medium outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+212 ..."
                  />
                </label>
              </div>

              <label className="mt-4 grid gap-2 text-sm font-bold">
                Formule
                <select
                  value={reservation.formule}
                  onChange={(event) => setReservation((current) => ({ ...current, formule: event.target.value }))}
                  className="h-12 min-w-0 w-full rounded-xl border-2 border-foreground bg-background px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary sm:px-4 sm:text-base"
                >
                  {allOffers.map((offer) => (
                    <option key={offer} value={offer}>
                      {offer}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 grid gap-2 text-sm font-bold">
                Date souhaitée
                <input
                  value={reservation.date}
                  onChange={(event) => setReservation((current) => ({ ...current, date: event.target.value }))}
                  className="h-12 min-w-0 w-full rounded-xl border-2 border-foreground bg-background px-4 text-base font-medium outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex : samedi prochain, 18h"
                />
              </label>

              <label className="mt-4 grid gap-2 text-sm font-bold">
                Message
                <textarea
                  value={reservation.message}
                  onChange={(event) => setReservation((current) => ({ ...current, message: event.target.value }))}
                  className="min-h-32 min-w-0 w-full resize-y rounded-xl border-2 border-foreground bg-background px-4 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Lieu, style voulu, nombre de personnes..."
                />
              </label>

              {feedback && (
                <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${feedbackType === "success" ? "bg-mint text-cream" : "bg-primary text-primary-foreground"}`}>
                  {feedback}
                </p>
              )}

              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Button type="submit" className="h-12 min-w-0 rounded-full px-4 text-sm sm:text-base">
                  <Send aria-hidden="true" />
                  Réserver dans l'app
                </Button>
                <Button asChild variant="secondary" className="h-12 min-w-0 rounded-full px-4 text-sm sm:text-base">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircle aria-hidden="true" />
                    WhatsApp Pro
                  </a>
                </Button>
                <Button type="button" variant="outline" className="h-12 rounded-full" onClick={copyReservation} aria-label="Copier la demande">
                  <Copy aria-hidden="true" />
                  <span className="md:hidden">Copier la demande</span>
                </Button>
              </div>
            </form>
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
                <Button asChild variant="secondary" className="h-auto rounded-2xl px-6 py-4 text-lg ring-2 ring-foreground transition-transform hover:-translate-y-0.5">
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                    <MessageCircle aria-hidden="true" />
                    {WHATSAPP_DISPLAY}
                  </a>
                </Button>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <Button key={social.label} asChild variant="outline" className="rounded-full bg-foreground text-cream hover:bg-primary hover:text-primary-foreground">
                      <a href={social.href} target="_blank" rel="noreferrer">
                        {social.label}
                      </a>
                    </Button>
                  ))}
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
          <p className="text-sm font-medium text-muted-foreground">Every shoot is a masterpiece.</p>
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
          <span className="rounded-full bg-foreground px-3 py-1.5 ring-2 ring-foreground">
            <img src={modyLogo} alt="Mody Photography" className="h-7 w-auto" />
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium sm:flex">
          <Link to="/shootings" className="transition-colors hover:text-primary">Shootings</Link>
          <a href="#galerie" className="transition-colors hover:text-primary">
            Galerie
          </a>
          <a href="#services" className="transition-colors hover:text-primary">
            Services
          </a>
          <a href="#tarifs" className="transition-colors hover:text-primary">
            Tarifs
          </a>
          <a href="#contact" className="transition-colors hover:text-primary">
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="hidden rounded-full lg:inline-flex" title="Espace Mody">
            <Link to="/admin" aria-label="Ouvrir l'espace Mody"><LockKeyhole aria-hidden="true" /></Link>
          </Button>
          <Button asChild className="rounded-full ring-1 ring-foreground transition-transform hover:-translate-y-0.5">
            <a href="#reservation"><span>Réserver</span><MessageCircle aria-hidden="true" /></a>
          </Button>
        </div>
      </div>
    </header>
  );
}
