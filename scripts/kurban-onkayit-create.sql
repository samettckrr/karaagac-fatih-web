-- ============================================
-- KURBAN_ONKAYIT Tablosu Oluşturma
-- ============================================
-- Kurban ön kayıt afişindeki QR ile açılan formdan gelen kayıtlar.
-- Her afiş için benzersiz link (?ref=xxx) ile ref takibi yapılır.
-- Supabase Dashboard > SQL Editor'da çalıştırın.

CREATE TABLE IF NOT EXISTS public.kurban_onkayit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),

  -- Afiş/lokasyon takibi (QR linkindeki ?ref=xxx)
  ref text,

  -- Form alanları
  ad_soyad text NOT NULL,
  telefon text NOT NULL,
  email text,
  adet integer NOT NULL DEFAULT 1 CHECK (adet >= 1 AND adet <= 100),
  tur text NOT NULL CHECK (tur IN ('kucukbas', 'buyukbas')),
  aciklama text,

  CONSTRAINT kurban_onkayit_pkey PRIMARY KEY (id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_kurban_onkayit_ref ON public.kurban_onkayit(ref);
CREATE INDEX IF NOT EXISTS idx_kurban_onkayit_created_at ON public.kurban_onkayit(created_at);
CREATE INDEX IF NOT EXISTS idx_kurban_onkayit_tur ON public.kurban_onkayit(tur);

-- Yorumlar
COMMENT ON TABLE public.kurban_onkayit IS 'Kurban ön kayıt formu kayıtları (QR afiş ile toplanır)';
COMMENT ON COLUMN public.kurban_onkayit.ref IS 'Afiş referansı - QR linkindeki ?ref= parametresi (örn: kadikoy, sube-1)';
COMMENT ON COLUMN public.kurban_onkayit.ad_soyad IS 'Kayıt sahibi ad soyad';
COMMENT ON COLUMN public.kurban_onkayit.telefon IS 'İletişim telefonu';
COMMENT ON COLUMN public.kurban_onkayit.email IS 'E-posta (opsiyonel)';
COMMENT ON COLUMN public.kurban_onkayit.adet IS 'Kurban adedi (1-100)';
COMMENT ON COLUMN public.kurban_onkayit.tur IS 'kucukbas veya buyukbas';
COMMENT ON COLUMN public.kurban_onkayit.aciklama IS 'Ek not/açıklama';

-- ============================================
-- RLS (Row Level Security) Politikaları
-- ============================================
-- Anonim (anon): Sadece INSERT - formu dolduran herkes kayıt ekleyebilir
-- Yetkili (authenticated): Tüm işlemler - admin panelinden görüntüleme/düzenleme

ALTER TABLE public.kurban_onkayit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kurban_onkayit_insert_anon" ON public.kurban_onkayit;
CREATE POLICY "kurban_onkayit_insert_anon" ON public.kurban_onkayit
  FOR INSERT
  WITH CHECK (true);
-- Anonim kullanıcılar form üzerinden sadece kayıt ekleyebilir

DROP POLICY IF EXISTS "kurban_onkayit_select_authenticated" ON public.kurban_onkayit;
CREATE POLICY "kurban_onkayit_select_authenticated" ON public.kurban_onkayit
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "kurban_onkayit_update_authenticated" ON public.kurban_onkayit;
CREATE POLICY "kurban_onkayit_update_authenticated" ON public.kurban_onkayit
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "kurban_onkayit_delete_authenticated" ON public.kurban_onkayit;
CREATE POLICY "kurban_onkayit_delete_authenticated" ON public.kurban_onkayit
  FOR DELETE
  USING (auth.role() = 'authenticated');
