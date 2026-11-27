CREATE INDEX IF NOT EXISTS rate_limits_created_at_idx
  ON public.rate_limits (created_at);

REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.check_chat_rate_limit(text, integer, integer);

CREATE OR REPLACE FUNCTION public.check_chat_rate_limit(p_client_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_key text;
  v_count integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF p_client_ip = 'unknown' THEN
    v_key := 'booking-chat:unknown';
  ELSE
    v_key := 'booking-chat:' || p_client_ip::inet::text;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_key, 0));

  DELETE FROM public.rate_limits
  WHERE created_at < v_now - interval '24 hours';

  SELECT count(*) INTO v_count
  FROM public.rate_limits
  WHERE key = v_key
    AND created_at >= v_now - interval '60 minutes';

  IF v_count >= 120 THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (key, created_at)
  VALUES (v_key, v_now);

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.check_chat_rate_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_chat_rate_limit(text) TO anon, authenticated;
