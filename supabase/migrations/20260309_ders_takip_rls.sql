-- ders_takip sayfası için RLS politikaları
-- "Tüm Talebeler" seçildiğinde veri gelmemesi sorununun çözümü:
-- Authenticated kullanıcılar tüm satırları görebilsin (talebe_uid filtrelemesi yok)

-- ders_kayitlari
ALTER TABLE public.ders_kayitlari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ders_kayitlari_select" ON public.ders_kayitlari;
CREATE POLICY "ders_kayitlari_select" ON public.ders_kayitlari
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ders_kayitlari_insert" ON public.ders_kayitlari;
CREATE POLICY "ders_kayitlari_insert" ON public.ders_kayitlari
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ders_kayitlari_update" ON public.ders_kayitlari;
CREATE POLICY "ders_kayitlari_update" ON public.ders_kayitlari
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ders_kayitlari_delete" ON public.ders_kayitlari;
CREATE POLICY "ders_kayitlari_delete" ON public.ders_kayitlari
  FOR DELETE USING (auth.uid() IS NOT NULL);


-- talebeler (ders_takip dropdown için)
ALTER TABLE public.talebeler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "talebeler_select" ON public.talebeler;
CREATE POLICY "talebeler_select" ON public.talebeler
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- takrir_index (ders_takip kitap/ders listesi için)
ALTER TABLE public.takrir_index ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "takrir_index_select" ON public.takrir_index;
CREATE POLICY "takrir_index_select" ON public.takrir_index
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "takrir_index_insert" ON public.takrir_index;
CREATE POLICY "takrir_index_insert" ON public.takrir_index
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "takrir_index_update" ON public.takrir_index;
CREATE POLICY "takrir_index_update" ON public.takrir_index
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "takrir_index_delete" ON public.takrir_index;
CREATE POLICY "takrir_index_delete" ON public.takrir_index
  FOR DELETE USING (auth.uid() IS NOT NULL);
