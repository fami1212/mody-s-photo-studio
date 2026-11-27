import { MODY_PRICES } from "./mody-info";

function formatPhotoPrices(packages: readonly { photos: number; price: number }[]) {
  return packages.map(({ photos, price }) => `${photos} photos : ${price} dh`).join(" ; ");
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function getPublicChatFaqAnswer(question: string) {
  const normalized = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const asksPrices = containsAny(normalized, [
    "tarif",
    "prix",
    "combien",
    "formule",
    "cout",
    "budget",
    "dh",
    "dirham",
  ]);
  const asksWedding = containsAny(normalized, ["mariage", "bapteme", "fianc", "noce"]);
  const asksStudio = containsAny(normalized, ["studio", "portrait", "exterieur"]);
  const asksVideo = containsAny(normalized, ["video", "reel"]);
  const asksAvailability = containsAny(normalized, [
    "disponible",
    "disponibilite",
    "libre",
    "agenda",
    "creneau",
    "samedi",
    "dimanche",
  ]);
  const asksTransport = containsAny(normalized, [
    "deplacement",
    "transport",
    "casablanca",
    "frais",
  ]);
  const asksBooking = containsAny(normalized, ["reserv", "rendez-vous", "book"]);
  const asksContact = containsAny(normalized, ["contact", "whatsapp", "telephone", "numero"]);
  const asksAboutOffers = asksPrices || asksWedding || asksStudio || asksVideo;
  const answers: string[] = [];

  if (asksAvailability) {
    answers.push(
      "Je ne peux pas consulter l’agenda de Mody ni confirmer un créneau. Pour vérifier une date, contactez-le directement sur WhatsApp : https://wa.me/212645914716.",
    );
  }

  if (asksAboutOffers) {
    if (asksWedding) {
      answers.push(
        `Mariages & baptêmes : ${formatPhotoPrices(MODY_PRICES.weddings)}. Vidéo Réel : ${MODY_PRICES.videoReel} dh.`,
      );
    }

    if (asksStudio) {
      answers.push(
        `Studio & extérieurs : ${formatPhotoPrices(MODY_PRICES.studio)}. Vidéo Réel : ${MODY_PRICES.videoReel} dh.`,
      );
    }

    if (asksVideo && !asksWedding && !asksStudio) {
      answers.push(`Vidéo Réel : ${MODY_PRICES.videoReel} dh.`);
    }

    if (!asksWedding && !asksStudio && !asksVideo) {
      answers.push(
        `Mariages & baptêmes : ${formatPhotoPrices(MODY_PRICES.weddings)}.\nStudio & extérieurs : ${formatPhotoPrices(MODY_PRICES.studio)}.\nVidéo Réel : ${MODY_PRICES.videoReel} dh.`,
      );
    }
  }

  if (asksTransport) {
    answers.push(
      "Les déplacements sont inclus partout à Casablanca pour les mariages et baptêmes. Hors Casablanca, les frais de transport sont à prévoir. Pour les séances en extérieur, les frais de transport sont également à prévoir.",
    );
  }

  if (asksBooking) {
    answers.push(
      "Pour réserver, utilisez le formulaire sur cette page ou contactez Mody sur WhatsApp : https://wa.me/212645914716. La réservation sera confirmée directement par Mody.",
    );
  } else if (asksContact) {
    answers.push("Vous pouvez joindre Mody au +212 6 45 91 47 16 : https://wa.me/212645914716.");
  }

  if (answers.length > 0) return answers.join("\n\n");

  if (containsAny(normalized, ["bonjour", "salut", "salam", "hello", "bonsoir"])) {
    return "Bonjour ! Je peux vous renseigner sur les tarifs mariage, baptême, studio et extérieur, les déplacements ou la réservation. Que souhaitez-vous savoir ?";
  }

  return "Je peux répondre aux questions sur les tarifs mariage et baptême, les séances studio et extérieur, les déplacements et la réservation. Pour une autre demande, contactez Mody sur WhatsApp : https://wa.me/212645914716.";
}
