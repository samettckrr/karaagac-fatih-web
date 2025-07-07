function talebeBilgiFormuYukle() {
  console.log("🔥 talebeBilgiFormuYukle() çağrıldı");

  const db = firebase.firestore();
  const kartAlani = document.getElementById("talebeKartAlani");

  if (!kartAlani) {
    console.warn("⚠️ talebeKartAlani bulunamadı.");
    return;
  }

  kartAlani.innerHTML = ""; // Önceki kartları temizle

  let toplam = 0;
  let ensar = 0;
  let muhacir = 0;

  db.collection("talebeler").get()
    .then((snapshot) => {
      console.log("📦 Talebe sayısı:", snapshot.size);

      snapshot.forEach((doc) => {
        const data = doc.data();
        const uid = doc.id;

        toplam++;
        if (data.durum === "ensar") ensar++;
        else if (data.durum === "muhacir") muhacir++;

const kart = document.createElement("div");
kart.classList.add("talebe-kart");
kart.innerHTML = `
  <img src="${data.fotograf || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.kullAd || 'Talebe')}&background=random`}" 
       alt="Fotoğraf" 
       style="width: 70px; height: 70px; object-fit: cover; border-radius: 50%;">
  <div class="isim">${data.kullAd || "İsimsiz"}</div>
  <div class="durum">Durum: ${data.durum || '-'}</div>
  <div class="kurs">Kurs: ${data.kurs || '-'}</div>
`;

        kart.addEventListener("click", () => {
          localStorage.setItem("aktifTalebeUID", uid);
          document.getElementById("talebeModal").style.display = "flex";
          document.body.style.overflow = "hidden";
          if (typeof yukleModalIcerik === "function") {
            yukleModalIcerik();
          }
        });

        kartAlani.appendChild(kart);
      });

      document.getElementById("toplamSayisi").textContent = toplam;
      document.getElementById("ensarSayisi").textContent = ensar;
      document.getElementById("muhacirSayisi").textContent = muhacir;
    })
    .catch((error) => {
      console.error("❌ Talebeler çekilirken hata oluştu:", error);
    });
}
