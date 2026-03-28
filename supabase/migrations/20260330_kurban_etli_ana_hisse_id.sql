-- Çoğul etli hisse: alt satırlar ana kayda bağlanır (tekil kayıtta ana_hisse_id NULL)
ALTER TABLE public.kurban_2026_etli_hisse
  ADD COLUMN IF NOT EXISTS ana_hisse_id uuid REFERENCES public.kurban_2026_etli_hisse (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kurban_etli_ana_hisse
  ON public.kurban_2026_etli_hisse (ana_hisse_id)
  WHERE ana_hisse_id IS NOT NULL;

COMMENT ON COLUMN public.kurban_2026_etli_hisse.ana_hisse_id IS 'Çoğul kayıtta ana satırın id; tekil veya ana satırda NULL';
