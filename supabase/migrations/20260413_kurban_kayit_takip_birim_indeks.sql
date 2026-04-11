-- Ahavat çoklu adet: alt birim başına var/yok (birim_indeks >= 1). Satır geneli / talebe / ihvan: birim_indeks = -1
ALTER TABLE public.kurban_kayit_takip
  ADD COLUMN IF NOT EXISTS birim_indeks integer NOT NULL DEFAULT -1;

ALTER TABLE public.kurban_kayit_takip DROP CONSTRAINT IF EXISTS kurban_kayit_takip_birim_indeks_chk;
ALTER TABLE public.kurban_kayit_takip
  ADD CONSTRAINT kurban_kayit_takip_birim_indeks_chk
  CHECK (birim_indeks = -1 OR birim_indeks >= 1);

ALTER TABLE public.kurban_kayit_takip DROP CONSTRAINT IF EXISTS kurban_kayit_takip_yil_tur_ref_unique;
ALTER TABLE public.kurban_kayit_takip DROP CONSTRAINT IF EXISTS kurban_kayit_takip_yil_tur_ref_birim_uq;

ALTER TABLE public.kurban_kayit_takip
  ADD CONSTRAINT kurban_kayit_takip_yil_tur_ref_birim_uq UNIQUE (yil, tur, ref_id, birim_indeks);

COMMENT ON COLUMN public.kurban_kayit_takip.birim_indeks IS '-1: tek satır (talebe/ihvan veya ahavat satır geneli); >=1: ahavat alt birimi (1..adet)';
