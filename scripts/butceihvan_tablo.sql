-- ===============================================================
-- BUTCEİHVAN TABLOSU + RLS POLİTİKALARI
-- ===============================================================
-- Şema:
--   id       : text        (PRIMARY KEY, DEFAULT gen_random_uuid())
--   yil      : integer     (ör: 2025)
--   ay       : integer     (1–12)
--   tip      : text        ('gider' / 'gelir')
--   kategori : text        (örn: 'Personel Hediye', 'Teberru')
--   tutar    : numeric     (₺)
--
-- Notlar:
--  - Bu tablo 2025 ve ilerisi için Bütçe İhvan (gelir/gider) kayıtlarını
--    tutmak için kullanılabilir.
--  - RLS açık ve her komut (SELECT/INSERT/UPDATE/DELETE) için
--    basit, herkese açık politika tanımlıdır. İstersen bu politikaları
--    daha sonra uid bazlı olarak daraltabilirsin.
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.butceihvan (
  id       text    PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  yil      integer NOT NULL,
  ay       integer NOT NULL CHECK (ay BETWEEN 1 AND 12),
  tip      text    NOT NULL CHECK (LOWER(tip) = ANY (ARRAY['gider','gelir'])),
  kategori text    NOT NULL,
  tutar    numeric NOT NULL
);

-- =========================================
-- RLS: Row Level Security
-- =========================================

ALTER TABLE public.butceihvan ENABLE ROW LEVEL SECURITY;

-- Herkese okuma izni (uygulama tarafındaki RLS filtreleri ayrıca çalışır)
CREATE POLICY butceihvan_select
  ON public.butceihvan
  FOR SELECT
  TO public
  USING (true);

-- Herkese insert izni (uygulama tarafında yetki kontrolleri yapılmalı)
CREATE POLICY butceihvan_insert
  ON public.butceihvan
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Herkese update izni
CREATE POLICY butceihvan_update
  ON public.butceihvan
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Herkese delete izni
CREATE POLICY butceihvan_delete
  ON public.butceihvan
  FOR DELETE
  TO public
  USING (true);

-- ===============================================================
-- ÖRNEK INSERT (format: "2025-1 , Gider , Personel Hediye , 239.100₺")
-- ===============================================================
--  "2025-1"  → yil = 2025 , ay = 1
--  "Gider"   → tip = 'gider'
--  "Gelir"   → tip = 'gelir'
--  "kategori"→ kategori
--  "tutar"   → tutar (₺ işareti, nokta/virgül temizlenmiş numeric)
--
-- ID otomatik üretilir (gen_random_uuid()), elle göndermen gerekmez.

INSERT INTO public.butceihvan (yil, ay, tip, kategori, tutar)
VALUES
  (2025, 1, 'gider', 'Personel Hediye', 239100),
  (2025, 2, 'gider', 'Personel Hediye', 233800),
  (2025, 8, 'gelir', 'Teberru',         45000);

