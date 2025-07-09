window.ilerleAdim1 = async function () {
  const kimlikAd = document.getElementById("kimlikAd").value;
  const kullAd = document.getElementById("kullAd").value.trim();
  const dogumTarihi = document.getElementById("dogumTarihi").value;
  const kurs = document.getElementById("kurs").value;
  const durum = document.getElementById("durum").value;
  const mezhep = document.getElementById("mezhep").value;
  const kanGrubu = document.getElementById("kanGrubu").value;

  let tc = "", memleket = "", ikametVarMi = "", kimlikBitis = "", ulke = "";

  // Ensar seçiliyse
  if (durum === "ensar") {
    tc = document.getElementById("tc").value.trim();
    memleket = document.getElementById("il").value;
    if (tc.length !== 11) {
      toastGoster("TC Kimlik Numarası 11 haneli olmalıdır!");
      return;
    }
  }

  // Muhacir seçiliyse
  else if (durum === "muhacir") {
    ikametVarMi = document.getElementById("ikametDurumu").value;
    if (ikametVarMi === "var") {
      kimlikBitis = document.getElementById("kimlikBitis").value;
    }
    ulke = document.getElementById("ulke").value;
  }

  // Ortak zorunlu alanlar kontrolü
  if (!kimlikAd || !kullAd || !dogumTarihi || !kurs || !durum || !mezhep || !kanGrubu) {
    toastGoster("Lütfen tüm alanları doldurunuz.");
    return;
  }

  const veri = {
    kimlikAd,
    kullAd,
    dogumTarihi,
    kurs,
    durum,
    mezhep,
    kanGrubu,
    kayitZamani: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (durum === "ensar") {
    veri.tc = tc;
    veri.memleket = memleket;
  } else if (durum === "muhacir") {
    veri.ikamet = ikametVarMi;
    if (kimlikBitis) veri.kimlikBitis = kimlikBitis;
    veri.ulke = ulke;
  }

  try {
    let uid = localStorage.getItem("aktifTalebeUID");

// 🔄 Adım 1: Önce veriyi kaydet veya güncelle


    if (!uid) {
      // UID yoksa yeni kayıt oluştur
      const docRef = await firebase.firestore().collection("talebeler").add(veri);
      uid = docRef.id;
      localStorage.setItem("aktifTalebeUID", uid);
    } else {
      // UID varsa ama belge yoksa set ile oluştur, varsa update
      const doc = await firebase.firestore().collection("talebeler").doc(uid).get();
      if (!doc.exists) {
        await firebase.firestore().collection("talebeler").doc(uid).set(veri);
      } else {
        await firebase.firestore().collection("talebeler").doc(uid).update(veri);
      }
    }

    toastGoster("1. adım başarıyla kaydedildi. Sıradaki aşamaya geçiliyor...");

    setTimeout(() => {
      fetch("parcalar/talebe-kayit-adim2.html")
        .then(res => res.text())
        .then(html => {
          document.getElementById("icerik-paneli").innerHTML = html;
          const yeniScript = document.createElement("script");
          yeniScript.src = "js/talebe-kayit-adim2.js";
          document.body.appendChild(yeniScript);
        });
    }, 1000);

  } catch (hata) {
    console.error("Kayıt hatası:", hata);
    toastGoster("Kayıt sırasında bir hata oluştu!", 5000);
  }
};

// 🔁 Sayfa yüklendiğinde varsa eski veriyi doldur
function geriVeriYukleAdim1() {
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) return;

  firebase.firestore().collection("talebeler").doc(uid).get()
    .then(doc => {
      if (!doc.exists) return;
      const data = doc.data();

      document.getElementById("kimlikAd").value = data.kimlikAd || "";
      document.getElementById("kullAd").value = data.kullAd || "";
      document.getElementById("dogumTarihi").value = data.dogumTarihi || "";
      document.getElementById("kurs").value = data.kurs || "";
      document.getElementById("durum").value = data.durum || "";
      document.getElementById("mezhep").value = data.mezhep || "";
      document.getElementById("kanGrubu").value = data.kanGrubu || "";
      // document.getElementById("fotoInput").value = data.fotoInput || "";

      if (data.durum === "ensar") {
        document.getElementById("tc").value = data.tc || "";
        document.getElementById("il").value = data.memleket || "";
      } else if (data.durum === "muhacir") {
        document.getElementById("ikametDurumu").value = data.ikamet || "";
        document.getElementById("kimlikBitis").value = data.kimlikBitis || "";
        document.getElementById("ulke").value = data.ulke || "";
      }

      // Alan görünürlükleri
      setTimeout(() => {
        durumDegisti();
        ikametDurumuDegisti();
      }, 100);
    });
}

geriVeriYukleAdim1();

// 🔄 Durum değiştiğinde (Muhacir/Ensar)
window.durumDegisti = function () {
  const secim = document.getElementById("durum").value;
  const ensarAlani = document.getElementById("ensarAlani");
  const muhacirAlani = document.getElementById("muhacirAlani");

  if (secim === "ensar") {
    ensarAlani.style.display = "block";
    muhacirAlani.style.display = "none";
  } else if (secim === "muhacir") {
    ensarAlani.style.display = "none";
    muhacirAlani.style.display = "block";
  } else {
    ensarAlani.style.display = "none";
    muhacirAlani.style.display = "none";
  }

  ikametDurumuDegisti();
};

// 🔄 İkamet Durumu değiştiğinde
window.ikametDurumuDegisti = function () {
  const ikametDurumu = document.getElementById("ikametDurumu")?.value;
  const kimlikBitisDiv = document.getElementById("kimlikBitisDiv");

  if (ikametDurumu === "var") {
    kimlikBitisDiv.style.display = "block";
  } else {
    kimlikBitisDiv.style.display = "none";
  }
};

function toastGoster(mesaj, sure = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = mesaj;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, sure);
}

// yeni kayıt için özel bir sayfadaysa, UID temizlenmeli
window.addEventListener("DOMContentLoaded", () => {
  if (window.location.href.includes("talebe-kayit")) {
    localStorage.removeItem("aktifTalebeUID");
  }
});
