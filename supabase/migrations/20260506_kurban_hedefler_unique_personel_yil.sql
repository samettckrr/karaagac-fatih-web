-- Kurban 2026 hedefler: personel_uid + yil benzersiz kısıt
-- upsert(onConflict:'personel_uid,yil') doğru çalışsın diye gerekli
ALTER TABLE kurban_2026_hedefler
  ADD CONSTRAINT kurban_2026_hedefler_personel_yil_unique UNIQUE (personel_uid, yil);
