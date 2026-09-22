
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION private.admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin');
$$;
REVOKE ALL ON FUNCTION private.admin_exists() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.admin_exists() TO authenticated;

DROP POLICY "admins manage folders" ON public.folders;
DROP POLICY "admins manage photos" ON public.photos;
DROP POLICY "admins manage posts" ON public.posts;
DROP POLICY "admins manage post photos" ON public.post_photos;
DROP POLICY "admins manage share links" ON public.share_links;
DROP POLICY "admins read photos bucket" ON storage.objects;
DROP POLICY "admins upload photos bucket" ON storage.objects;
DROP POLICY "admins update photos bucket" ON storage.objects;
DROP POLICY "admins delete photos bucket" ON storage.objects;

CREATE POLICY "admins manage folders" ON public.folders FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage photos" ON public.photos FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage posts" ON public.posts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage post photos" ON public.post_photos FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage share links" ON public.share_links FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins read photos bucket" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'photos' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins upload photos bucket" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update photos bucket" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'photos' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete photos bucket" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.claim_admin();
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

GRANT INSERT ON public.user_roles TO authenticated;
CREATE POLICY "first user claims admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'admin' AND NOT private.admin_exists());
