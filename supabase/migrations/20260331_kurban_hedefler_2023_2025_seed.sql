-- Kurban geçmiş yıl personel hedefleri (2023, 2024, 2025)
-- personel_uid = kullanicilar.id::text (adsoyad tam eşleşme, trim)
-- Verilen tek sayı bagis_hedef olarak yazılır; etli_hedef = 0 (şema iki alan istiyor).
-- "Diğer" synthetic: personel_uid = '__kurban_diger__'
--
-- Arayüzde hedef yılı seçimi kurban_kategoriler’den gelir; eksikse 2023–2025 pasif eklenir.

INSERT INTO public.kurban_kategoriler (yil, label, aktif)
VALUES
  (2023, '2023 Kurban', false),
  (2024, '2024 Kurban', false),
  (2025, '2025 Kurban', false)
ON CONFLICT (yil) DO NOTHING;

WITH seed(ad, y2023, y2024, y2025) AS (
  VALUES
    ('Muhsin Çelik', 42, 56, 60),
    ('Faruk Nafiz Özgan', 14, 14, 14),
    ('Samet Çakır', 7, 7, 7),
    ('Serhan Durak', 42, 35, 25),
    ('Mahmut Solmaz', 0, 14, 16),
    ('Kerem Kocaoğlu', 17, 14, 16),
    ('Mehmet Taha Keskin', 0, 0, 7),
    ('İbrahim Ay', 0, 0, 0),
    ('Ahmetali Emre Şahin', 0, 0, 0)
),
expanded AS (
  SELECT ad, 2023 AS yil, y2023 AS bagis_hedef FROM seed
  UNION ALL
  SELECT ad, 2024 AS yil, y2024 AS bagis_hedef FROM seed
  UNION ALL
  SELECT ad, 2025 AS yil, y2025 AS bagis_hedef FROM seed
)
INSERT INTO public.kurban_2026_hedefler (personel_uid, personel, bagis_hedef, etli_hedef, yil, updated_at)
SELECT k.id::text, k.adsoyad, e.bagis_hedef, 0, e.yil, now()
FROM expanded e
INNER JOIN public.kullanicilar k ON trim(both from k.adsoyad) = trim(both from e.ad)
ON CONFLICT (personel_uid, yil) DO UPDATE SET
  bagis_hedef = EXCLUDED.bagis_hedef,
  etli_hedef = EXCLUDED.etli_hedef,
  personel = EXCLUDED.personel,
  updated_at = now();

INSERT INTO public.kurban_2026_hedefler (personel_uid, personel, bagis_hedef, etli_hedef, yil, updated_at)
VALUES
  ('__kurban_diger__', 'Diğer', 46, 0, 2023, now()),
  ('__kurban_diger__', 'Diğer', 42, 0, 2024, now()),
  ('__kurban_diger__', 'Diğer', 14, 0, 2025, now())
ON CONFLICT (personel_uid, yil) DO UPDATE SET
  bagis_hedef = EXCLUDED.bagis_hedef,
  etli_hedef = EXCLUDED.etli_hedef,
  personel = EXCLUDED.personel,
  updated_at = now();
