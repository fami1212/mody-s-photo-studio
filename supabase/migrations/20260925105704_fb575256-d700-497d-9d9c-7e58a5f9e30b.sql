ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS thumb_path text,
  ADD COLUMN IF NOT EXISTS display_path text,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer;

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 6 AND 25),
  offer text CHECK (char_length(offer) <= 120),
  event_date date,
  location text CHECK (char_length(location) <= 120),
  message text CHECK (char_length(message) <= 1000),
  source text NOT NULL DEFAULT 'form' CHECK (source IN ('form','assistant')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','done','cancelled')),
  admin_notes text CHECK (char_length(admin_notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage bookings" ON public.bookings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.rate_limits (
  id bigserial PRIMARY KEY,
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rate_limits_key_time ON public.rate_limits (key, created_at);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Visitors never touch tables directly
REVOKE ALL ON public.user_roles, public.photos, public.folders, public.posts, public.post_photos, public.share_links, public.bookings, public.rate_limits FROM anon;