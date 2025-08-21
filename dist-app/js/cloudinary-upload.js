// cloudinary-upload.js

window.cloudinaryUpload = async function(file) {
  const cloudName = "djggzgzoy"; // kendi Cloudinary kullanıcı adın
  const uploadPreset = "talebe_yukleme"; // preset adın

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error("Cloudinary upload error:", data);
      throw new Error("Cloudinary upload failed.");
    }
  } catch (err) {
    console.error("Upload error:", err);
    throw err;
  }
};
