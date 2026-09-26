import { z } from "zod";

export const bookingInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[+0-9 ().-]{8,24}$/),
  offer: z.string().trim().max(140).optional().nullable(),
  event_date: z.string().trim().max(40).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().max(800).optional().nullable(),
});
export type BookingInput = z.infer<typeof bookingInputSchema>;

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Returns true when the caller is still under the limit (and records the hit). */
export async function checkRateLimit(key: string, max: number, windowMinutes: number) {
  const db = await admin();
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count } = await db
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", since);
  if ((count ?? 0) >= max) return false;
  await db.from("rate_limits").insert({ key });
  return true;
}

export async function insertBooking(input: BookingInput, source: "form" | "assistant") {
  const data = bookingInputSchema.parse(input);
  const rawDate = data.event_date ?? "";
  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
  const message = [!isoDate && rawDate ? `Date souhaitée : ${rawDate}` : "", data.message ?? ""]
    .filter(Boolean)
    .join("\n");
  const db = await admin();
  const { error } = await db.from("bookings").insert({
    name: data.name,
    phone: data.phone,
    offer: data.offer || null,
    event_date: isoDate,
    location: data.location || null,
    message: message || null,
    source,
  });
  if (error) throw new Error("Impossible d'enregistrer la réservation.");
}
