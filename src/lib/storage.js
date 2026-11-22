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
 * Upload berkas dokumen/tugas (PDF, DOCX, PPTX, XLSX, ZIP, Gambar, dll.)
 * Menggunakan backend MySQL server (/api/upload).
 * Jika backend sedang offline, fallback secara otomatis ke base64 DataURL (tetap tersimpan dan bisa dibuka).
 * 
 * @param {File} file - Berkas dokumen atau tugas
 * @param {function} onProgress - Callback progress (0-100)
 * @returns {Promise<{ file_url: string, url: string, name: string, size: string, type: string }>}
 */
export async function uploadDocument(file, onProgress = null) {
  if (onProgress) onProgress(20);
  try {
    const res = await uploadFile(file, onProgress);
    if (onProgress) onProgress(100);
    const sizeStr = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(1) + "MB"
      : Math.round(file.size / 1024) + "KB";
    const ext = file.name.split(".").pop().toUpperCase();
    return {
      file_url: res.file_url || res.url,
      url: res.url || res.file_url,
      name: file.name,
      filename: res.filename || file.name,
      size: sizeStr,
      type: ext,
    };
  } catch (err) {
    console.warn("[Upload Document] Server upload gagal, beralih ke penyimpanan lokal base64:", err.message);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (onProgress) onProgress(100);
        const sizeStr = file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(1) + "MB"
          : Math.round(file.size / 1024) + "KB";
        const ext = file.name.split(".").pop().toUpperCase();
        resolve({
          file_url: e.target.result,
          url: e.target.result,
          name: file.name,
          filename: file.name,
          size: sizeStr,
          type: ext,
        });
      };
      reader.onerror = () => reject(new Error("Gagal membaca dokumen berkas"));
      reader.readAsDataURL(file);
    });
  }
}
