-- Nöbet Tabloları için RLS (Row Level Security) Politikaları
-- Bu dosyayı Supabase Dashboard > SQL Editor'de çalıştırın

-- RLS'yi etkinleştir
ALTER TABLE public.nobet_ayar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nobet_planlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nobet_index ENABLE ROW LEVEL SECURITY;

-- ===== nobet_ayar tablosu =====
-- Tüm authenticated kullanıcılar okuyabilir
CREATE POLICY "nobet_ayar_select_all" ON public.nobet_ayar
  FOR SELECT
  TO authenticated
  USING (true);

-- Tüm authenticated kullanıcılar ekleyebilir/güncelleyebilir
CREATE POLICY "nobet_ayar_upsert_all" ON public.nobet_ayar
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "nobet_ayar_update_all" ON public.nobet_ayar
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===== nobet_planlari tablosu =====
-- Tüm authenticated kullanıcılar okuyabilir
CREATE POLICY "nobet_planlari_select_all" ON public.nobet_planlari
  FOR SELECT
  TO authenticated
  USING (true);

-- Tüm authenticated kullanıcılar ekleyebilir/güncelleyebilir
CREATE POLICY "nobet_planlari_insert_all" ON public.nobet_planlari
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "nobet_planlari_update_all" ON public.nobet_planlari
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tüm authenticated kullanıcılar silebilir
CREATE POLICY "nobet_planlari_delete_all" ON public.nobet_planlari
  FOR DELETE
  TO authenticated
  USING (true);

-- ===== nobet_index tablosu =====
-- Tüm authenticated kullanıcılar okuyabilir
CREATE POLICY "nobet_index_select_all" ON public.nobet_index
  FOR SELECT
  TO authenticated
  USING (true);

-- Tüm authenticated kullanıcılar ekleyebilir/güncelleyebilir
CREATE POLICY "nobet_index_insert_all" ON public.nobet_index
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "nobet_index_update_all" ON public.nobet_index
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tüm authenticated kullanıcılar silebilir
CREATE POLICY "nobet_index_delete_all" ON public.nobet_index
  FOR DELETE
  TO authenticated
  USING (true);
