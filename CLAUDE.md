# Karaağaç Fatih Web — CLAUDE.md

## Proje Genel Bakış

Karaağaç Fatih Derneği için geliştirilmiş web tabanlı yönetim uygulaması. Talebe (öğrenci) kayıt, muhasebe, personel, nehari, kermes, kurban gibi modülleri kapsar.

Netlify üzerinde host edilir. iOS uygulaması için Capacitor entegrasyonu mevcuttur.

## Teknoloji Yığını

- **Frontend:** Vanilla HTML/CSS/JavaScript (framework yok)
- **Auth:** Firebase Authentication (`firebase-init.js` üzerinden)
- **Veritabanı:** Supabase (Firestore'dan geçildi; `window.db` artık kullanılmıyor)
- **Storage:** Firebase Storage (opsiyonel, yüklenirse kullanılır)
- **PDF:** html2pdf.js (`js/pdf/`, `js/html2pdf.js`)
- **Push Bildirim:** Firebase Cloud Messaging (`js/fcm-init.js`)
- **Görsel Yükleme:** Cloudinary (`js/cloudinary-upload.js`)
- **Mobil:** Capacitor v7 (iOS)
- **Deploy:** Netlify (`netlify.toml` — tüm rotalar `index.html`'e yönlendirilir)

## Klasör Yapısı

```
/
├── index.html              # Giriş sayfası (Supabase auth)
├── panel.html              # Ana panel (dark/light tema destekli)
├── admin/                  # Yönetici araçları (bildirim, kullanıcı, erişim)
├── diger/                  # Kullanıcı yönetimi, sistem ayarları
├── muhasebe/               # Muhasebe modülü (bütçe, mizan, personel ödemeleri vs.)
├── nehari/                 # Nehari kayıt ve yönetim
├── talebe/                 # Talebe (öğrenci) modülü (kayıt, ders, karne, kantin vs.)
├── personel/               # Personel modülü (nöbet, izin, analiz, Ramazan raporları)
├── kermes/                 # Kermes yönetimi
├── kurban/                 # Kurban bağış ve yönetimi (şu an devre dışı)
├── parcalar/               # Talebe kayıt adımları (parçalı formlar)
├── sablonlar/              # Şablon HTML'ler
├── scripts/                # Yardımcı script'ler
├── js/
│   ├── firebase/
│   │   └── firebase-init.js   # Firebase init (auth + storage)
│   ├── ortak.js               # Giriş / şifre sıfırlama mantığı
│   ├── icerikyukle.js         # İçerik yükleme
│   ├── talebe-*.js            # Talebe kayıt adım JS'leri
│   └── pdf/                   # PDF yardımcı modülleri
├── css/
│   ├── app-shell.css          # Uygulama kabuğu (appbar vb.)
│   ├── stiller.css
│   └── form.css
├── supabase/
│   ├── migrations/            # SQL migration dosyaları
│   └── functions/             # Edge Functions (e-posta, bildirim vs.)
└── ios/                       # Capacitor iOS projesi
```

## Supabase Edge Functions

`supabase/functions/` altında:
- `admin-create-user`
- `send-password-reset`
- `send-permission-update`
- `send-report-newsletter`
- `send-system-update`
- `send-welcome-email`

## Önemli Notlar

- **Auth:** Firebase Auth kullanılır (`window.auth`). Supabase auth de aynı anda aktif olabilir (`window.supabase.auth`).
- **Veritabanı:** Firestore **kullanılmıyor**, tüm veri Supabase'de. `window.db` referansları artık geçersiz.
- **Tema:** Panel koyu/açık tema destekler (`data-theme` attribute veya `prefers-color-scheme`).
- **Mobil:** `npm run ios` → build + Capacitor sync + Xcode açar.
- **Build:** `npm run build:web` ile `dist-app/` klasörüne kopyalanır.
- **Kurban sayfası** (`kurban/`) şu an devre dışı bırakılmış durumda.

## Build & Deploy

```bash
npm run build:web   # dist-app/ klasörüne web dosyalarını kopyalar
npm run ios         # iOS için build + sync + Xcode
```

Netlify'da otomatik deploy; tüm URL'ler SPA routing için `index.html`'e yönlendirilir.

## Migration Dosyaları

`supabase/migrations/` altında tarih-prefixli SQL dosyaları bulunur. Yeni migration eklerken `YYYYMMDD_aciklama.sql` formatı kullanılır.
