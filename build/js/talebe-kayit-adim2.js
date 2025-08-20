// Sayfa yüklendiğinde otomatik veriyi getir
geriVeriYukleAdim2();

function geriVeriYukleAdim2() {
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) return;

  firebase.firestore().collection("talebeler").doc(uid).get()
    .then(doc => {
      if (!doc.exists || !doc.data().okulBilgisi) return;
      const o = doc.data().okulBilgisi;

      document.getElementById("ogrenimSeviyesi").value = o.ogrenimSeviyesi || "";
      document.getElementById("mezuniyetDurumu").value = o.mezuniyetDurumu || "";
      document.getElementById("egitimTuru").value = o.egitimTuru || "";

      if (o.ogrenimSeviyesi === "üniversite") {
        document.getElementById("universiteAlani").style.display = "block";
        document.getElementById("universiteTuru").value = o.universiteTuru || "";
        document.getElementById("universiteAdi").value = o.universiteAdi || "";
        document.getElementById("bolum").value = o.bolum || "";
        document.getElementById("uniSinif").value = o.uniSinif || "";
      }
    });
}

window.ilerleAdim2 = function () {
  const ogrenimSeviyesi = document.getElementById("ogrenimSeviyesi").value;
  const mezuniyetDurumu = document.getElementById("mezuniyetDurumu").value;
  const egitimTuru = document.getElementById("egitimTuru").value;

  const veri = {
    okulBilgisi: {
      ogrenimSeviyesi,
      mezuniyetDurumu,
      egitimTuru
    }
  };

  if (ogrenimSeviyesi === "üniversite") {
    veri.okulBilgisi.universiteTuru = document.getElementById("universiteTuru").value;
    veri.okulBilgisi.universiteAdi = document.getElementById("universiteAdi").value.trim();
    veri.okulBilgisi.bolum = document.getElementById("bolum").value.trim();
    veri.okulBilgisi.uniSinif = document.getElementById("uniSinif").value.trim();
  }

  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) {
    toastGoster("Talebe ID bulunamadı. Lütfen baştan başlayın.", 4000);
    return;
  }

  firebase.firestore().collection("talebeler").doc(uid).set(veri, { merge: true })
    .then(() => {
      toastGoster("2. adım başarıyla kaydedildi. 3. adıma geçiliyor...");
      setTimeout(() => {
        fetch("parcalar/talebe-kayit-adim3.html")
          .then(res => res.text())
          .then(html => {
            document.getElementById("icerik-paneli").innerHTML = html;
            const yeniScript = document.createElement("script");
            yeniScript.src = "js/talebe-kayit-adim3.js";
            document.body.appendChild(yeniScript);
          });
      }, 1000);
    })
    .catch(err => {
      console.error("Kayıt hatası:", err);
      toastGoster("Kayıt sırasında bir hata oluştu!", 4000);
    });
};

window.geriGelAdim1 = function () {
  fetch("parcalar/talebe-kayit.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("icerik-paneli").innerHTML = html;
      const script = document.createElement("script");
      script.src = "js/talebe-kayit-adim1.js";
      document.body.appendChild(script);
    });
};

window.okulSeviyesiDegisti = function () {
  const secim = document.getElementById("ogrenimSeviyesi").value;
  document.getElementById("universiteAlani").style.display = (secim === "üniversite") ? "block" : "none";
};

function toastGoster(mesaj, sure = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = mesaj;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, sure);
}
