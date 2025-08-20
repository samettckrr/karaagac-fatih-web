// Sayfa yüklendiğinde mevcut sağlık verisini getir
geriVeriYukleAdim5();

function geriVeriYukleAdim5() {
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) return;

  firebase.firestore().collection("talebeler").doc(uid).get()
    .then(doc => {
      if (!doc.exists || !doc.data().saglikBilgisi) return;
      const s = doc.data().saglikBilgisi;
      document.getElementById("saglikNot").value = s.rahatsizlik || "";
    });
}

function ilerleAdim5() {
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) return toastGoster("Talebe ID bulunamadı", "hata");

  const rahatsizlik = document.getElementById("saglikNot").value.trim();

  const veri = {
    saglikBilgisi: {
      rahatsizlik
    }
  };

  firebase.firestore().collection("talebeler").doc(uid).set(veri, { merge: true })
    .then(() => {
      toastGoster("5. adım başarıyla kaydedildi. 6. adıma geçiliyor...");
      setTimeout(() => {
        fetch("parcalar/talebe-kayit-adim6.html")
          .then(res => res.text())
          .then(html => {
            document.getElementById("icerik-paneli").innerHTML = html;
            const script = document.createElement("script");
            script.src = "js/talebe-kayit-adim6.js";
            document.body.appendChild(script);
          });
      }, 1000);
    })
    .catch(err => {
      console.error("Firestore hatası:", err);
      toastGoster("Kayıt sırasında bir hata oluştu: " + err.message, "hata");
    });
}

function geriGelAdim4() {
  fetch("parcalar/talebe-kayit-adim4.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("icerik-paneli").innerHTML = html;
      const script = document.createElement("script");
      script.src = "js/talebe-kayit-adim4.js";
      document.body.appendChild(script);
    });
}

// Bildirim (toast)
function toastGoster(mesaj, tur = "basari") {
  const toast = document.getElementById("toast");
  toast.textContent = mesaj;
  toast.className = "toast-bildirim " + tur;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}