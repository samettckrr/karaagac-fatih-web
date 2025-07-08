window.cloudinaryUpload = async function (file) {
  const url = `https://api.cloudinary.com/v1_1/djgzggzoy/upload`;
  const preset = "talebe_yukleme";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const response = await fetch(url, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Cloudinary yükleme başarısız");
  }

  const data = await response.json();
  return data.secure_url;
};

