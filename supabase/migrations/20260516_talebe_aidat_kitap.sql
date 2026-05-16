-- ============================================================
-- Talebe Aidat & Kitap Borç Takip Tabloları
-- 2026-05-16
-- NOT: Tablolar zaten mevcut olabilir; IF NOT EXISTS ile güvenli.
-- Mevcut şema: toplamaidat, toplamkitap, islemturu, odemeyontemi
-- ============================================================

-- 1) Borç planı tablosu
CREATE TABLE IF NOT EXISTS public.talebe_borclar (
  id          text         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  isim        text,
  tarih       timestamptz  DEFAULT now(),
  toplamaidat numeric      DEFAULT 0,
  toplamkitap numeric      DEFAULT 0
);

-- 2) Tahsilat kayıtları
CREATE TABLE IF NOT EXISTS public.aidat_kitap (
  id            text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  isim          text,
  islemturu     text,
  miktar        numeric     DEFAULT 0,
  odemeyontemi  text,
  tarih         timestamptz DEFAULT now()
);

-- ============================================================
-- İndeksler (IF NOT EXISTS ile güvenli)
-- ============================================================
CREATE INDEX IF NOT EXISTS talebe_borclar_isim_idx ON public.talebe_borclar (isim);
CREATE INDEX IF NOT EXISTS aidat_kitap_isim_idx    ON public.aidat_kitap (isim);
CREATE INDEX IF NOT EXISTS aidat_kitap_tarih_idx   ON public.aidat_kitap (tarih DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.talebe_borclar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aidat_kitap    ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='talebe_borclar' AND policyname='talebe_borclar_auth') THEN
    CREATE POLICY talebe_borclar_auth ON public.talebe_borclar TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='aidat_kitap' AND policyname='aidat_kitap_auth') THEN
    CREATE POLICY aidat_kitap_auth ON public.aidat_kitap TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
