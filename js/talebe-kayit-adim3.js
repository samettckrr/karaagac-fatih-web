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

function ilerleAdim3() {
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) {
    toastGoster("Talebe ID bulunamadı. Lütfen baştan başlayın.", "hata");
    return;
  }

  const il = document.getElementById("adresIl").value.trim();
  const ilce = document.getElementById("adresIlce").value.trim();
  const mahalle = document.getElementById("adresMahalle").value.trim();
  const acikAdres = document.getElementById("adresAcik").value.trim();

  if (!il || !ilce || !mahalle) {
    return toastGoster("Lütfen il, ilçe ve mahalle alanlarını doldurunuz.", "hata");
  }

  const veri = {
    adresBilgisi: { il, ilce, mahalle, acikAdres },
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

function toastGoster(mesaj, tur = "basari") {
  const toast = document.getElementById("toast");
  toast.textContent = mesaj;
  toast.className = "toast-bildirim " + tur;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
