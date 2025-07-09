const db = firebase.firestore();

function ilerleAdim4() {
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) return toastGoster("Talebe ID bulunamadı!", "hata");

  const veri = {
    aileBilgisi: {
      babaAd: document.getElementById("babaAd").value.trim(),
      babaTel: document.getElementById("babaTel").value.trim(),
      babaDurum: document.getElementById("babaDurum").value,
      babaMeslek: document.getElementById("babaMeslek").value.trim(),
      anneAd: document.getElementById("anneAd").value.trim(),
      anneTel: document.getElementById("anneTel").value.trim(),
      anneDurum: document.getElementById("anneDurum").value,
      anneMeslek: document.getElementById("anneMeslek").value.trim(),
      maddiDurum: document.getElementById("maddiDurum").value,
      kardesSayisi: parseInt(document.getElementById("kardesSayisi").value),
      kurstakiKardesSayisi: parseInt(document.getElementById("kurstakiKardesSayisi").value)
    }
  };

  db.collection("talebeler").doc(uid).set(veri, { merge: true })
    .then(() => {
      toastGoster("4. adım başarıyla kaydedildi. 5. adıma geçiliyor...");
      setTimeout(() => {
        fetch("parcalar/talebe-kayit-adim5.html")
          .then(res => res.text())
          .then(html => {
            document.getElementById("icerik-paneli").innerHTML = html;
            const script = document.createElement("script");
            script.src = "js/talebe-kayit-adim5.js";
            document.body.appendChild(script);
          });
      }, 1200);
    })
    .catch(err => {
      console.error("Kayıt hatası:", err);
      toastGoster("Kayıt sırasında bir hata oluştu!", "hata");
    });
}

function geriGelAdim3() {
  fetch("parcalar/talebe-kayit-adim3.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("icerik-paneli").innerHTML = html;
      const script = document.createElement("script");
      script.src = "js/talebe-kayit-adim3.js";
      document.body.appendChild(script);
    });
}

function toastGoster(mesaj, tur = "basari") {
  const toast = document.getElementById("toast");
  toast.textContent = mesaj;
  toast.className = "toast-bildirim " + tur;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
