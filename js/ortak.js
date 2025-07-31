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

      auth.signInWithEmailAndPassword(email, password)
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

      auth.sendPasswordResetEmail(email)
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
      const veri = doc.data();

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
      { baslik: "İzin Giriş/Çıkış", ikon: "🛫", link: "talebe/izin-giriscikis.html" },
      { baslik: "Aidat ve Kitap Ücretleri", ikon: "📥", link: "talebe/aidat-kitap.html" },
    ];
  } else if (panelAdi === "personel") { 
    kartlar = [
      { baslik: "Nöbet Çizelgesi", ikon: "📅", link: "personel/nobet.html" },
      { baslik: "Personel Aylık Performans", ikon: "📊", link: "personel/aylik-performans.html" },
      { baslik: "Hedefler", ikon: "🎯", link: "personel/hedef-grafik.html" },
      { baslik: "Alacak Takibi", ikon: "💰", link: "personel/alacak-takibi.html" },
      { baslik: "Temizlik Kontrolü", ikon: "🧹", link: "personel/temizlik-kontrolu.html" },
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
      { baslik: "Hedef ve Veri Girişi" , ikon: "📝", link: "muhasebe/muhasebe-form.html"},
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
