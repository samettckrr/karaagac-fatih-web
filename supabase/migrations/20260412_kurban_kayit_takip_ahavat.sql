-- Ahavat satırları (ihvan_ahavat.id) için manuel var/yok: kurban_kayit_takip.tur = 'ahavat'
ALTER TABLE public.kurban_kayit_takip DROP CONSTRAINT IF EXISTS kurban_kayit_takip_tur_check;
ALTER TABLE public.kurban_kayit_takip
  ADD CONSTRAINT kurban_kayit_takip_tur_check
  CHECK (tur = ANY (ARRAY['talebe'::text, 'ihvan'::text, 'ahavat'::text]));

COMMENT ON TABLE public.kurban_kayit_takip IS 'Kurban kayıt takibi: talebe / ihvan / ahavat satırı için manuel var-yok (ref_id: talebe id, ihvan_ahavat id)';
