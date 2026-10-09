import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Camera, Copy, LockKeyhole, MessageCircle, Send, Sparkles, ArrowUpRight, Menu, X, MapPin } from "lucide-react";
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
      { title: "Mody Photography — Photographe à Casablanca" },
      {
        name: "description",
        content:
          "Mody Photography à Casablanca. Découvrez les shootings, les tarifs studio, extérieurs et événements, et réservez votre séance.",
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
    body: "Votre portrait, votre style. En studio ou à ciel ouvert, prenez le temps de vous révéler.",
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
    body: "Le mouvement, l’énergie, l’instant. Un format court pour TikTok, Instagram et Snap.",
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
        <section className="home-hero relative isolate overflow-hidden bg-ink text-cream">
          <img src={heroMody} alt="Inspiration photographique : portrait avec un appareil argentique" width={1200} height={768} fetchPriority="high" decoding="async" className="home-hero-photo absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="home-hero-shade absolute inset-0 -z-10" />
          <div className="home-hero-content mx-auto flex h-full max-w-[92rem] flex-col justify-between px-5 py-8 sm:px-10 sm:py-10">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-xs font-bold uppercase">
              <span className="flex min-w-0 items-center gap-2"><MapPin className="size-4 shrink-0" /> Casablanca, Maroc</span>
              <span className="border-b border-cream/50 pb-1">Photo & vidéo</span>
            </div>
            <div className="max-w-2xl py-10">
              <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase text-butter"><span className="h-px w-8 bg-butter" /> Un regard. Votre histoire.</p>
              <h1 className="home-hero-title rise font-display uppercase">Mody<br /><span className="text-butter">Photography.</span></h1>
              <p className="mt-6 text-lg font-medium sm:text-2xl">Every shoot is a masterpiece</p>
              <p className="mt-3 max-w-[35ch] text-sm leading-relaxed text-cream/80 sm:text-base">Du studio aux grands jours. Des images qui vous ressemblent, des moments qui restent.</p>
              <div className="mt-8 grid max-w-sm gap-3 sm:flex sm:max-w-none">
                <Button asChild className="h-12 rounded-full px-6 font-bold"><a href="#reservation">Réserver une séance <ArrowUpRight aria-hidden="true" /></a></Button>
                <Button asChild variant="outline" className="h-12 rounded-full border-cream/60 bg-transparent px-6 text-cream hover:bg-cream hover:text-ink"><a href="#galerie">Explorer les images <ArrowRight aria-hidden="true" /></a></Button>
              </div>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-t border-cream/30 pt-4 text-xs text-cream/80">
              <span>Studio · Extérieurs · Mariages & baptêmes</span>
              <a href="#galerie" aria-label="Découvrir la galerie" className="grid size-9 shrink-0 place-items-center rounded-full border border-cream/50"><ArrowRight className="size-4 rotate-90" /></a>
            </div>
          </div>
        </section>

        {/* Discipline marquee */}
        <div className="border-y-2 border-foreground bg-foreground py-4">
          <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-center gap-x-8 gap-y-1 px-5 text-sm font-bold uppercase tracking-normal text-cream/80">
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
            <div className="mb-10 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div><p className="mb-3 text-xs font-bold uppercase text-primary">01 / Le portfolio</p><h2 className="font-display text-4xl uppercase leading-none tracking-normal text-balance sm:text-5xl">
                Le regard Mody.
              </h2></div>
              <p className="max-w-[32ch] text-pretty text-sm font-medium text-muted-foreground">
                Portraits, instants de vie et regards singuliers. L’univers de Mody, en images.
              </p>
            </div>

            <div className="home-gallery grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {(publishedPhotos.length > 0 ? publishedPhotos : frames).slice(0, 8).map((frame, index) => {
                const isPublished = "url" in frame;
                const image = isPublished ? frame.url : frame.src;
                const content = (
                  <figure className={`group w-full overflow-hidden rounded-lg ${isPublished ? "bg-muted" : frame.bg} photo-frame`}>
                    <img
                      src={image}
                      alt={isPublished ? "Shooting récent de Mody" : frame.alt}
                      loading="lazy"
                      width={768}
                      height={1024}
                      decoding="async"
                      className="home-gallery-image aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </figure>
                );
                return isPublished ? (
                  <Link className="home-gallery-item group min-w-0" key={frame.id} to="/shootings/$slug" params={{ slug: frame.slug }}>{content}<div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><span className="text-sm font-bold">Shooting {String(index + 1).padStart(2, "0")}</span><ArrowUpRight className="size-4" /></div><p className="mt-1 text-xs text-muted-foreground">Voir la série</p></Link>
                ) : (
                  <div className="home-gallery-item min-w-0" key={frame.src}>{content}<div className="mt-3 flex justify-between text-sm font-bold"><span>{["Portrait", "Instants de rue", "Studio", "Éditorial"][index % 4]}</span><span className="text-muted-foreground">0{index + 1}</span></div></div>
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
        <section id="services" className="scroll-mt-20 border-t border-foreground/15 px-5 py-12">
          <div className="mx-auto grid max-w-[92rem] gap-5 md:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className={`rounded-lg p-7 ${s.cardClass}`}>
                <h3 className="font-display text-2xl uppercase tracking-normal">{s.title}</h3>
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
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-normal text-primary-foreground">
                  <Sparkles aria-hidden="true" className="size-4" />
                  Tarifs officiels
                </p>
                <h2 className="font-display text-5xl uppercase leading-none text-balance sm:text-7xl">
                  Tarifs Mody
                </h2>
              </div>
              <p className="max-w-[35ch] text-pretty text-sm font-medium text-cream/75">
                Un portrait ou un grand jour ? Trouvez la formule qui vous correspond.
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
                          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                            <p className="text-xl font-bold">{offer.label}</p>
                            <span className="h-px min-w-0 flex-1 bg-foreground/15" />
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
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-normal text-cream">
                <Send aria-hidden="true" className="size-4" />
                Réservation
              </p>
              <h2 className="font-display text-5xl uppercase leading-none text-balance sm:text-7xl">
                Votre prochain<br />shooting commence ici.
              </h2>
              <p className="mt-5 max-w-[42ch] text-pretty text-base leading-relaxed text-muted-foreground">
                Une date, une idée, une envie ? Parlons de votre séance. Mody vous recontactera pour confirmer les détails.
              </p>
              <div className="mt-8 border-t border-foreground/20 py-6">
                <p className="text-xs font-bold uppercase text-muted-foreground">Vous préférez en parler ?</p>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-3 text-xl font-bold hover:text-primary sm:text-2xl"><MessageCircle className="size-5 shrink-0" />{WHATSAPP_DISPLAY}</a>
              </div>
            </div>

            <form onSubmit={handleReservationSubmit} className="min-w-0 border-t-2 border-foreground pt-6">
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  Nom
                  <input
                    value={reservation.nom}
                    onChange={(event) => setReservation((current) => ({ ...current, nom: event.target.value }))}
                    className="h-12 min-w-0 w-full rounded-xl border-2 border-foreground bg-background px-4 text-base font-medium outline-none focus:ring-2 focus:ring-primary"
                    autoComplete="name"
                    placeholder="Votre nom"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Téléphone
                  <input
                    value={reservation.telephone}
                    onChange={(event) => setReservation((current) => ({ ...current, telephone: event.target.value }))}
                    className="h-12 min-w-0 w-full rounded-xl border-2 border-foreground bg-background px-4 text-base font-medium outline-none focus:ring-2 focus:ring-primary"
                    type="tel"
                    autoComplete="tel"
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

              <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Button type="submit" className="h-12 min-w-0 rounded-full px-4 text-sm sm:text-base">
                  <Send aria-hidden="true" />
                  Envoyer ma demande
                </Button>
                <Button asChild variant="secondary" className="h-12 min-w-0 rounded-full px-4 text-sm sm:text-base sm:col-start-1">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircle aria-hidden="true" />
                    WhatsApp Pro
                  </a>
                </Button>
                <Button type="button" variant="outline" className="h-12 rounded-full sm:col-start-2 sm:row-start-1" onClick={copyReservation} aria-label="Copier la demande">
                  <Copy aria-hidden="true" />
                  <span className="sm:hidden">Copier la demande</span>
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="scroll-mt-20 border-y-2 border-foreground bg-mint px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-[92rem]">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="font-display text-4xl uppercase leading-[0.9] tracking-normal text-balance text-ink sm:text-6xl">
                  Créons quelque
                  <br />
                  chose de fort.
                </h2>
                <p className="mt-4 max-w-[40ch] text-pretty text-base leading-relaxed text-ink/80">
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
          <div className="flex items-center gap-4"><p className="text-sm font-medium text-muted-foreground">Every shoot is a masterpiece.</p><Button asChild variant="ghost" size="icon" title="Espace Mody"><Link to="/admin" aria-label="Ouvrir l’espace Mody"><LockKeyhole className="size-4" /></Link></Button></div>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/20 bg-background/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-[92rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:flex sm:justify-between sm:px-10">
        <Link to="/" className="min-w-0" aria-label="Mody Photography, accueil"><span className="inline-block rounded-full bg-ink px-3 py-1.5"><img src={modyLogo} alt="Mody Photography" className="h-7 w-auto" /></span></Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-6 text-sm font-medium lg:flex">
          <a href="#galerie" className="hover:text-primary">Portfolio</a>
          <Link to="/shootings" className="hover:text-primary">Shootings</Link>
          <a href="#services" className="hover:text-primary">Séances</a>
          <a href="#tarifs" className="hover:text-primary">Tarifs</a>
          <a href="#contact" className="hover:text-primary">Contact</a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild className="h-10 rounded-full px-4 font-bold"><a href="#reservation" onClick={closeMenu}>Réserver <ArrowUpRight aria-hidden="true" /></a></Button>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen} aria-controls="home-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</Button>
        </div>
      </div>
      {menuOpen && <nav id="home-mobile-nav" aria-label="Navigation mobile" className="grid border-t border-foreground/15 px-5 pb-5 pt-2 text-base font-medium lg:hidden">
        <a href="#galerie" onClick={closeMenu} className="py-3">Portfolio</a>
        <Link to="/shootings" onClick={closeMenu} className="py-3">Shootings</Link>
        <a href="#services" onClick={closeMenu} className="py-3">Séances</a>
        <a href="#tarifs" onClick={closeMenu} className="py-3">Tarifs</a>
        <a href="#contact" onClick={closeMenu} className="py-3">Contact</a>
      </nav>}
    </header>
  );
}
