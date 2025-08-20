// Sayfa açıldığında veriyi yükle
geriVeriYukleAdim6();

function geriVeriYukleAdim6() {
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) return;

  firebase.firestore().collection("talebeler").doc(uid).get()
    .then(doc => {
      if (!doc.exists || !doc.data().vazifeBilgisi) return;
      const v = doc.data().vazifeBilgisi;

      const tumCheckboxlar = [...document.querySelectorAll("#vazifeCheckboxGrup input[type='checkbox']")];

      if (Array.isArray(v.vazifeler)) {
        v.vazifeler.forEach(val => {
          const checkbox = tumCheckboxlar.find(cb => cb.value === val);
          if (checkbox) {
            checkbox.checked = true;
          } else if (val && val !== "Diğer") {
            document.getElementById("digerCheckbox").checked = true;
            document.getElementById("digerInput").style.display = "block";
            document.getElementById("digerInput").value = val;
          }
        });
      }

      document.getElementById("cumaKilabilir").value = v.cumaKilabilir || "";
    });
}

function ilerleAdim6() {
  
  const uid = localStorage.getItem("aktifTalebeUID");
  if (!uid) return toastGoster("Talebe ID bulunamadı", "hata");

  const seciliVazifeler = [...document.querySelectorAll("#vazifeCheckboxGrup input[type='checkbox']:checked")]
    .map(cb => cb.value);

  const digerYazi = document.getElementById("digerInput").value.trim();
  if (seciliVazifeler.includes("Diğer") && digerYazi) {
    const index = seciliVazifeler.indexOf("Diğer");
    seciliVazifeler.splice(index, 1, digerYazi);
  }

  const cumaKilabilir = document.getElementById("cumaKilabilir").value;
  if (!cumaKilabilir) {
    toastGoster("Lütfen cuma namazı bilgisi seçiniz.", "hata");
    return;
  }

  const veri = {
    vazifeBilgisi: {
      vazifeler: seciliVazifeler,
      cumaKilabilir
    }
  };

  firebase.firestore().collection("talebeler").doc(uid).set(veri, { merge: true })
    .then(() => {
      toastGoster("Kayıt başarıyla tamamlandı!");
      localStorage.removeItem("aktifTalebeUID");
      setTimeout(() => {
        window.location.href = "talebe-liste.html";
      }, 1500);
    })
    .catch(err => {
      console.error("Firestore hatası:", err);
      toastGoster("Kayıt sırasında bir hata oluştu: " + err.message, "hata");
    });
}

function geriGelAdim5() {
  fetch("parcalar/talebe-kayit-adim5.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("icerik-paneli").innerHTML = html;
      const script = document.createElement("script");
      script.src = "js/talebe-kayit-adim5.js";
      document.body.appendChild(script);
    });
}

function digerGoster() {
  const digerCheckbox = document.getElementById("digerCheckbox");
  const digerInput = document.getElementById("digerInput");
  digerInput.style.display = digerCheckbox.checked ? "block" : "none";
}

function toastGoster(mesaj, tur = "basari") {
  const toast = document.getElementById("toast");
  toast.textContent = mesaj;
  toast.className = "toast-bildirim " + tur;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}