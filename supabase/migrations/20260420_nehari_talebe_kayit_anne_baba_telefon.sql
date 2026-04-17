-- Nehari talebe kayıt formu: anne / baba telefon (opsiyonel metin)
ALTER TABLE public.nehari_talebe_kayit_formu
  ADD COLUMN IF NOT EXISTS anne_telefon text,
  ADD COLUMN IF NOT EXISTS baba_telefon text;

COMMENT ON COLUMN public.nehari_talebe_kayit_formu.anne_telefon IS 'Anne telefon (serbest metin, örn. +90 …)';
COMMENT ON COLUMN public.nehari_talebe_kayit_formu.baba_telefon IS 'Baba telefon (serbest metin, örn. +90 …)';
