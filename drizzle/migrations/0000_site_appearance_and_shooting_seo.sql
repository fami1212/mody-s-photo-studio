CREATE TABLE public.site_appearance (
 id text PRIMARY KEY DEFAULT 'home' CHECK (id = 'home'),
 hero_path text,
 share_path text
);
GRANT SELECT ON public.site_appearance TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_appearance TO authenticated;
GRANT ALL ON public.site_appearance TO service_role;
ALTER TABLE public.site_appearance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads homepage appearance" ON public.site_appearance FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage homepage appearance" ON public.site_appearance FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TABLE public.shooting_seo (
 post_id uuid PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
 slug text NOT NULL UNIQUE,
 title text NOT NULL,
 description text NOT NULL,
 image_path text,
 active boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.shooting_seo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shooting_seo TO authenticated;
GRANT ALL ON public.shooting_seo TO service_role;
ALTER TABLE public.shooting_seo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads active shooting seo" ON public.shooting_seo FOR SELECT TO anon USING (active);
CREATE POLICY "admins manage shooting seo" ON public.shooting_seo FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "public reads selected marketing copies" ON storage.objects FOR SELECT TO anon USING (
 bucket_id = 'photos' AND (
 EXISTS (SELECT 1 FROM public.site_appearance a WHERE name = a.hero_path OR name = a.share_path)
 OR EXISTS (SELECT 1 FROM public.shooting_seo s WHERE s.active AND name = s.image_path)
 )
);
CREATE FUNCTION public.sync_shooting_seo_visibility() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 UPDATE public.shooting_seo SET active = (NEW.status = 'published'), slug = NEW.slug WHERE post_id = NEW.id;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_shooting_seo_visibility() FROM PUBLIC;
CREATE TRIGGER sync_shooting_seo_visibility AFTER UPDATE OF status, slug ON public.posts FOR EACH ROW EXECUTE FUNCTION public.sync_shooting_seo_visibility();