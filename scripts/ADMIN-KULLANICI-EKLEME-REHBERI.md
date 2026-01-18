# Admin Kullanıcı Ekleme Rehberi

## Sorun
Kullanıcılar silindikten sonra sisteme giriş yapılamıyor. Admin kullanıcı eklenmesi gerekiyor.

## Çözüm Adımları

### 1. Supabase Dashboard'dan Kullanıcı Ekleme

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. **Projenizi seçin**
3. **Sol menüden "Authentication" > "Users" seçin**
4. **"Add User" butonuna tıklayın**
5. **Şu bilgileri girin:**
   - **Email**: `chakaer5534@gmail.com`
   - **Password**: `123456`
   - **Auto Confirm User**: ✅ (işaretli olmalı - önemli!)
6. **"Create User" butonuna tıklayın**

### 2. SQL Script'i Çalıştırma

1. **Supabase Dashboard > SQL Editor'e gidin**
2. **`scripts/admin-kullanici-ekle.sql` dosyasını açın**
3. **Script'in içeriğini kopyalayın**
4. **SQL Editor'e yapıştırın**
5. **"Run" butonuna tıklayın**

Script şunları yapacak:
- `auth.users` tablosundan kullanıcının UID'sini alacak
- `kullanicilar` tablosuna admin kullanıcı bilgilerini ekleyecek/güncelleyecek
- Tüm yetkileri (`*`) verecek

### 3. Giriş Yapma

1. **Sisteme giriş yapın**: `index.html`
2. **Email**: `chakaer5534@gmail.com`
3. **Şifre**: `123456`

## Kullanıcı Bilgileri

- **Email**: chakaer5534@gmail.com
- **Şifre**: 123456
- **Rol**: admin
- **Görev**: Sistem Yöneticisi
- **Yetkiler**: * (tüm yetkiler)

## Notlar

- Supabase'de `auth.users` tablosuna direkt SQL ile kullanıcı eklenemez
- Bu yüzden önce Dashboard'dan ekleme yapılmalı
- `Auto Confirm` mutlaka işaretli olmalı, aksi halde email onayı gerekecek
- Script çalıştırıldıktan sonra kullanıcı hemen giriş yapabilir

## Sorun Giderme

### "Kullanıcı auth.users tablosunda bulunamadı" hatası
- Dashboard'dan kullanıcıyı eklediğinizden emin olun
- Email adresinin doğru olduğundan emin olun
- Kullanıcıyı ekledikten sonra birkaç saniye bekleyin

### Giriş yapamıyorum
- Email ve şifrenin doğru olduğundan emin olun
- `kullanicilar` tablosunda kayıt olduğundan emin olun
- `aktif` alanının `true` olduğundan emin olun



