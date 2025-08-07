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
      window.location.href = "katlar/lokal.html";
      break;
    case "1kat":
      window.location.href = "katlar/etüt.html";
      break;
    case "giris":
      window.location.href = "katlar/giris.html";
      break;
    case "eksi1":
      window.location.href = "katlar/yatakhane.html";
      break;
    case "eksi2":
      window.location.href = "katlar/yemekhane.html";
      break;
    case "bahce":
      window.location.href = "katlar/bahce.html";
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
