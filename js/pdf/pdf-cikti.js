function pdfCiktisiAl() {
  const element = document.getElementById("pdfAlani");
  if (!element) {
    alert("PDF alanı bulunamadı!");
    return;
  }

  const opt = {
    margin:       [0.5, 0.5, 0.5, 0.5],
    filename:     'talebe-bilgisi.pdf',
    image:        { type: 'png', quality: 0.98 },
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

  html2pdf().set(opt).from(element).save();
}
