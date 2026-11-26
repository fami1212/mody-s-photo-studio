import { createServerFn } from "@tanstack/react-start";

import { bookingInputSchema, insertPublicBooking } from "./bookings.server";

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((data) => bookingInputSchema.parse(data))
  .handler(async ({ data }) => {
    const inserted = await insertPublicBooking(data);
    if (!inserted) {
      return { ok: false as const, error: "Ce créneau est déjà réservé. Choisissez une autre date ou une autre heure." };
    }
    return { ok: true as const };
  });
