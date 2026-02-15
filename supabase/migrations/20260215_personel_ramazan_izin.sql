-- Ramazan Personel İzin Takibi
-- personel_ramazan_izin tablosu
-- Her gün en fazla 2 personel izinli olabilir (İzinli Personel -1, İzinli Personel -2)

CREATE TABLE IF NOT EXISTS public.personel_ramazan_izin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  personel_uid text NOT NULL,
  personel_adi text NOT NULL,
  ramazan_yil integer NOT NULL,
  izin_tarihi date NOT NULL,
  sira integer NOT NULL CHECK (sira IN (1, 2)),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT personel_ramazan_izin_pkey PRIMARY KEY (id),
  CONSTRAINT personel_ramazan_izin_gunluk_unique UNIQUE (ramazan_yil, izin_tarihi, sira)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_personel_ramazan_izin_yil_tarih
  ON public.personel_ramazan_izin (ramazan_yil, izin_tarihi);
CREATE INDEX IF NOT EXISTS idx_personel_ramazan_izin_personel
  ON public.personel_ramazan_izin (personel_uid, ramazan_yil);

-- RLS (Row Level Security) - herkes okuyabilsin, sadece kendi kaydını ekleyebilsin/silebilsin
ALTER TABLE public.personel_ramazan_izin ENABLE ROW LEVEL SECURITY;

-- Politikalar: public read; insert/update/delete kendi kaydı VEYA ana yönetici (Samet Çakır)
DROP POLICY IF EXISTS "personel_ramazan_izin_select" ON public.personel_ramazan_izin;
CREATE POLICY "personel_ramazan_izin_select" ON public.personel_ramazan_izin
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "personel_ramazan_izin_insert" ON public.personel_ramazan_izin;
CREATE POLICY "personel_ramazan_izin_insert" ON public.personel_ramazan_izin
  FOR INSERT WITH CHECK (
    auth.uid()::text = personel_uid
    OR EXISTS (SELECT 1 FROM public.kullanicilar WHERE id = auth.uid()::text AND adsoyad = 'Samet Çakır')
  );

DROP POLICY IF EXISTS "personel_ramazan_izin_update" ON public.personel_ramazan_izin;
CREATE POLICY "personel_ramazan_izin_update" ON public.personel_ramazan_izin
  FOR UPDATE USING (
    auth.uid()::text = personel_uid
    OR EXISTS (SELECT 1 FROM public.kullanicilar WHERE id = auth.uid()::text AND adsoyad = 'Samet Çakır')
  );

DROP POLICY IF EXISTS "personel_ramazan_izin_delete" ON public.personel_ramazan_izin;
CREATE POLICY "personel_ramazan_izin_delete" ON public.personel_ramazan_izin
  FOR DELETE USING (
    auth.uid()::text = personel_uid
    OR EXISTS (SELECT 1 FROM public.kullanicilar WHERE id = auth.uid()::text AND adsoyad = 'Samet Çakır')
  );
