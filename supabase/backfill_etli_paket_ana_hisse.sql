-- =============================================================================
-- TEK SEFERLİK: Eski "çoğul" etli satırlarını paketlemek (ana_hisse_id)
-- =============================================================================
-- Koşullar (hepsi birden):
--   - kurban_id IS NULL (henüz kurban atanmamış)
--   - ana_hisse_id IS NULL
--   - hisse_adedi = 1
--   - Aynı (yil, hisedar_ad_soyad, telefon, hisse_grubu) için en az 2 satır
--
-- Ana satır: o grupta created_at en küçük olan (eşitlikte id küçük).
-- Diğer satırlar: ana_hisse_id = ana satırın id.
--
-- Risk: Gerçekten farklı işlemler ama aynı ad/telefon/grup ise yanlış paketlenir.
-- Önce aşağıdaki SELECT ile grupları inceleyin; sonra UPDATE'i çalıştırın.
--
-- Çalıştırma: Supabase SQL Editor veya psql. Bu dosya otomatik migration değildir.
-- =============================================================================

-- 1) Önizleme: kaç grup, kaç satır etkilenecek?
SELECT
  yil,
  hisedar_ad_soyad,
  telefon,
  hisse_grubu,
  COUNT(*) AS satir_sayisi,
  MIN(created_at) AS ilk_kayit,
  (ARRAY_AGG(id ORDER BY created_at ASC NULLS LAST, id ASC))[1] AS olacak_ana_id
FROM public.kurban_2026_etli_hisse
WHERE kurban_id IS NULL
  AND ana_hisse_id IS NULL
  AND hisse_adedi = 1
GROUP BY yil, hisedar_ad_soyad, telefon, hisse_grubu
HAVING COUNT(*) > 1
ORDER BY yil DESC, satir_sayisi DESC;

-- 2) Güncelleme (önizlemeyi inceledikten sonra yorumdan çıkarıp çalıştırın)


BEGIN;

WITH gruplar AS (
  SELECT
    yil,
    hisedar_ad_soyad,
    telefon,
    hisse_grubu,
    (ARRAY_AGG(id ORDER BY created_at ASC NULLS LAST, id ASC))[1] AS ana_id
  FROM public.kurban_2026_etli_hisse
  WHERE kurban_id IS NULL
    AND ana_hisse_id IS NULL
    AND hisse_adedi = 1
  GROUP BY yil, hisedar_ad_soyad, telefon, hisse_grubu
  HAVING COUNT(*) > 1
)
UPDATE public.kurban_2026_etli_hisse e
SET ana_hisse_id = g.ana_id
FROM gruplar g
WHERE e.kurban_id IS NULL
  AND e.ana_hisse_id IS NULL
  AND e.hisse_adedi = 1
  AND e.yil = g.yil
  AND e.hisedar_ad_soyad IS NOT DISTINCT FROM g.hisedar_ad_soyad
  AND e.telefon IS NOT DISTINCT FROM g.telefon
  AND e.hisse_grubu IS NOT DISTINCT FROM g.hisse_grubu
  AND e.id <> g.ana_id;

COMMIT;

