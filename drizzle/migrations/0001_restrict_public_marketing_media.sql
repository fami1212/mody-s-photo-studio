DROP POLICY IF EXISTS "public reads selected marketing copies" ON storage.objects;
CREATE POLICY "public reads selected marketing copies"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'photos'
  AND name LIKE 'marketing/%'
  AND (
    EXISTS (
      SELECT 1
      FROM public.site_appearance AS appearance
      WHERE appearance.id = 'home'
        AND (storage.objects.name = appearance.hero_path OR storage.objects.name = appearance.share_path)
    )
    OR EXISTS (
      SELECT 1
      FROM public.shooting_seo AS shooting
      WHERE shooting.active = true
        AND storage.objects.name = shooting.image_path
    )
  )
);
DROP POLICY IF EXISTS "public reads homepage appearance" ON public.site_appearance;
CREATE POLICY "public reads homepage appearance"
ON public.site_appearance
FOR SELECT
TO anon, authenticated
USING (id = 'home');