-- Aynı talebe için birden fazla aidat planına izin ver
-- Örn: Ocak-Mayıs 2026, sonra Haziran-Aralık 2026 ayrı planlar
ALTER TABLE public.nehari_aidat
  DROP CONSTRAINT IF EXISTS nehari_aidat_talebe_unique;
