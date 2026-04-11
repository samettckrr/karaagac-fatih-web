-- ─────────────────────────────────────────────────────────────────────────────
-- Kurumlar sistemi
-- Ana kurum + alt kurum hiyerarşisi.
-- Kullanıcılar kuruma bağlanır; giriş sonrası kurum bazlı yönlendirme yapılır.
-- ─────────────────────────────────────────────────────────────────────────────

-- Kurumlar tablosu
CREATE TABLE IF NOT EXISTS public.kurumlar (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ad              text        NOT NULL,
  ana_kurum_id    uuid        REFERENCES public.kurumlar(id) ON DELETE SET NULL,
  aktif           boolean     NOT NULL DEFAULT true,
  renk            text        DEFAULT '#7C3AED',
  aciklama        text,
  olusturma_tarihi timestamptz NOT NULL DEFAULT now()
);

-- Varsayılan ana kurum — mevcut uygulama bu kuruma yönlenir
INSERT INTO public.kurumlar (id, ad, ana_kurum_id, renk, aciklama)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Karaağaç Fatih',
  NULL,
  '#2563EB',
  'Karaağaç Fatih Daimi Tekâmülaltı'
)
ON CONFLICT (id) DO NOTHING;

-- Kullanıcılar tablosuna kurum_id sütunu
ALTER TABLE public.kullanicilar
  ADD COLUMN IF NOT EXISTS kurum_id uuid REFERENCES public.kurumlar(id) ON DELETE SET NULL;

-- Mevcut kullanıcıları varsayılan kuruma bağla
UPDATE public.kullanicilar
  SET kurum_id = '00000000-0000-0000-0000-000000000001'::uuid
  WHERE kurum_id IS NULL;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.kurumlar ENABLE ROW LEVEL SECURITY;

-- Giriş yapmış herkes okuyabilir
CREATE POLICY "kurumlar_select"
  ON public.kurumlar FOR SELECT
  USING (auth.role() = 'authenticated');

-- Sadece admin / yönetici yazabilir
CREATE POLICY "kurumlar_write"
  ON public.kurumlar FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kullanicilar
      WHERE id = auth.uid()
        AND rol IN ('admin', 'yonetici')
    )
  );

-- ── İndeks ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS kurumlar_ana_kurum_id_idx ON public.kurumlar(ana_kurum_id);
CREATE INDEX IF NOT EXISTS kullanicilar_kurum_id_idx ON public.kullanicilar(kurum_id);
