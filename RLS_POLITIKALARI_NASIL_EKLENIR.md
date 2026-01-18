# Supabase RLS Politikaları Nasıl Eklenir?

## 🔍 Sorun Nedir?

Supabase'de tablolar varsayılan olarak **RLS (Row Level Security)** ile korunur. Eğer RLS politikası yoksa, hiçbir kullanıcı veri çekemez. Bu yüzden `panel.html` sayfasında veriler yüklenmiyor.

## ✅ Çözüm: RLS Politikalarını Eklemek

### Adım 1: Supabase Dashboard'a Giriş Yapın

1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenize giriş yapın
3. Sol menüden **SQL Editor** seçeneğine tıklayın

### Adım 2: SQL Dosyasını Kopyalayın

1. `supabase-rls-policies.sql` dosyasını açın
2. İçindeki tüm SQL kodunu kopyalayın (Ctrl+A, Ctrl+C)

### Adım 3: SQL Editor'de Çalıştırın

1. Supabase Dashboard > SQL Editor sayfasında
2. Yeni bir sorgu oluşturun (veya mevcut editöre yapıştırın)
3. Kopyaladığınız SQL kodunu yapıştırın (Ctrl+V)
4. Sağ üstteki **RUN** butonuna tıklayın (veya F5 tuşuna basın)

### Adım 4: Sonucu Kontrol Edin

- ✅ Başarılı olursa: "Success. No rows returned" veya benzeri bir mesaj görürsünüz
- ❌ Hata olursa: Hata mesajını okuyun ve düzeltin

## 📋 SQL Dosyasında Ne Var?

### 1. sayfa_manifesti Tablosu İçin Politika
```sql
CREATE POLICY "sayfa_manifesti_select_all" ON public.sayfa_manifesti
  FOR SELECT
  TO authenticated
  USING (true);
```
**Ne yapar?** Tüm giriş yapmış kullanıcılar sayfa manifestini okuyabilir.

### 2. kullanicilar Tablosu İçin Politika
```sql
CREATE POLICY "kullanicilar_select_own" ON public.kullanicilar
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
```
**Ne yapar?** Kullanıcılar sadece kendi kayıtlarını okuyabilir (güvenlik için).

### 3. RLS'yi Etkinleştirme
```sql
ALTER TABLE public.sayfa_manifesti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kullanicilar ENABLE ROW LEVEL SECURITY;
```
**Ne yapar?** RLS'yi tablolarda aktif eder.

## 🎯 Alternatif Yöntem: Dashboard Üzerinden

Eğer SQL Editor kullanmak istemiyorsanız:

1. Supabase Dashboard > **Authentication** > **Policies** bölümüne gidin
2. `sayfa_manifesti` tablosunu seçin
3. **New Policy** butonuna tıklayın
4. **For SELECT** seçin
5. **Policy name**: `sayfa_manifesti_select_all`
6. **Allowed operation**: `SELECT`
7. **Target roles**: `authenticated`
8. **USING expression**: `true` yazın
9. **Save** butonuna tıklayın

Aynı işlemi `kullanicilar` tablosu için de yapın:
- **Policy name**: `kullanicilar_select_own`
- **USING expression**: `id = auth.uid()` yazın

## 🔍 Politikaları Kontrol Etme

Politikaların eklendiğini kontrol etmek için SQL Editor'de şunu çalıştırın:

```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('sayfa_manifesti', 'kullanicilar');
```

Bu sorgu, eklediğiniz politikaları listeleyecektir.

## ⚠️ Önemli Notlar

1. **RLS Kapalıysa**: Eğer RLS kapalıysa, politikalar çalışmaz. SQL dosyasındaki `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` komutları bunu otomatik yapar.

2. **Hata Alırsanız**: 
   - "policy already exists" hatası alırsanız, politika zaten var demektir. Sorun değil.
   - "permission denied" hatası alırsanız, yönetici yetkileriniz olmayabilir.

3. **Test Etmek İçin**: 
   - Politikaları ekledikten sonra `panel.html` sayfasını yenileyin
   - Browser Console'u açın (F12) ve hata mesajlarını kontrol edin
   - Artık veriler yükleniyor olmalı

## 🆘 Sorun Devam Ederse

1. Browser Console'u açın (F12 > Console)
2. Hata mesajlarını kontrol edin
3. Supabase Dashboard > **Logs** bölümünden API loglarını kontrol edin
4. Politikaların doğru eklendiğini kontrol edin (yukarıdaki SELECT sorgusu ile)

## 📸 Görsel Rehber (Kısa)

```
Supabase Dashboard
  └── SQL Editor (Sol menü)
      └── New Query
          └── SQL kodunu yapıştır
              └── RUN (F5)
                  └── ✅ Başarılı!
```

---

**Özet**: Bu SQL dosyasını Supabase Dashboard > SQL Editor'de çalıştırmanız yeterli. Bu işlem, `panel.html` sayfasının verileri çekebilmesi için gerekli izinleri verir.

