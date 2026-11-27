export const BOOKING_STATUSES = ["new", "confirmed", "done", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  done: "Terminée",
  cancelled: "Annulée",
};

export const MODY_PRICES = {
  weddings: [
    { photos: 30, price: 800 },
    { photos: 60, price: 1500 },
    { photos: 80, price: 2000 },
  ],
  studio: [
    { photos: 4, price: 200 },
    { photos: 8, price: 400 },
    { photos: 10, price: 500 },
  ],
  videoReel: 300,
} as const;

function formatPhotoPrices(packages: readonly { photos: number; price: number }[]) {
  return packages.map(({ photos, price }) => `${photos} photos ${price} dh`).join(" ; ");
}

export const MODY_FACTS = `
Mody est photographe (marque « Mody Photography », slogan « Every shoot is a masterpiece »), basé à Casablanca.
WhatsApp Pro : +212 6 45 91 47 16 (https://wa.me/212645914716).
Réseaux : TikTok @modyphotographer, Instagram @moomojr, Snapchat.

TARIFS (en dirhams, dh) :
Mariages & Baptême : ${formatPhotoPrices(MODY_PRICES.weddings)} ; Vidéo Réel ${MODY_PRICES.videoReel} dh.
Déplacement inclus partout à Casablanca. Hors Casablanca, le client assure les frais de transport.
Studio - Extérieurs : ${formatPhotoPrices(MODY_PRICES.studio)} ; Vidéo Réel ${MODY_PRICES.videoReel} dh.
Pour les shootings en extérieur, le client assure les frais de transport.
`.trim();
