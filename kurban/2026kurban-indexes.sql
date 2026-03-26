-- 2026 Kurban sayfasi performans indexleri
-- Supabase SQL Editor'da calistirin.

create index if not exists idx_kurban2026_bagis_created_by_uid
  on public.kurban_2026_bagis_hisse (created_by_uid);

create index if not exists idx_kurban2026_bagis_created_at_desc
  on public.kurban_2026_bagis_hisse (created_at desc);

create index if not exists idx_kurban2026_bagis_yil
  on public.kurban_2026_bagis_hisse (yil);

create index if not exists idx_kurban2026_etli_created_by_uid
  on public.kurban_2026_etli_hisse (created_by_uid);

create index if not exists idx_kurban2026_etli_created_at_desc
  on public.kurban_2026_etli_hisse (created_at desc);

create index if not exists idx_kurban2026_etli_hisse_grubu
  on public.kurban_2026_etli_hisse (hisse_grubu);

create index if not exists idx_kurban2026_etli_yil
  on public.kurban_2026_etli_hisse (yil);

create index if not exists idx_kurban2026_hedefler_personel_yil
  on public.kurban_2026_hedefler (personel_uid, yil);
