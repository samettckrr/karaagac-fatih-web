-- Nehari talebe kayıt formu: profil fotoğrafı URL + Storage bucket

ALTER TABLE public.nehari_talebe_kayit_formu
  ADD COLUMN IF NOT EXISTS profil_foto_url text;

-- Bucket (public okuma; yazma authenticated)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nehari_talebe_kayit_foto',
  'nehari_talebe_kayit_foto',
  true,
  6291456,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- storage.objects politikaları
DROP POLICY IF EXISTS "nehari_kayit_foto_select" ON storage.objects;
CREATE POLICY "nehari_kayit_foto_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'nehari_talebe_kayit_foto');

DROP POLICY IF EXISTS "nehari_kayit_foto_insert" ON storage.objects;
CREATE POLICY "nehari_kayit_foto_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nehari_talebe_kayit_foto');

DROP POLICY IF EXISTS "nehari_kayit_foto_update" ON storage.objects;
CREATE POLICY "nehari_kayit_foto_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'nehari_talebe_kayit_foto')
  WITH CHECK (bucket_id = 'nehari_talebe_kayit_foto');

DROP POLICY IF EXISTS "nehari_kayit_foto_delete" ON storage.objects;
CREATE POLICY "nehari_kayit_foto_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'nehari_talebe_kayit_foto');
