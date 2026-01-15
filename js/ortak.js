// =========================
// GİRİŞ - index.html
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const forgotPasswordBtn = document.getElementById("forgotPassword");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      window.auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          window.location.href = "panel.html"; // Giriş başarılı
        })
        .catch((error) => {
          alert("Hata: " + error.message);
        });
    });
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", () => {
      const email = document.getElementById("email").value.trim();
      if (!email) return alert("Lütfen önce e-posta adresinizi girin.");

      window.auth.sendPasswordResetEmail(email)
        .then(() => {
          alert("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
        })
        .catch((error) => {
          alert("Hata: " + error.message);
        });
    });
  }
});


// =========================
// PANEL - panel.html
// =========================

function baslatPanel() {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const uid = user.uid;

    try {
      const doc = await firebase.firestore().collection("kullanicilar").doc(uid).get();
      const veri
 = doc.data();

      if (!veri) {
        alert("Kullanıcı bilgisi bulunamadı.");
        logout();
        return;
      }

      const yetkiler = veri.yetkiler || [];

      // Tüm panel id'lerini eşleştir
      const panelIdMap = {
        "Talebe": "yanTalebe",
        "Personel": "yanPersonel",
        "Nehari": "yanNehari",
        "Kermes": "yanKermes",
        "Diğer": "yanAyarlar",
        "Kontrol Paneli": "yanAdmin",
        "Muhasebe": "yanMuhasebe",
      };

      // Önce tüm panelleri gizle
      Object.values(panelIdMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
      });

      // Yetkisi olanları göster
      yetkiler.forEach(yetki => {
        const el = document.getElementById(panelIdMap[yetki]);
        if (el) el.style.display = "block";
      });

        // En sonda paneli görünür yap
      document.getElementById("yanPanel").style.visibility = "visible";

    } catch (err) {
      console.error("Yetki kontrol hatası:", err.message);
      logout();
    }
  });
}

function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  });
}

function goTo(sayfa) {
  window.location.href = sayfa;
}

function menuToggle(event) {
  event.stopPropagation();
  const yanPanel = document.getElementById("yanPanel");
  yanPanel.classList.toggle("acik");

  if (yanPanel.classList.contains("acik")) {
    document.addEventListener("click", closeMenuOnOutsideClick);
  } else {
    document.removeEventListener("click", closeMenuOnOutsideClick);
  }
}

function closeMenuOnOutsideClick(e) {
  const yanPanel = document.getElementById("yanPanel");
  const menuIcon = document.querySelector(".menu-icon");

  if (!yanPanel.contains(e.target) && !menuIcon.contains(e.target)) {
    yanPanel.classList.remove("acik");
    document.removeEventListener("click", closeMenuOnOutsideClick);
  }
}

function paneliYukle(panelAdi) {
  const kartAlani = document.getElementById("kartAlani");
  if (!kartAlani) return;

  kartAlani.innerHTML = "";

  let kartlar = [];

  if (panelAdi === "talebe") {
    kartlar = [
      { baslik: "Kayıt Et", ikon: "", link: "parcalar/talebe-kayit.html"},
      { baslik: "Talebe Bilgi", ikon: "📋", link: "talebe/talebe-bilgi-formu.html" },
      { baslik: "Talebe Listesi", ikon: "", link: "calisma-karti.html"},
      { baslik: "Takrir Durumu", ikon: "📗", link: "talebe/ezber-takibi.html" },
      { baslik: "İzin Dönüş Takibi", ikon: "🛫", link: "talebe/izin-takibi.html" },
      { baslik: "Aidat ve Kitap Ücretleri", ikon: "📥", link: "talebe/aidat-kitap.html" },
    ];
  } else if (panelAdi === "personel") { 
    kartlar = [
      { baslik: "Nöbet Çizelgesi", ikon: "📅", link: "personel/nobet.html" },
      { baslik: "Personel Aylık Performans", ikon: "📊", link: "personel/aylik-performans.html" },
      { baslik: "Hedefler", ikon: "🎯", link: "personel/hedef-grafik.html" },
      { baslik: "Alacak Takibi", ikon: "💰", link: "personel/rapor-personel.html" },
      { baslik: "Temizlik Kontrolü", ikon: "🧹", link: "personel/temizlik/temizlik-kontrolu.html" },
    ];
  } else if (panelAdi === "nehari") {
    kartlar = [
      { baslik: "Talebe Listesi", ikon: "📋", link: "calisma-karti.html" },
      { baslik: "Diğer", ikon: "📗", link: "calisma-karti.html" },
      { baslik: "Diğer", ikon: "📗", link: "calisma-karti.html"},
    ];
  } else if (panelAdi === "kermes") {
    kartlar = [
      { baslik: "Kermes" , ikon: "🍽️ 🍢", link: "kermes/kermes.html"},
      { baslik: "Menü Yönetim Paneli" , ikon: "📋" , link: "kermes/menu.html"}, 
    ];  
  } else if (panelAdi === "ayarlar") {
    kartlar = [
      { baslik: "Kullanıcı Yönetimi", ikon: "🛠️", link: "diger/kullanici-yonetimi.html" },
      { baslik: "Sistem Ayarları", ikon: "⚙️", link: "diger/sistem-ayarlari.html" },
    ];
  } else if (panelAdi === "muhasebe") {
    kartlar = [
      { baslik: "Aylık Personel Ödemeleri" , ikon: "👥", link:"muhasebe/aylik-personel-odemeleri.html"},
      { baslik: "Alacak Tahsilatı" , ikon: "📝", link:"personel/alacak-takibi.html"},
      { baslik: "Hedef ve Veri Girişi" , ikon: "📝", link: "muhasebe/muhasebe-form.html"},
      { baslik: "Aidat-Kitap Veri Girişi" , ikon: "📝", link: "muhasebe/aidat-kitap-giris.html"},
      { baslik: "Kermes Raporu" , ikon: "🍽️", link: "calisma-karti.html"},
      { baslik: "Aylık Giderler" , ikon: "", link: "calisma-karti.html"},
      { baslik: "İçeriği Daha Sonra Paylaşılacaktır", ikon: "📑", link: "muhasebe/genel-muhasebe.html" },
    ];  
  } else if (panelAdi === "admin") {
    kartlar = [
      { baslik: "Kullanıcı Ekle" , ikon: "", link: "admin/kullanici-ekle.html"},
      { baslik: "Kullanıcılar" , ikon: "👥", link: "admin/kullanici-listesi.html"},
      { baslik: "Giriş Kayıtları" , ikon: "🧾", link: "admin/giris-kayitlari.html"},
      { baslik: "Erişim Talepleri", ikon: "🔐", link: "admin/erisimler.html"},
      { baslik: "Bildirim/Görev Sistemi", ikon: "🔔", link: "admin/bildirim-gorev.html"},
    ];
  }

  kartlar.forEach(kart => {
    const kartDiv = document.createElement("div");
    kartDiv.className = "panel-kart";
    kartDiv.onclick = () => goTo(kart.link);
    kartDiv.innerHTML = `
      <div class="ikon">${kart.ikon}</div>
      <div class="baslik">${kart.baslik}</div>
    `;
    kartAlani.appendChild(kartDiv);
  });
}


// =========================
// talebe-liste.html - sabit işlemler
// =========================

function icerikYukle(icerik) {
  const yanPanel = document.querySelector('.yan-panel');
  yanPanel.classList.remove('acik');

  const icerikPaneli = document.getElementById('icerik-paneli');

  if (icerik === 'liste') {
    // Talebe listesi
    fetch("parcalar/talebe-liste-tablosu.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;
        const script = document.createElement("script");
        script.src = "js/talebe-liste.js";
        document.body.appendChild(script);
      });
  }

  else if (icerik === 'kayit') {
    // Talebe kayıt formu (1. adım)
    fetch("parcalar/talebe-kayit.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;
        const script = document.createElement("script");
        script.src = "js/talebe-kayit-adim1.js";
        script.type = "module";
        document.body.appendChild(script);
      });
  }

  else if (icerik === 'bilgi') {
    // Bilgi formu
    fetch("talebe/talebe-bilgi-formu.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;
        const script = document.createElement("script");
        script.src = "js/talebe-bilgi.js";
        document.body.appendChild(script);
      });
  }

  else if (icerik === 'okul') {
    // Okul bilgileri
    fetch("parcalar/talebe-okul.html")
      .then(res => res.text())
      .then(html => {
        icerikPaneli.innerHTML = html;
        const script = document.createElement("script");
        script.src = "js/talebe-okul.js";
        document.body.appendChild(script);
      });
  }

  else {
    icerikPaneli.innerHTML = `<p>İçerik yüklenemedi.</p>`;
  }
}


function sayfayiYenile() {
  location.reload();
}

// =========================
// ORTAK APP SHELL - Tüm sayfalarda kullanılacak
// =========================

/* === GLOBAL DEĞİŞKENLER === */
// Global scope'ta erişilebilir olmalı (sayfalar için)
if (!window.CURRENT_ALLOW) {
  window.CURRENT_ALLOW = new Set();
}
if (!window.CURRENT_DENY) {
  window.CURRENT_DENY = new Set();
}
// Mevcut değişkenleri kullan, yoksa window'dan al
let CURRENT_ALLOW = window.CURRENT_ALLOW;
let CURRENT_DENY = window.CURRENT_DENY;
// db ve auth firebase-init.js'den geliyor, window.db ve window.auth olarak erişilebilir
// window'a at (diğer sayfalar için)
if(typeof window.db === 'undefined'){
  window.db = typeof firebase !== 'undefined' ? firebase.firestore() : null;
}
if(typeof window.auth === 'undefined'){
  window.auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
}
// db ve auth tanımlamadan doğrudan window.db ve window.auth kullan
// (diğer sayfalarda const db tanımlanabilir)

/* === YARDIMCI FONKSİYONLAR === */
// norm fonksiyonu window'da tanımlı olmalı (diğer sayfalar için)
if(typeof window.norm === 'undefined'){
  window.norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
// Referans al (local scope'ta)
const norm = window.norm;

// XSS koruması - HTML escape
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// URL validation ve normalization
function normalizeUrl(u) {
  if (!u || u === '#') return '#';
  // Güvenlik: Sadece güvenli protokoller
  if (/^https?:\/\//i.test(u)) {
    // External URL kontrolü - sadece güvenli domain'lere izin ver
    try {
      const url = new URL(u);
      // Localhost ve güvenli domain'ler için kontrol
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.endsWith(window.location.hostname)) {
        return u;
      }
      // External URL'ler için güvenlik uyarısı
      console.warn('External URL detected:', u);
      return '#';
    } catch (e) {
      return '#';
    }
  }
  if (u.startsWith('//')) return '#';
  // Zaten relative path ise olduğu gibi döndür (../ veya ./ ile başlıyorsa)
  if (u.startsWith('../') || u.startsWith('./')) {
    return u;
  }
  // Absolute path ise (/) başında / varsa
  if (u.startsWith('/')) {
    return u;
  }
  // Relative path için current directory'den hesapla
  const currentPath = location.pathname;
  const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
  const currentDepth = currentDir.split('/').filter(x => x).length;
  const upLevels = currentDepth > 0 ? '../'.repeat(currentDepth) : '';
  return upLevels + u;
}
// Global olarak erişilebilir yap
window.normalizeUrl = normalizeUrl;

/* === TOAST BİLDİRİM SİSTEMİ === */
function showToast(type, title, message) {
  const cont = document.getElementById('toastContainer');
  if (!cont) {
    console.warn('toastContainer bulunamadı');
    return;
  }
  // Güvenlik: Input validation
  const safeType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
  const safeTitle = escapeHtml(String(title || ''));
  const safeMessage = escapeHtml(String(message || ''));
  
  const div = document.createElement('div');
  div.className = `toast ${safeType}`;
  
  // Güvenli DOM oluşturma (innerHTML yerine)
  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  icon.textContent = safeType === 'success' ? '✅' : safeType === 'error' ? '⚠️' : safeType === 'warning' ? '⚠️' : 'ℹ️';
  
  const content = document.createElement('div');
  content.className = 'toast-content';
  
  const titleEl = document.createElement('div');
  titleEl.className = 'toast-title';
  titleEl.textContent = safeTitle;
  
  const messageEl = document.createElement('div');
  messageEl.className = 'toast-message';
  messageEl.textContent = safeMessage;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Kapat');
  
  content.appendChild(titleEl);
  content.appendChild(messageEl);
  div.appendChild(icon);
  div.appendChild(content);
  div.appendChild(closeBtn);
  
  cont.appendChild(div);
  requestAnimationFrame(() => div.classList.add('show'));
  const close = () => { 
    div.classList.remove('show'); 
    setTimeout(() => div.remove(), 200); 
  };
  closeBtn.addEventListener('click', close);
  setTimeout(close, 4000);
}
// Global olarak erişilebilir yap
window.showToast = showToast;

/* === BİLDİRİM YÜKLEME === */
let notifListener = null; // Real-time listener referansı

async function loadNotifications() {
  const badge = document.getElementById('notifBadge');
  const list = document.getElementById('notifList');
  if (!badge || !list) return;
  
  // Önceki listener'ı temizle
  if (notifListener) {
    notifListener();
    notifListener = null;
  }

    const user = window.auth.currentUser;
  if (!user) {
    badge.style.display = 'none';
    list.innerHTML = '';
    return;
  }

  try {
    // Kullanıcının bildirimlerini real-time dinle
    const kullaniciBildirimleriRef = window.db.collection('kullanici_bildirimleri')
      .doc(user.uid)
      .collection('bildirimler');

    // Tüm bildirimleri çek (index hatası olmaması için where kullanmadan)
    const tumSnap = await kullaniciBildirimleriRef
      .orderBy('zaman', 'desc')
      .limit(50)
      .get();

    // Client-side'da okunmamış bildirimleri say
    let okunmamisSayisi = 0;
    tumSnap.forEach(doc => {
      const d = doc.data() || {};
      if (!d.okunduMu) {
        okunmamisSayisi++;
      }
    });
    
    // Badge güncelle
    if (okunmamisSayisi > 0) {
      badge.style.display = 'block';
      badge.textContent = okunmamisSayisi > 99 ? '99+' : String(okunmamisSayisi);
    } else {
      badge.style.display = 'none';
    }

    // Son 5 bildirimi göster (okunmuş/okunmamış fark etmez)
    const son5Bildirim = [];
    tumSnap.forEach(doc => {
      if (son5Bildirim.length < 5) {
        son5Bildirim.push(doc);
      }
    });

    list.innerHTML = '';

    if (son5Bildirim.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.style.padding = '6px 8px';
      empty.textContent = 'Yeni bildirim yok.';
      list.appendChild(empty);
    } else {
      son5Bildirim.forEach(doc => {
        const d = doc.data() || {};
        const baslik = d.baslik || 'Bildirim';
        const icerik = d.icerik || '';
        const okunduMu = d.okunduMu || false;
        const tip = d.tip || 'toplu';
        const zaman = d.zaman?.toDate ? d.zaman.toDate() : new Date();
        const zamanStr = zaman.toLocaleString('tr-TR', { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        const row = document.createElement('div');
        row.style.cssText = 'display: block; padding: 10px 12px; text-decoration: none; border-bottom: 1px solid var(--stroke); transition: background 0.15s; cursor: pointer;';
        if (!okunduMu) {
          row.style.background = 'rgba(59,130,246,.05)';
          row.style.fontWeight = '600';
        }

        const strong = document.createElement('strong');
        strong.textContent = escapeHtml(baslik);
        strong.style.cssText = 'display: block; color: var(--text); margin-bottom: 4px;';

        const muted = document.createElement('div');
        muted.className = 'muted';
        muted.style.cssText = 'font-size: 12px; color: var(--muted); line-height: 1.4;';
        muted.textContent = escapeHtml(icerik.length > 60 ? icerik.substring(0, 60) + '...' : icerik);

        const timeDiv = document.createElement('div');
        timeDiv.className = 'muted';
        timeDiv.style.cssText = 'font-size: 11px; margin-top: 4px; color: var(--muted);';
        timeDiv.textContent = zamanStr;

        row.appendChild(strong);
        row.appendChild(muted);
        row.appendChild(timeDiv);

        // Okunmamışsa işaret ekle
        if (!okunduMu) {
          const dot = document.createElement('span');
          dot.style.cssText = 'display: inline-block; width: 8px; height: 8px; background: var(--brand); border-radius: 50%; margin-right: 6px;';
          strong.insertBefore(dot, strong.firstChild);
        }

        row.onmouseenter = () => row.style.background = 'var(--surface)';
        row.onmouseleave = () => row.style.background = okunduMu ? 'transparent' : 'rgba(59,130,246,.05)';

        // Tıklanınca modal aç
        row.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          showBildirimModal(doc.id, baslik, icerik, okunduMu, tip, zamanStr);
        };

        list.appendChild(row);
      });
    }

    // "Tüm bildirimleri gör →" linkini kaldır (dropdown içinde)
    const notifDropdown = document.getElementById('notifDropdown');
    if (notifDropdown) {
      // Tüm linkleri kontrol et
      const tumLinkler = notifDropdown.querySelectorAll('a');
      tumLinkler.forEach(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent || '';
        // bildirim.html içeren veya "Tüm bildirimleri gör" yazan linkleri kaldır
        if (href.includes('bildirim.html') || text.includes('Tüm bildirimleri gör')) {
          link.remove();
        }
      });
    }

    // Real-time listener - yeni bildirimler için (index hatası olmaması için where kullanmadan)
    notifListener = kullaniciBildirimleriRef
      .orderBy('zaman', 'desc')
      .limit(50)
      .onSnapshot((snapshot) => {
        // Client-side'da okunmamış bildirimleri say
        let yeniOkunmamisSayisi = 0;
        snapshot.forEach(doc => {
          const d = doc.data() || {};
          if (!d.okunduMu) {
            yeniOkunmamisSayisi++;
          }
        });
        
        // Badge güncelle
        if (badge) {
          if (yeniOkunmamisSayisi > 0) {
            badge.style.display = 'block';
            badge.textContent = yeniOkunmamisSayisi > 99 ? '99+' : String(yeniOkunmamisSayisi);
          } else {
            badge.style.display = 'none';
          }
        }
        // Listeyi yeniden yükle
        loadNotifications();
      }, (error) => {
        console.error('Bildirim listener hatası:', error);
      });

  } catch (e) {
    console.error('Bildirimler yüklenemedi:', e);
    if (badge) badge.style.display = 'none';
    if (list) {
      const err = document.createElement('div');
      err.className = 'muted';
      err.style.padding = '6px 8px';
      err.textContent = 'Bildirimler yüklenemedi.';
      list.appendChild(err);
    }
  }
}

/* === BİLDİRİM MODAL === */
async function showBildirimModal(bildirimId, baslik, icerik, okunduMu, tip, zamanStr) {
    const user = window.auth.currentUser;
  if (!user) return;

  // Modal container'ı kontrol et, yoksa oluştur
  let modalContainer = document.getElementById('bildirimModalContainer');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'bildirimModalContainer';
    modalContainer.className = 'modal';
    modalContainer.style.cssText = 'display: none; position: fixed; inset: 0; z-index: 10000; background: rgba(15,23,42,.4); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); justify-content: center; align-items: center; padding: 14px; pointer-events: auto;';
    document.body.appendChild(modalContainer);
  }

  // Modal içeriği
  const tipRenk = tip === 'toplu' ? 'rgba(59,130,246,.1)' : 'rgba(16,185,129,.1)';
  const tipTextRenk = tip === 'toplu' ? '#0ea5e9' : '#33c27f';
  
  modalContainer.innerHTML = `
    <div class="sheet" style="max-width: 500px; width: 100%; background: var(--card); border-radius: 16px; border: 1px solid var(--stroke); box-shadow: 0 18px 40px rgba(15,23,42,.15); transform: scale(0.95); opacity: 0; transition: all 0.2s ease; pointer-events: auto;">
      <header style="padding: 16px 20px; border-bottom: 1px solid var(--stroke); display: flex; align-items: center; justify-content: space-between; background: var(--card);">
        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--text);">${escapeHtml(baslik)}</h3>
        <button type="button" id="bildirimModalKapat" style="background: transparent; border: none; color: var(--muted); font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s; line-height: 1;">×</button>
      </header>
      <div class="body" style="padding: 20px;">
        <div style="margin-bottom: 12px;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; background: ${tipRenk}; color: ${tipTextRenk}; font-size: 11px; font-weight: 600;">
            ${tip === 'toplu' ? '📤 Toplu Bildirim' : '✉️ Kişisel Bildirim'}
          </span>
        </div>
        <div style="font-size: 14px; color: var(--ink); line-height: 1.6; white-space: pre-wrap; margin-bottom: 16px; word-wrap: break-word;">${escapeHtml(icerik)}</div>
        <div style="font-size: 12px; color: var(--muted); padding-top: 12px; border-top: 1px solid var(--stroke);">
          <div style="margin-bottom: 4px;"><strong>Zaman:</strong> ${escapeHtml(zamanStr)}</div>
          <div><strong>Durum:</strong> ${okunduMu ? '✅ Okundu' : '🔴 Okunmadı'}</div>
        </div>
      </div>
      <footer style="padding: 16px 20px; border-top: 1px solid var(--stroke); display: flex; gap: 8px; justify-content: flex-end; background: var(--card);">
        <button type="button" class="btn btn-ghost" id="bildirimModalKapatBtn" style="padding: 8px 16px;">Kapat</button>
        ${!okunduMu ? '<button type="button" class="btn btn-primary" id="bildirimOkunduBtn" style="padding: 8px 16px;">Okundu İşaretle</button>' : ''}
      </footer>
    </div>
  `;

  // Sheet içine tıklanınca event propagation'ı durdur
  const sheet = modalContainer.querySelector('.sheet');
  if (sheet) {
    sheet.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Kapat fonksiyonu
  const kapatModal = () => {
    const sheetEl = modalContainer.querySelector('.sheet');
    if (sheetEl) {
      sheetEl.style.transform = 'scale(0.95)';
      sheetEl.style.opacity = '0';
    }
    setTimeout(() => {
      modalContainer.style.display = 'none';
      document.body.style.overflow = '';
    }, 200);
  };

  // Backdrop'a tıklanınca kapat
  modalContainer.onclick = (e) => {
    if (e.target === modalContainer) {
      kapatModal();
    }
  };

  // ESC tuşu ile kapat
  const escHandler = (e) => {
    if (e.key === 'Escape' && modalContainer.style.display === 'flex') {
      kapatModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Kapat butonları
  const kapatBtn = document.getElementById('bildirimModalKapat');
  const kapatBtn2 = document.getElementById('bildirimModalKapatBtn');
  const okunduBtn = document.getElementById('bildirimOkunduBtn');

  if (kapatBtn) {
    kapatBtn.onclick = (e) => {
      e.stopPropagation();
      kapatModal();
    };
    kapatBtn.onmouseenter = () => kapatBtn.style.background = 'var(--surface)';
    kapatBtn.onmouseleave = () => kapatBtn.style.background = 'transparent';
  }

  if (kapatBtn2) {
    kapatBtn2.onclick = (e) => {
      e.stopPropagation();
      kapatModal();
    };
  }

  // Okundu işaretle
  if (okunduBtn && !okunduMu) {
    okunduBtn.onclick = async (e) => {
      e.stopPropagation();
      try {
        const kullaniciBildirimleriRef = window.db.collection('kullanici_bildirimleri')
          .doc(user.uid)
          .collection('bildirimler');

        await kullaniciBildirimleriRef.doc(bildirimId).update({
          okunduMu: true,
          okunmaZamani: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Sayacı güncelle
        const kullaniciRef = window.db.collection('kullanici_bildirimleri').doc(user.uid);
        await kullaniciRef.update({
          okunmamisBildirim: firebase.firestore.FieldValue.increment(-1)
        });

        // Bildirimleri yeniden yükle
        await loadNotifications();

        // Toast göster
        if (typeof showToast === 'function') {
          showToast('success', 'Başarılı', 'Bildirim okundu olarak işaretlendi.');
        }

        kapatModal();
      } catch (error) {
        console.error('Bildirim okundu işaretleme hatası:', error);
        if (typeof showToast === 'function') {
          showToast('error', 'Hata', 'Bildirim işaretlenemedi.');
        }
      }
    };
  }

  // Body scroll'u engelle
  document.body.style.overflow = 'hidden';

  // Modal'ı göster
  modalContainer.style.display = 'flex';
  requestAnimationFrame(() => {
    const sheetEl = modalContainer.querySelector('.sheet');
    if (sheetEl) {
      sheetEl.style.transform = 'scale(1)';
      sheetEl.style.opacity = '1';
    }
  });
}
// Global olarak erişilebilir yap
window.showBildirimModal = showBildirimModal;

/* === SAYFA MANİFESTİ YÜKLEME === */
async function fetchPanels(allowSet, denySet) {
  const res = [];
  try {
    const snap = await window.db.collection('sayfa_manifesti').get();
    snap.forEach(doc => {
      const d = doc.data() || {}, id = doc.id, panelTitle = d.title || id;
      
      // Sistem Ayarları panelini üst menüden kaldır (sadece profil dropdown'unda kalacak)
      const panelTitleNorm = window.norm(panelTitle);
      const idNorm = window.norm(id);
      const excludedPanels = ['sistem ayarları', 'ayarlar', 'diğer', 'sistemayarları', 'sistem-ayarlari'];
      if (excludedPanels.includes(panelTitleNorm) || excludedPanels.includes(idNorm) ||
          (panelTitleNorm.includes('sistem') && panelTitleNorm.includes('ayar'))) {
        return; // Bu paneli atla
      }
      
      const panelGrant = allowSet.has(window.norm(id)) || allowSet.has(window.norm(panelTitle));
      let pages = Array.isArray(d.pages) ? d.pages : [];
      pages = pages.filter(pg => {
        const keyNorm = window.norm(pg.key || pg.title || '');
        const pageGrant = allowSet.has(keyNorm), denied = denySet.has(keyNorm);
        return !denied && (panelGrant || pageGrant);
      }).map(pg => ({
        baslik: pg.title || pg.key || 'Sayfa',
        url: normalizeUrl(pg.path || '#'),
        key: pg.key || pg.title || '',
        sira: typeof pg.order === 'number' ? pg.order : 9999
      })).sort((a, b) => a.sira - b.sira);
      if (pages.length) res.push({ id, baslik: panelTitle, sira: typeof d.order === 'number' ? d.order : 9999, pages });
    });
    res.sort((a, b) => a.sira - b.sira);
  } catch (e) { 
    console.error('sayfa_manifesti okunamadı:', e); 
  }
  return res;
}
// Global olarak erişilebilir yap
window.fetchPanels = fetchPanels;

/* === NAVİGASYON RENDER === */
function renderNav(panels) {
  const ul = document.getElementById('navMain'), drawer = document.getElementById('drawer');
  if (!ul || !drawer) return;
  ul.innerHTML = ''; 
  drawer.innerHTML = '';
  if (!panels.length) {
    const li = document.createElement('li');
    li.className = 'nav-item';
    const btn = document.createElement('div');
    btn.className = 'nav-btn';
    btn.textContent = 'Menü yok';
    li.appendChild(btn);
    ul.appendChild(li);
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'muted';
    emptyMsg.style.padding = '8px';
    emptyMsg.textContent = 'Menü bulunamadı';
    drawer.appendChild(emptyMsg);
    return;
  }
  panels.forEach(p => {
    const li = document.createElement('li'); 
    li.className = 'nav-item';
    // Güvenli DOM oluşturma - innerHTML yerine
    const btn = document.createElement('div');
    btn.className = 'nav-btn';
    btn.textContent = escapeHtml(p.baslik || 'Panel');
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = '▾';
    btn.appendChild(caret);
    li.appendChild(btn);
    
    const dd = document.createElement('div'); 
    dd.className = 'dropdown';
    
    // Sayfa yoksa dropdown oluşturma
    if (!p.pages || p.pages.length === 0) {
      // Sayfa yoksa sadece buton göster, dropdown yok
      btn.style.cursor = 'default';
    } else {
      (p.pages || []).forEach(pg => {
        const a = document.createElement('a');
        a.href = normalizeUrl(pg.url || pg.path || '#'); 
        a.textContent = escapeHtml(pg.baslik || 'Sayfa');
        a.dataset.key = escapeHtml(pg.key || pg.baslik || ''); 
        a.dataset.panel = escapeHtml(p.id || ''); 
        a.dataset.panelTitle = escapeHtml(p.baslik || '');
        dd.appendChild(a);
      });
      li.appendChild(dd);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Diğer tüm dropdown'ları kapat
        ul.querySelectorAll('.nav-item').forEach(x => { 
          if (x !== li) x.classList.remove('open'); 
        });
        // Bu dropdown'u aç/kapat
        li.classList.toggle('open');
      });
    }
    ul.appendChild(li);

    const h = document.createElement('div'); 
    h.className = 'panel-title'; 
    h.textContent = escapeHtml(p.baslik || 'Panel'); 
    drawer.appendChild(h);
    (p.pages || []).forEach(pg => {
      const a = document.createElement('a');
      a.href = normalizeUrl(pg.url || pg.path || '#'); 
      a.textContent = escapeHtml(pg.baslik || 'Sayfa');
      a.dataset.key = escapeHtml(pg.key || pg.baslik || ''); 
      a.dataset.panel = escapeHtml(p.id || ''); 
      a.dataset.panelTitle = escapeHtml(p.baslik || '');
      drawer.appendChild(a);
    });
  });
  
  // Dropdown dışına tıklanınca kapat (ama link tıklamalarına izin ver)
  document.addEventListener('click', (e) => {
    // Eğer tıklanan element bir dropdown linki ise, dropdown'u kapatma
    if (e.target.closest('.dropdown a')) {
      // Link tıklaması - dropdown'u kapat ama linkin çalışmasına izin ver
      setTimeout(() => {
        ul.querySelectorAll('.nav-item').forEach(x => x.classList.remove('open'));
      }, 100);
      return;
    }
    // Dropdown dışına tıklanırsa kapat
    if (!ul.contains(e.target) && !e.target.closest('.dropdown')) {
      ul.querySelectorAll('.nav-item').forEach(x => x.classList.remove('open'));
    }
  });
}
// Global olarak erişilebilir yap
window.renderNav = renderNav;

/* === DROPDOWN & DRAWER DAVRANIŞLARI === */
function initAppShell() {
  // Hamburger & Drawer
  const hamb = document.getElementById('hamburger'), drawer = document.getElementById('drawer');
  if (hamb && drawer) {
    hamb.addEventListener('click', () => drawer.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!drawer.contains(e.target) && !hamb.contains(e.target)) drawer.classList.remove('open');
    });
  }

  // Bildirim & Profil Dropdown
  const notifBtn = document.getElementById('btnNotif');
  const notifDD = document.getElementById('notifDropdown');
  const profBtn = document.getElementById('btnProfile');
  const profDD = document.getElementById('profDropdown');
  
  // "Tüm bildirimleri gör →" linkini kaldır
  if (notifDD) {
    const tumLinkler = notifDD.querySelectorAll('a');
    tumLinkler.forEach(link => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent || '';
      if (href.includes('bildirim.html') || text.includes('Tüm bildirimleri gör')) {
        link.remove();
      }
    });
  }
  
  function closeAll(e) {
    if (notifDD && !notifDD.contains(e.target) && e.target !== notifBtn) {
      notifDD.parentElement.classList.remove('open');
    }
    if (profDD && !profDD.contains(e.target) && e.target !== profBtn) {
      profDD.parentElement.classList.remove('open');
    }
  }
  document.addEventListener('click', closeAll);
  
  if (notifBtn && notifDD) {
    notifBtn.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      notifDD.parentElement.classList.toggle('open'); 
      if (profDD) profDD.parentElement.classList.remove('open'); 
    });
  }
  
  if (profBtn && profDD) {
    profBtn.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      profDD.parentElement.classList.toggle('open'); 
      if (notifDD) notifDD.parentElement.classList.remove('open'); 
    });
  }
  
  // Logout
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      try { 
        await window.auth.signOut(); 
        // Path'i normalize et
        const indexPath = normalizeUrl('index.html');
        location.assign(indexPath); 
      } catch (err) { 
        console.error('Çıkış hatası:', err); 
        showToast('error', 'Hata', 'Çıkış yapılamadı.');
      }
    });
  }

  // Link guard - yetki kontrolü
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-key]');
    if (!a) return;
    const key = window.norm(a.dataset.key || '');
    const pnl = window.norm(a.dataset.panel || '');
    const pnlTitle = window.norm(a.dataset.panelTitle || '');
    
    // Eğer key boşsa veya sadece panel yetkisi varsa izin ver
    if (!key && (pnl || pnlTitle)) {
      // Panel yetkisi varsa izin ver
      if (CURRENT_ALLOW.has(pnl) || CURRENT_ALLOW.has(pnlTitle)) {
        return; // İzin ver, normal link davranışı
      }
    }
    
    // Deny kontrolü
    if (key && CURRENT_DENY.has(key)) { 
      e.preventDefault(); 
      showToast('warning', 'Yetki Yok', 'Bu sayfa için yetkiniz yok.');
      return; 
    }
    
    // Allow kontrolü
    const allowed = !key || CURRENT_ALLOW.has(key) || CURRENT_ALLOW.has(pnl) || CURRENT_ALLOW.has(pnlTitle);
    if (!allowed) { 
      e.preventDefault(); 
      showToast('warning', 'Yetki Yok', 'Bu sayfa için yetkiniz yok.');
    }
  });
}

/* === AUTH + INIT (DÜZELTİLMİŞ HALİ) === */
function initAppShellAuth() {
  window.auth.onAuthStateChanged(async (user) => {
    
    // --- DÜZELTME BAŞLANGICI ---
    // Şu an hangi sayfadayız kontrol et
    const path = window.location.pathname;
    // Eğer dosya adı 'index.html' ise veya anasayfadaysak ('/'), yönlendirme yapma!
    const isLoginPage = path.includes('index.html') || path === '/' || path.endsWith('/');

    if (!user) {
      // Eğer kullanıcı yoksa VE biz zaten giriş sayfasında DEĞİLSEK yönlendir
      if (!isLoginPage) {
        const indexPath = normalizeUrl('index.html');
        window.location.href = indexPath;
      }
      // Giriş sayfasındaysak hiçbir şey yapma (kullanıcı form doldursun)
      return;
    }
    // --- DÜZELTME BİTİŞİ ---

    // Eğer kullanıcı zaten giriş yapmışsa ve şu an index.html'de ise panele at (İsteğe bağlı opsiyon)
    if (user && isLoginPage) {
        window.location.href = "panel.html";
        return;
    }

    try {
      const userDoc = await window.db.collection('kullanicilar').doc(user.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        const profNameEl = document.getElementById('profName');
        if (profNameEl) {
          const name = data.adSoyad || user.email?.split('@')[0] || 'Profil';
          profNameEl.textContent = `👤 ${name}`;
        }

        const rawPerms = Array.isArray(data.yetkiler) ? data.yetkiler : [];
        CURRENT_ALLOW = new Set(rawPerms.filter(s => !String(s).trim().startsWith('-') && !String(s).trim().startsWith('!')).map(norm));
        CURRENT_DENY = new Set(rawPerms.filter(s => String(s).trim().startsWith('-') || String(s).trim().startsWith('!')).map(s => window.norm(String(s).replace(/^[-!]\s*/, ''))));
        
        window.CURRENT_ALLOW = CURRENT_ALLOW;
        window.CURRENT_DENY = CURRENT_DENY;

        const panels = await fetchPanels(CURRENT_ALLOW, CURRENT_DENY);
        renderNav(panels);

        await loadNotifications();
      }
    } catch (e) {
      console.error('Kullanıcı bilgisi alınamadı:', e);
      showToast('error', 'Hata', 'Kullanıcı bilgisi yüklenemedi.');
    }

    if (typeof window.initPage === 'function') {
      await window.initPage();
    }
  });
}

/* === DOMContentLoaded'da başlat === */
// Firebase yüklendikten sonra çalışacak şekilde ayarla
function initWhenReady() {
  initAppShell();
  // Auth sadece Firebase yüklendikten sonra
  if (typeof firebase !== 'undefined' && firebase.auth && db && auth) {
    initAppShellAuth();
  } else {
    // Firebase henüz yüklenmediyse biraz bekle
    setTimeout(() => {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        const db2 = window.db || firebase.firestore();
        const auth2 = window.auth || firebase.auth();
        if (db2 && auth2) {
          window.db = db2;
          window.auth = auth2;
          initAppShellAuth();
        }
      }
    }, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhenReady);
} else {
  initWhenReady();
}
