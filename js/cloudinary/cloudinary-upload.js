// cloudinary-upload.js

// Cloudinary ayarları (burayı kendine göre güncelle)
const cloudName = "djgzggzoy"; 
const unsignedUploadPreset = "talebe_yukleme"; 

async function cloudinaryUpload(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", unsignedUploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${djgzggzoy}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      return data.secure_url; // URL'yi geri döneriz
    } else {
      throw new Error(data.error?.message || "Yükleme hatası");
    }
  } catch (error) {
    console.error("Cloudinary Yükleme Hatası:", error.message);
    throw error;
  }
}
