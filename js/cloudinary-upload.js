async function uploadToCloudinary(file) {
  const cloudName = "djgzgzoy"; // kendi cloud_name'in
  const uploadPreset = "talebe_yukleme";  // hesabında oluşturduğun upload preset

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(url, {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  console.log("✅ YÜKLEME BAŞARILI:", data);
  return data.secure_url;
}
