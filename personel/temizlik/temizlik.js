firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "../index.html";
  } else {
    // Kullanıcının yetkisine göre görünüm kısıtlanacak
    const email = user.email;

    const kartlar = document.querySelectorAll(".kart");
    kartlar.forEach(kart => {
      const metin = kart.innerText.toLowerCase();
      
      // örnek: sadece admin 'rapor' kartını görebilir
      if (metin.includes("rapor") && !email.includes("admin")) {
        kart.style.display = "none";
      }

      // diğer rol kontrolleri burada yapılabilir
      // örn: sadece "2. Kat" sorumlusu '2. Kat' kartını görsün
    });
  }
});

// Sayfa yönlendirme
function yonlendir(kod) {
  switch (kod) {
    case "2kat":
      window.location.href = "formlar/2kat-temizlik-formu.html";
      break;
    case "1kat":
      window.location.href = "formlar/1kat-temizlik-formu.html";
      break;
    case "giris":
      window.location.href = "formlar/giris-kat-temizlik.html";
      break;
    case "eksi1":
      window.location.href = "formlar/eksi1-kat-temizlik.html";
      break;
    case "eksi2":
      window.location.href = "formlar/eksi2-kat-temizlik.html";
      break;
    case "bahce":
      window.location.href = "formlar/bahce-temizlik.html";
      break;
    case "genel":
      window.location.href = "formlar/genel-kontrol.html";
      break;
    case "eksik":
      window.location.href = "formlar/eksik-takip.html";
      break;
    case "rapor":
      window.location.href = "formlar/temizlik-rapor.html";
      break;
    default:
      alert("Tanımsız yönlendirme.");
  }
}
