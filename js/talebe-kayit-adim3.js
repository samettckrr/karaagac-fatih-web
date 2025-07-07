// İl - İlçe - Mahalle veri yapısı (anahtarlar küçük harfle)
const adresVeri = {
  istanbul: {
    umraniye: ["Karaağaç", "Huzur", "Tatlısu"],
    buyukcekmece: ["Pınartepe", "Kumburgaz", "Mimaroba"]
  },
  ankara: {
    kecioren: ["Etlik", "Bağlum", "Şentepe"],
    cankaya: ["Kızılay", "Bahçelievler", "Yıldız"]
  }
};

// İlçe listesini güncelle
function ilceYukle() {
  const il = document.getElementById("adresIl").value;
  const ilceSelect = document.getElementById("adresIlce");
  const mahalleSelect = document.getElementById("adresMahalle");

  ilceSelect.innerHTML = `<option value="">Seçiniz...</option>`;
  mahalleSelect.innerHTML = `<option value="">Seçiniz...</option>`;

  if (il && adresVeri[il]) {
    Object.keys(adresVeri[il]).forEach(ilceKey => {
      const option = document.createElement("option");
      option.value = ilceKey;
      option.textContent = ilceKey.charAt(0).toUpperCase() + ilceKey.slice(1);
      ilceSelect.appendChild(option);
    });
  }
}

// Mahalle listesini güncelle
function mahalleYukle() {
  const il = document.getElementById("adresIl").value;
  const ilce = document.getElementById("adresIlce").value;
  const mahalleSelect = document.getElementById("adresMahalle");

  mahalleSelect.innerHTML = `<option value="">Seçiniz...</option>`;

  if (il && ilce && adresVeri[il] && adresVeri[il][ilce]) {
    adresVeri[il][ilce].forEach(mahalle => {
      const option = document.createElement("option");
      option.value = mahalle;
      option.textContent = mahalle;
      mahalleSelect.appendChild(option);
    });
  }
}

// Geri dön
function geriGelAdim2() {
  fetch("parcalar/talebe-kayit-adim2.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("icerik-paneli").innerHTML = html;
      const script = document.createElement("script");
      script.src = "js/talebe-kayit-adim2.js";
      document.body.appendChild(script);
    });
}

// İleri butonu işlemi
function ilerleAdim3() {
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) {
    toastGoster("Talebe ID bulunamadı. Lütfen baştan başlayın.", "hata");
    return;
  }

  const il = document.getElementById("adresIl").value;
  const ilce = document.getElementById("adresIlce").value;
  const mahalle = document.getElementById("adresMahalle").value;
  const acikAdres = document.getElementById("adresAcik").value.trim();


  const veri = {
    adresBilgisi: {
      adresIl: il,
      adresIlce: ilce,
      adresMahalle: mahalle,
      adresAcik: acikAdres
    },
    guncelleme: firebase.firestore.FieldValue.serverTimestamp()
  };

  firebase.firestore().collection("talebeler").doc(uid).set(veri, { merge: true })
    .then(() => {
      toastGoster("3. adım başarıyla kaydedildi. 4. adıma geçiliyor...");
      setTimeout(() => {
        fetch("parcalar/talebe-kayit-adim4.html")
          .then(res => res.text())
          .then(html => {
            document.getElementById("icerik-paneli").innerHTML = html;
            const yeniScript = document.createElement("script");
            yeniScript.src = "js/talebe-kayit-adim4.js";
            document.body.appendChild(yeniScript);
          });
      }, 1000);
    })
    .catch((err) => {
      console.error("Firestore hatası:", err);
      toastGoster("Kayıt sırasında hata oluştu: " + err.message, "hata");
    });
}

// Toast fonksiyonu
function toastGoster(mesaj, tur = "basari") {
  const toast = document.getElementById("toast");
  toast.textContent = mesaj;
  toast.className = "toast-bildirim " + tur;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}