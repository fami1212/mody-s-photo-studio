import { z } from "zod";

export const bookingInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9 ().-]{8,24}$/),
  offer: z.string().trim().max(120).optional().nullable(),
  event_date: z.string().trim().max(40).optional().nullable(),
  event_time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "L'heure doit être au format HH:MM.")
    .optional()
    .nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().max(800).optional().nullable(),
});
export type BookingInput = z.infer<typeof bookingInputSchema>;

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function admin() {
  const { createSupabaseServerAdminClient } = await import("./public-media.server");
  return createSupabaseServerAdminClient();
}

async function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Configuration Supabase publique indisponible.");
  const { publicMediaClient } = await import("./public-media.server");
  return publicMediaClient(url, key);
}

/** Returns true when the caller is still under the limit (and records the hit). */
export async function checkRateLimit(key: string, max: number, windowMinutes: number) {
  const db = await admin();
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count, error: countError } = await db
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", since);
  if (countError) throw new Error("Impossible de vérifier la limite de requêtes.");
  if ((count ?? 0) >= max) return false;
  const { error: insertError } = await db.from("rate_limits").insert({ key });
  if (insertError) throw new Error("Impossible d'enregistrer la limite de requêtes.");
  return true;
}

function bookingRow(input: BookingInput, source: "form" | "assistant") {
  const data = bookingInputSchema.parse(input);
  const rawDate = data.event_date ?? "";
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? new Date(`${rawDate}T00:00:00.000Z`)
    : null;
  const isoDate =
    parsedDate &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === rawDate
      ? rawDate
      : null;
  const message = [!isoDate && rawDate ? `Date souhaitée : ${rawDate}` : "", data.message ?? ""]
    .filter(Boolean)
    .join("\n");

  return {
    name: data.name,
    phone: data.phone,
    offer: data.offer || null,
    event_date: isoDate,
    event_time: data.event_time || null,
    location: data.location || null,
    message: message || null,
    source,
  };
}

export async function insertPublicBooking(
  input: BookingInput,
  source: "form" | "assistant" = "form",
) {
  const db = await publicClient();
  const row = bookingRow(input, source);

  if (row.event_date && row.event_time) {
    const { data: available, error: availabilityError } = await db.rpc(
      "is_booking_slot_available",
      {
        p_event_date: row.event_date,
        p_event_time: row.event_time,
      },
    );
    if (availabilityError) throw new Error("Impossible de vérifier la disponibilité.");
    if (typeof available !== "boolean") throw new Error("Réponse de disponibilité invalide.");
    if (!available) return false;
  }

  const { error } = await db.from("bookings").insert(row);
  if (error?.code === "23505") return false;
  if (error) throw new Error("Impossible d'enregistrer la réservation.");
  return true;
}
