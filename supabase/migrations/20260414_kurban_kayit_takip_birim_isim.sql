-- Ahavat alt birim: opsiyonel isim (birim_isim). Birim satırında sadece isim için durum NULL olabilir.
ALTER TABLE public.kurban_kayit_takip
  ADD COLUMN IF NOT EXISTS birim_isim text;

ALTER TABLE public.kurban_kayit_takip DROP CONSTRAINT IF EXISTS kurban_kayit_takip_durum_check;
ALTER TABLE public.kurban_kayit_takip DROP CONSTRAINT IF EXISTS kurban_kayit_takip_durum_kural_chk;

ALTER TABLE public.kurban_kayit_takip
  ALTER COLUMN durum DROP NOT NULL;

ALTER TABLE public.kurban_kayit_takip
  ADD CONSTRAINT kurban_kayit_takip_durum_kural_chk CHECK (
    (tur IN ('talebe', 'ihvan') AND birim_indeks = -1 AND durum IS NOT NULL AND durum IN ('var', 'yok'))
    OR (tur = 'ahavat' AND birim_indeks = -1 AND durum IS NOT NULL AND durum IN ('var', 'yok'))
    OR (tur = 'ahavat' AND birim_indeks >= 1 AND (durum IS NULL OR durum IN ('var', 'yok')))
  );

COMMENT ON COLUMN public.kurban_kayit_takip.birim_isim IS 'Ahavat birim_indeks>=1 için opsiyonel kişi adı; durum NULL iken sadece isim tutulabilir';
