-- ============================================
-- GECMIS_TEBERRU_KAYITLARI Tablosu Oluşturma
-- ============================================
-- Bu script, geçmiş teberru kayıtları için yeni bir tablo oluşturur.
-- NOT: Bu tablo teberru_kayitlari tablosundan FARKLI bir tablodur.
-- CSV import ile doldurulacak veriler için kullanılacak.

CREATE TABLE IF NOT EXISTS public.gecmis_teberru_kayitlari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vade_tarihi date NOT NULL,
  tip text,
  sahip text,
  referans text,
  diger text,
  odeme text,
  tutar numeric NOT NULL CHECK (tutar >= 0),
  aciklama text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gecmis_teberru_kayitlari_pkey PRIMARY KEY (id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_gecmis_teberru_kayitlari_vade ON public.gecmis_teberru_kayitlari(vade_tarihi);
CREATE INDEX IF NOT EXISTS idx_gecmis_teberru_kayitlari_tip ON public.gecmis_teberru_kayitlari(tip);
CREATE INDEX IF NOT EXISTS idx_gecmis_teberru_kayitlari_referans ON public.gecmis_teberru_kayitlari(referans);
CREATE INDEX IF NOT EXISTS idx_gecmis_teberru_kayitlari_sahip ON public.gecmis_teberru_kayitlari(sahip);

-- Yorumlar
COMMENT ON TABLE public.gecmis_teberru_kayitlari IS 'Geçmiş teberru kayıtları - CSV import ile doldurulacak (teberru_kayitlari tablosundan farklı)';
COMMENT ON COLUMN public.gecmis_teberru_kayitlari.vade_tarihi IS 'Teberrunun vade tarihi (analiz için kullanılacak)';
COMMENT ON COLUMN public.gecmis_teberru_kayitlari.tip IS 'Teberru tipi (filtreleme için)';
COMMENT ON COLUMN public.gecmis_teberru_kayitlari.sahip IS 'Bağışçı ismi';
COMMENT ON COLUMN public.gecmis_teberru_kayitlari.referans IS 'Personel referansı (personel UID)';
COMMENT ON COLUMN public.gecmis_teberru_kayitlari.diger IS 'İkinci referans (opsiyonel)';
COMMENT ON COLUMN public.gecmis_teberru_kayitlari.odeme IS 'Ödeme yöntemi (nakit, banka, vs.)';
COMMENT ON COLUMN public.gecmis_teberru_kayitlari.tutar IS 'Teberru tutarı (numeric)';
COMMENT ON COLUMN public.gecmis_teberru_kayitlari.aciklama IS 'Teberru açıklaması';
