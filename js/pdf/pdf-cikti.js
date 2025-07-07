// pdf-cikti.js

function pdfCiktisiAl() {
  const el = document.getElementById("pdfAlani");
  html2pdf().from(el).save("talebe-bilgisi.pdf");

  if (!element) {
    alert("PDF alanı bulunamadı!");
    return;
  }

  const opt = {
    margin:       [0.5, 0.5, 0.5, 0.5], // üst, sol, alt, sağ
    filename:     'talebe-bilgi-formu.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 800
    },
    jsPDF:        {
      unit: 'in',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  // PDF oluştur
  html2pdf().set(opt).from(element).save();
}
