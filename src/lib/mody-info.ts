export const BOOKING_STATUSES = ["new", "confirmed", "done", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  done: "Terminée",
  cancelled: "Annulée",
};

export const MODY_FACTS = `
Mody est photographe (marque « Mody Photography », slogan « Every shoot is a masterpiece »), basé à Casablanca.
WhatsApp Pro : +212 6 45 91 47 16 (https://wa.me/212645914716).
Réseaux : TikTok @modyphotographer, Instagram @moomojr, Snapchat.

TARIFS (en dirhams, dh) :
Mariages & Baptême : 30 photos 800 dh ; 60 photos 1500 dh ; 80 photos 2000 dh ; Vidéo Réel 300 dh.
Déplacement inclus partout à Casablanca. Hors Casablanca, le client assure les frais de transport.
Studio - Extérieurs : 4 photos 200 dh ; 8 photos 400 dh ; 10 photos 500 dh ; Vidéo Réel 300 dh.
Pour les shootings en extérieur, le client assure les frais de transport.
`.trim();
