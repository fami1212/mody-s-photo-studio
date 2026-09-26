import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { bookingInputSchema, checkRateLimit, clientIp, insertBooking } from "./bookings.server";

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((data) => bookingInputSchema.parse(data))
  .handler(async ({ data }) => {
    const ip = clientIp(getRequest());
    if (!(await checkRateLimit(`booking-form:${ip}`, 5, 60))) {
      return { ok: false as const, error: "Trop de demandes. Réessayez plus tard ou écrivez sur WhatsApp." };
    }
    await insertBooking(data, "form");
    return { ok: true as const };
  });
