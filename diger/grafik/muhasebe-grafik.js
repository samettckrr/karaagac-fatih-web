document.addEventListener("DOMContentLoaded", function () {
  const db = firebase.firestore();
  const kategoriSecimi = document.getElementById("kategoriSecimi");
  const tabloBody = document.querySelector("#hedefTablosu tbody");
  const toplamHedefEl = document.getElementById("toplamHedef");
  const toplamTeminEl = document.getElementById("toplamTemin");
  const toplamOranEl = document.getElementById("toplamOran");
  let chart;
  window.veriTablosu = [];

  // Kategori değişince veri çek ve güncelle
  window.kategoriDegisti = async function () {
    const kategori = kategoriSecimi.value;

    const hedeflerSnap = await db.collection("hedefler").where("kategori", "==", kategori).get();
    const verilerSnap = await db.collection("veriler").where("kategori", "==", kategori).get();

    const hedefMap = {};
    const teminMap = {};

    hedeflerSnap.forEach(doc => {
      const { personel, hedef } = doc.data();
      hedefMap[personel] = hedef;
    });

    verilerSnap.forEach(doc => {
      const { personel, miktar } = doc.data();
      if (!teminMap[personel]) teminMap[personel] = 0;
      teminMap[personel] += miktar;
    });

    let toplamHedef = 0;
    let toplamTemin = 0;
    const chartLabels = [];
    const chartData = [];
    const tabloDizi = [];

    Object.keys(hedefMap).forEach(personel => {
      const hedef = hedefMap[personel] || 0;
      const temin = teminMap[personel] || 0;
      const oran = hedef > 0 ? Math.round((temin / hedef) * 100) : 0;

      toplamHedef += hedef;
      toplamTemin += temin;

      tabloDizi.push({ personel, hedef, temin, oran });
      chartLabels.push(personel);
      chartData.push(oran);
    });

    window.veriTablosu = tabloDizi;
    tabloyuYenidenYaz(tabloDizi);

    toplamHedefEl.textContent = `₺${toplamHedef.toLocaleString("tr-TR")}`;
    toplamTeminEl.textContent = `₺${toplamTemin.toLocaleString("tr-TR")}`;
    toplamOranEl.textContent = toplamHedef > 0 ? `%${Math.round((toplamTemin / toplamHedef) * 100)}` : "%0";

    // Grafik çizimi
    if (chart) chart.destroy();
    const ctx = document.getElementById("hedefGrafik").getContext("2d");
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: chartLabels,
        datasets: [{
          label: "Hedefe Ulaşma Oranı (%)",
          data: chartData,
          backgroundColor: "#2e7d32"
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: Math.max(...chartData, 100)
          }
        }
      }
    });

    tarihSaatGuncelle();
  };

  // Tabloyu güncelleyen fonksiyon
  function tabloyuYenidenYaz(veriler) {
    tabloBody.innerHTML = "";

    veriler.forEach(p => {
      const tr = document.createElement("tr");

      const td1 = document.createElement("td");
      td1.textContent = p.personel;

      const td2 = document.createElement("td");
      td2.textContent = `${p.hedef.toLocaleString("tr-TR")} ₺`;

      const td3 = document.createElement("td");
      td3.textContent = `${p.temin.toLocaleString("tr-TR")} ₺`;

      const td4 = document.createElement("td");
      td4.textContent = `${p.oran}%`;
      td4.classList.add("oran-hucre");
      td4.style.backgroundColor = oranRengi(p.oran);
      td4.style.color = "white";

      tr.append(td1, td2, td3, td4);
      tabloBody.appendChild(tr);
    });
  }

  // Filtreleme
  window.filtreUygula = function () {
    const secim = document.getElementById("filtreSecimi").value;
    let dizi = [...window.veriTablosu];

    switch (secim) {
      case "personel-az": dizi.sort((a, b) => a.personel.localeCompare(b.personel)); break;
      case "personel-za": dizi.sort((a, b) => b.personel.localeCompare(a.personel)); break;
      case "hedef-artan": dizi.sort((a, b) => a.hedef - b.hedef); break;
      case "hedef-azalan": dizi.sort((a, b) => b.hedef - a.hedef); break;
      case "temin-artan": dizi.sort((a, b) => a.temin - b.temin); break;
      case "temin-azalan": dizi.sort((a, b) => b.temin - a.temin); break;
      case "oran-artan": dizi.sort((a, b) => a.oran - b.oran); break;
      case "oran-azalan": dizi.sort((a, b) => b.oran - a.oran); break;
    }

    tabloyuYenidenYaz(dizi);
  };

  // Ulaşma oranına göre renk belirleme
  function oranRengi(orani) {
    if (orani <= 30) return '#e74c3c';     // kırmızı
    if (orani <= 60) return '#f39c12';     // turuncu
    if (orani <= 100) return '#27ae60';    // yeşil
    return '#145a32';                      // 100+ koyu yeşil
  }

  // Sayfa yenileme zamanını yaz
  function tarihSaatGuncelle() {
    const now = new Date();
    const str = now.toLocaleDateString("tr-TR") + " - " + now.toLocaleTimeString("tr-TR");
    document.getElementById("guncellemeZamani").textContent = str;
  }

  // Sayfa yüklenince çalıştır
  kategoriDegisti();
});
