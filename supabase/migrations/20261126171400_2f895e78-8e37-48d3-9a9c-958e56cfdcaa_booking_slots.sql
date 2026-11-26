ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS event_time time without time zone;

GRANT INSERT (event_time) ON TABLE public.bookings TO anon;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_slot_unique
  ON public.bookings (event_date, event_time)
  WHERE event_date IS NOT NULL
    AND event_time IS NOT NULL
    AND status IN ('new', 'confirmed');

CREATE OR REPLACE FUNCTION public.is_booking_slot_available(
  p_event_date date,
  p_event_time time without time zone
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE event_date = p_event_date
      AND (event_time = p_event_time OR event_time IS NULL)
      AND status IN ('new', 'confirmed')
  );
$$;

REVOKE ALL ON FUNCTION public.is_booking_slot_available(date, time without time zone) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_booking_slot_available(date, time without time zone) TO anon, authenticated;
