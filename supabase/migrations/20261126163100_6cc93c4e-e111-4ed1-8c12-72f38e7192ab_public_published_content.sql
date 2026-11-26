GRANT SELECT ON public.posts, public.post_photos, public.photos TO anon;

DROP POLICY IF EXISTS "public read published posts" ON public.posts;
CREATE POLICY "public read published posts"
  ON public.posts FOR SELECT TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "public read photos linked to published posts" ON public.post_photos;
CREATE POLICY "public read photos linked to published posts"
  ON public.post_photos FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts
      WHERE posts.id = post_photos.post_id
        AND posts.status = 'published'
    )
  );

DROP POLICY IF EXISTS "public read photos used by published posts" ON public.photos;
CREATE POLICY "public read photos used by published posts"
  ON public.photos FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.post_photos
      JOIN public.posts ON posts.id = post_photos.post_id
      WHERE post_photos.photo_id = photos.id
        AND posts.status = 'published'
    )
    OR EXISTS (
      SELECT 1
      FROM public.posts
      WHERE posts.cover_photo_id = photos.id
        AND posts.status = 'published'
    )
  );

GRANT SELECT ON storage.objects TO anon;

DROP POLICY IF EXISTS "public read media used by published content" ON storage.objects;
CREATE POLICY "public read media used by published content"
  ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'photos'
    AND EXISTS (
      SELECT 1
      FROM public.photos
      WHERE storage.objects.name IN (
        photos.storage_path,
        photos.thumb_path,
        photos.display_path
      )
        AND (
          EXISTS (
            SELECT 1
            FROM public.post_photos
            JOIN public.posts ON posts.id = post_photos.post_id
            WHERE post_photos.photo_id = photos.id
              AND posts.status = 'published'
          )
          OR EXISTS (
            SELECT 1
            FROM public.posts
            WHERE posts.cover_photo_id = photos.id
              AND posts.status = 'published'
          )
        )
    )
  );

DO $$
BEGIN
  IF to_regclass('public.site_appearance') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_appearance TO authenticated';
    EXECUTE 'GRANT SELECT ON public.site_appearance TO anon';
    EXECUTE 'ALTER TABLE public.site_appearance ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "public read homepage appearance" ON public.site_appearance';
    EXECUTE 'DROP POLICY IF EXISTS "admins manage site appearance" ON public.site_appearance';
    EXECUTE 'CREATE POLICY "public read homepage appearance" ON public.site_appearance FOR SELECT TO anon USING (id = ''home'')';
    EXECUTE 'CREATE POLICY "admins manage site appearance" ON public.site_appearance FOR ALL TO authenticated USING (private.has_role(auth.uid(), ''admin'')) WITH CHECK (private.has_role(auth.uid(), ''admin''))';
    EXECUTE 'DROP POLICY IF EXISTS "public read homepage marketing media" ON storage.objects';
    EXECUTE $policy$
      CREATE POLICY "public read homepage marketing media"
        ON storage.objects FOR SELECT TO anon
        USING (
          bucket_id = 'photos'
          AND storage.objects.name ~ '^marketing/[0-9a-f-]{36}-(hero|share)\.jpg$'
          AND EXISTS (
            SELECT 1
            FROM public.site_appearance
            WHERE id = 'home'
              AND storage.objects.name IN (hero_path, share_path)
          )
        )
    $policy$;
  END IF;

  IF to_regclass('public.shooting_seo') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.shooting_seo TO authenticated';
    EXECUTE 'GRANT SELECT ON public.shooting_seo TO anon';
    EXECUTE 'ALTER TABLE public.shooting_seo ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "public read active published shooting seo" ON public.shooting_seo';
    EXECUTE 'DROP POLICY IF EXISTS "admins manage shooting seo" ON public.shooting_seo';
    EXECUTE 'CREATE POLICY "public read active published shooting seo" ON public.shooting_seo FOR SELECT TO anon USING (active AND EXISTS (SELECT 1 FROM public.posts WHERE posts.id = shooting_seo.post_id AND posts.status = ''published''))';
    EXECUTE 'CREATE POLICY "admins manage shooting seo" ON public.shooting_seo FOR ALL TO authenticated USING (private.has_role(auth.uid(), ''admin'')) WITH CHECK (private.has_role(auth.uid(), ''admin''))';
    EXECUTE 'DROP POLICY IF EXISTS "public read published shooting marketing media" ON storage.objects';
    EXECUTE $policy$
      CREATE POLICY "public read published shooting marketing media"
        ON storage.objects FOR SELECT TO anon
        USING (
          bucket_id = 'photos'
          AND storage.objects.name ~ '^marketing/[0-9a-f-]{36}-(hero|share)\.jpg$'
          AND EXISTS (
            SELECT 1
            FROM public.shooting_seo
            JOIN public.posts ON posts.id = shooting_seo.post_id
            WHERE shooting_seo.image_path = storage.objects.name
              AND shooting_seo.active
              AND posts.status = 'published'
          )
        )
    $policy$;
  END IF;
END
$$;
