import { uploadFile } from "./api";

/**
 * Upload gambar atau video untuk Gallery / Profil / Materi
 * Menggunakan backend MySQL server (/api/upload).
 * Jika backend sedang offline, fallback secara otomatis ke base64 DataURL (tetap tersimpan dan tampil).
 * 
 * @param {File} file - File gambar atau video
 * @param {string} folder - Kategori (default: 'gallery')
 * @param {function} onProgress - Callback progress (0-100)
 * @returns {Promise<{ url: string, storagePath: string|null }>}
 */
export async function uploadImage(file, folder = "gallery", onProgress = null) {
  if (onProgress) onProgress(20);

  try {
    const res = await uploadFile(file, onProgress);
    if (onProgress) onProgress(100);
    return {
      url: res.file_url,
      storagePath: res.file_url,
    };
  } catch (err) {
    console.warn("[Upload] Upload server gagal, beralih ke penyimpanan lokal base64:", err.message);

    // Fallback: baca file menjadi Base64 Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (onProgress) onProgress(100);
        resolve({
          url: e.target.result,
          storagePath: null,
        });
      };
      reader.onerror = () => reject(new Error("Gagal membaca file media"));
      reader.readAsDataURL(file);
    });
  }
}

export const uploadMedia = uploadImage;

/**
 * Upload file dokumen/PDF
 */
export async function uploadDocument(file) {
  try {
    const res = await uploadFile(file);
    return { file_url: res.file_url };
  } catch {
    return { file_url: `/uploads/${file.name}` };
  }
}
