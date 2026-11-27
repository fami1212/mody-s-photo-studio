import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import type { Database } from "@/integrations/supabase/types";
import { getSupabasePublicConfig } from "@/lib/public-media.server";
import { BOOKING_STATUSES, MODY_PRICES, STATUS_LABELS, type BookingStatus } from "@/lib/mody-info";

type AdminMessage = { role?: unknown; parts?: unknown };
type AdminClient = SupabaseClient<Database>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getMessageText(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value["parts"])) return "";
  return value["parts"]
    .filter(
      (part): part is { type: "text"; text: string } =>
        isRecord(part) && part["type"] === "text" && typeof part["text"] === "string",
    )
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hasTerm(text: string, term: string) {
  return new RegExp(
    `(^|[^a-z0-9])${normalize(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`,
  ).test(text);
}

const STATUS_TERMS: Record<BookingStatus, string[]> = {
  new: ["nouvelle", "nouveau", "new", "a traiter"],
  confirmed: ["confirmee", "confirme", "confirmed", "acceptee", "accepte"],
  done: ["terminee", "termine", "done", "effectuee"],
  cancelled: ["annulee", "annule", "cancelled", "canceled"],
};

function findStatus(text: string): BookingStatus | null {
  const normalized = normalize(text);
  const matches = BOOKING_STATUSES.filter((status) =>
    STATUS_TERMS[status].some((term) => hasTerm(normalized, term)),
  );
  return matches.length === 1 ? (matches[0] ?? null) : null;
}

function findNameMatches<T extends { name: string }>(text: string, rows: T[]) {
  const normalized = normalize(text);
  return rows.filter((row) => {
    const name = normalize(row.name);
    if (!name) return false;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(normalized);
  });
}

function userClient(token: string): AdminClient | null {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  return createClient<Database>(config.url, config.key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

function chatResponse(text: string) {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const id = "admin-answer";
      writer.write({ type: "start" });
      writer.write({ type: "start-step" });
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: text });
      writer.write({ type: "text-end", id });
      writer.write({ type: "finish-step" });
      writer.write({ type: "finish", finishReason: "stop" });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

function helpText() {
  return [
    "Je fonctionne sans IA externe ni crédits. Je peux exécuter des commandes simples et préparer des textes modèles :",
    "• « Résume les réservations »",
    "• « Liste les réservations nouvelles »",
    "• « Liste mes dossiers et les liens actifs »",
    "• « Change le statut de [nom complet] en confirmée »",
    "• « Rédige une publication mariage »",
    "• « Prépare une réponse WhatsApp pour [nom du client] »",
    "Pour un changement de statut, je fournis une commande de confirmation à recopier avant toute modification.",
  ].join("\n");
}

function buildPublicationDraft(question: string) {
  const normalized = normalize(question);
  const category = (
    [
      ["Mariage", ["mariage", "maries", "couple"]],
      ["Baptême", ["bapteme"]],
      ["Studio", ["studio", "portrait"]],
      ["Extérieur", ["exterieur", "plein air"]],
      ["Éditorial", ["editorial", "mode"]],
    ] as const
  ).find(([, terms]) => terms.some((term) => normalized.includes(term)))?.[0];

  if (!category) {
    return "Quel type de publication souhaitez-vous préparer : Mariage, Baptême, Studio, Extérieur ou Éditorial ?";
  }

  const titles: Record<typeof category, string> = {
    Mariage: "Un jour, une histoire à chérir",
    Baptême: "Un moment précieux en images",
    Studio: "Un portrait qui vous ressemble",
    Extérieur: "La lumière comme décor",
    Éditorial: "Une vision, une image",
  };
  const title = /\btitre\s*[:=]\s*([^\n.!?]+)/i.exec(question)?.[1]?.trim() || titles[category];
  const caption =
    category === "Mariage"
      ? "Des regards, des promesses et des instants précieux : chaque détail raconte votre histoire."
      : category === "Baptême"
        ? "Une journée remplie d’émotion, de famille et de souvenirs à garder près de soi."
        : category === "Studio"
          ? "Une séance pensée autour de votre style, pour révéler votre personnalité en images."
          : category === "Extérieur"
            ? "Une lumière naturelle, un lieu qui vous ressemble et des images prises sur le vif."
            : "Une direction artistique affirmée, des détails soignés et une histoire racontée en images.";

  return `Brouillon de publication — à personnaliser\n\nTitre : ${title}\nCatégorie : ${category}\nTexte : ${caption} Mody Photography — Casablanca.\n\n#ModyPhotography #Casablanca #${category.replace(/[^a-zA-ZÀ-ÿ]/g, "")}`;
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("00")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? `212${digits.slice(1)}`
      : digits;
  return international.length >= 8 && international.length <= 15 ? international : null;
}

function buildWhatsAppDraft(
  question: string,
  booking?: {
    name: string;
    phone: string;
    offer: string | null;
    event_date: string | null;
    location: string | null;
  },
) {
  const normalized = normalize(question);
  const name = booking?.name ?? "[Prénom du client]";
  const details = [
    booking?.offer ? `pour la formule ${booking.offer}` : "",
    booking?.event_date ? `pour le ${booking.event_date}` : "",
    booking?.location ? `à ${booking.location}` : "",
  ].filter(Boolean);
  const message =
    normalized.includes("tarif") || normalized.includes("prix")
      ? `Bonjour ${name} ! Merci pour votre message. Les séances studio et extérieur commencent à ${MODY_PRICES.studio[0].price} dh ; les formules mariage et baptême commencent à ${MODY_PRICES.weddings[0].price} dh. Quel type de séance vous intéresse ?`
      : normalized.includes("disponible") ||
          normalized.includes("date") ||
          normalized.includes("samedi")
        ? `Bonjour ${name} ! Merci pour votre demande${details.length ? ` ${details.join(" ")}` : ""}. Je vérifie mon agenda et reviens vers vous pour confirmer la disponibilité. À bientôt, Mody.`
        : `Bonjour ${name} ! Merci pour votre message${details.length ? ` ${details.join(" ")}` : ""}. Je reviens vers vous rapidement pour organiser votre séance. À bientôt, Mody.`;
  const phone = booking ? normalizePhone(booking.phone) : null;
  const link = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;
  return `Brouillon à copier dans WhatsApp :\n\n${message}${link ? `\n\nOuvrir la conversation : ${link}` : "\n\nIndiquez le numéro du client pour générer un lien WhatsApp direct."}`;
}

async function respondToAdmin(
  db: AdminClient,
  question: string,
  messages: unknown[],
  origin: string,
) {
  const normalized = normalize(question);
  const confirmation = /^confirmer\s+([0-9a-f-]{36})\s+(new|confirmed|done|cancelled)$/i.exec(
    question.trim(),
  );
  if (confirmation) {
    const id = confirmation[1];
    const status = confirmation[2]?.toLowerCase() as BookingStatus | undefined;
    if (!id || !status || !BOOKING_STATUSES.includes(status)) {
      return "Commande de confirmation invalide. Demandez à nouveau le changement de statut.";
    }
    const proposal = `confirmer ${id} ${status}`;
    const hasProposal = messages.slice(0, -1).some((message) => {
      if (!isRecord(message) || message["role"] !== "assistant") return false;
      return normalize(getMessageText(message)).includes(normalize(proposal));
    });
    if (!hasProposal) {
      return "Je n’ai trouvé aucune proposition correspondante à confirmer. Demandez d’abord le changement de statut.";
    }

    const { data, error } = await db
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select("name,status")
      .maybeSingle();
    if (error) {
      console.error("[admin-chat] Booking status update failed", error);
      return new Response(
        "Modification impossible. Vérifiez les droits admin sur les réservations.",
        {
          status: 503,
        },
      );
    }
    if (!data) return "Réservation introuvable ; aucun changement effectué.";
    return `Statut modifié : ${data.name} est maintenant « ${STATUS_LABELS[data.status as BookingStatus] ?? data.status} ».`;
  }

  if (
    /(^|[^a-z])(resume|bilan|statistique|combien)([^a-z]|$)/.test(normalized) &&
    normalized.includes("reserv")
  ) {
    const [total, ...counts] = await Promise.all([
      db.from("bookings").select("id", { count: "exact", head: true }),
      ...BOOKING_STATUSES.map((status) =>
        db.from("bookings").select("id", { count: "exact", head: true }).eq("status", status),
      ),
    ]);
    const errors = [total.error, ...counts.map((result) => result.error)].filter(Boolean);
    if (errors.length) {
      console.error("[admin-chat] Booking summary failed", errors);
      return new Response("Résumé indisponible. Vérifiez l’accès admin aux réservations.", {
        status: 503,
      });
    }
    return `Résumé des réservations (${total.count ?? 0} au total) :\n${BOOKING_STATUSES.map(
      (status, index) => `• ${STATUS_LABELS[status]} : ${counts[index]?.count ?? 0}`,
    ).join("\n")}`;
  }

  const asksFolders = /dossier|galerie|lien de partage|liens actifs/.test(normalized);
  if (asksFolders) {
    const { data, error } = await db
      .from("folders")
      .select(
        "id,name,created_at,photos!photos_folder_id_fkey(count),share_links(label,is_active,expires_at,token)",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("[admin-chat] Folder listing failed", error);
      return new Response("Dossiers indisponibles. Vérifiez l’accès admin aux galeries.", {
        status: 503,
      });
    }
    const now = Date.now();
    if (!data?.length) return "Aucun dossier photo n’est enregistré.";
    return data
      .map((folder) => {
        const links = (folder.share_links ?? []).filter(
          (link) =>
            link.is_active && (!link.expires_at || new Date(link.expires_at).getTime() >= now),
        );
        const linkText = links.length
          ? links
              .map(
                (link) =>
                  `  - ${link.label || "Lien"} : ${new URL(`/partage/${encodeURIComponent(link.token)}`, origin).toString()}`,
              )
              .join("\n")
          : "  - Aucun lien de partage actif";
        return `${folder.name} — ${folder.photos?.[0]?.count ?? 0} photos\n${linkText}`;
      })
      .join("\n\n");
  }

  const requestsStatusChange =
    /change|changer|passe|passer|mets|met|mettre|marque|marquer|annule|annuler|confirme|confirmer/.test(
      normalized,
    ) && /reserv|statut|booking/.test(normalized);
  if (requestsStatusChange) {
    const status = findStatus(question);
    if (!status) {
      return "Indiquez le nouveau statut : nouvelle, confirmée, terminée ou annulée.";
    }
    const { data, error } = await db
      .from("bookings")
      .select("id,name")
      .order("created_at", { ascending: false })
      .limit(250);
    if (error) {
      console.error("[admin-chat] Booking lookup failed", error);
      return new Response("Réservations indisponibles. Vérifiez l’accès admin.", { status: 503 });
    }
    const matches = findNameMatches(question, data ?? []);
    if (matches.length !== 1) {
      return matches.length
        ? `Plusieurs clients correspondent. Précisez le nom complet : ${matches.map((booking) => booking.name).join(", ")}.`
        : "Je n’ai pas identifié la réservation. Reformulez avec le nom complet du client et le statut souhaité.";
    }
    const booking = matches[0];
    if (!booking) return "Réservation introuvable.";
    const command = `CONFIRMER ${booking.id} ${status}`;
    return `Je vais passer la réservation de ${booking.name} au statut « ${STATUS_LABELS[status]} ». Aucun changement n’est encore effectué.\nPour confirmer, répondez exactement : ${command}`;
  }

  if (
    /reserv/.test(normalized) &&
    /liste|affiche|montre|dernier|recent|detail|demande/.test(normalized)
  ) {
    const status = findStatus(question);
    let query = db
      .from("bookings")
      .select("name,offer,event_date,status,created_at")
      .order("created_at", { ascending: false })
      .limit(25);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) {
      console.error("[admin-chat] Booking list failed", error);
      return new Response("Réservations indisponibles. Vérifiez l’accès admin.", { status: 503 });
    }
    if (!data?.length) return "Aucune réservation ne correspond à ce filtre.";
    return `Réservations${status ? ` — ${STATUS_LABELS[status]}` : ""} :\n${data
      .map(
        (booking) =>
          `• ${booking.name} — ${STATUS_LABELS[booking.status as BookingStatus] ?? booking.status}${booking.offer ? ` — ${booking.offer}` : ""}${booking.event_date ? ` — ${booking.event_date}` : ""}`,
      )
      .join("\n")}`;
  }

  if (/publication|instagram|legende|\bpost\b/.test(normalized)) {
    return buildPublicationDraft(question);
  }

  if (/whatsapp|reponse.*client|repond.*client|message.*client/.test(normalized)) {
    const { data, error } = await db
      .from("bookings")
      .select("name,phone,offer,event_date,location")
      .order("created_at", { ascending: false })
      .limit(250);
    if (error) {
      console.error("[admin-chat] WhatsApp draft lookup failed", error);
      return new Response("Impossible de préparer la réponse. Vérifiez l’accès aux réservations.", {
        status: 503,
      });
    }
    const matches = findNameMatches(question, data ?? []);
    if (matches.length > 1) {
      return `Plusieurs clients correspondent. Précisez le nom complet : ${matches.map((booking) => booking.name).join(", ")}.`;
    }
    return buildWhatsAppDraft(question, matches[0]);
  }

  if (/bonjour|salut|salam|aide|commande/.test(normalized)) return helpText();
  return helpText();
}

export const Route = createFileRoute("/api/admin-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
        if (!token || token.split(".").length !== 3) {
          return new Response("Session admin requise.", { status: 401 });
        }
        const db = userClient(token);
        if (!db) {
          return new Response("Configuration Supabase serveur indisponible.", { status: 503 });
        }
        const { data: claims, error: claimsError } = await db.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (claimsError || !userId) return new Response("Session admin invalide.", { status: 401 });
        const { data: role, error: roleError } = await db
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (roleError) {
          console.error("[admin-chat] Admin role check failed", roleError);
          return new Response("Vérification du compte administrateur impossible.", { status: 503 });
        }
        if (!role) return new Response("Accès administrateur refusé.", { status: 403 });

        const body: unknown = await request.json().catch(() => null);
        if (!isRecord(body) || !Array.isArray(body["messages"])) {
          return new Response("Requête invalide.", { status: 400 });
        }
        const messages = body["messages"] as AdminMessage[];
        if (
          messages.length === 0 ||
          messages.length > 40 ||
          JSON.stringify(messages).length > 60_000
        ) {
          return new Response("Conversation invalide.", { status: 400 });
        }
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role !== "user") {
          return new Response("Le dernier message doit venir de l’utilisateur.", { status: 400 });
        }
        const question = getMessageText(lastMessage);
        if (!question || question.length > 1000) {
          return new Response("Message invalide.", { status: 400 });
        }

        const result = await respondToAdmin(db, question, messages, new URL(request.url).origin);
        return result instanceof Response ? result : chatResponse(result);
      },
    },
  },
});
