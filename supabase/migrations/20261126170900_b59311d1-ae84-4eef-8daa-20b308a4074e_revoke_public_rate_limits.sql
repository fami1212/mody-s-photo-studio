DROP POLICY IF EXISTS "public submit booking form" ON public.bookings;
CREATE POLICY "public submit booking form"
  ON public.bookings FOR INSERT TO anon
  WITH CHECK (
    source IN ('form', 'assistant')
    AND status = 'new'
    AND admin_notes IS NULL
    AND name = btrim(name)
    AND char_length(name) BETWEEN 2 AND 80
    AND phone = btrim(phone)
    AND phone ~ '^[+0-9 ().-]{8,24}$'
    AND (offer IS NULL OR char_length(offer) <= 120)
    AND (location IS NULL OR char_length(location) <= 120)
    AND (message IS NULL OR char_length(message) <= 1000)
  );

DROP POLICY IF EXISTS "anon rate limits" ON public.rate_limits;
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon;
