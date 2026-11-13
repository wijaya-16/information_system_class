import axios from "axios";
import { CLASS_MEMBERS, getMemberByNim } from "../data/classMembers";

// Base URL API Backend Express + MySQL
const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Cek apakah aplikasi berjalan di HTTPS (seperti di Vercel), sementara endpoint masih localhost HTTP
const isHttpsProtocol =
  typeof window !== "undefined" && window.location.protocol === "https:";

const isLocalhostEndpoint =
  RAW_BASE_URL.includes("localhost") || RAW_BASE_URL.includes("127.0.0.1");

// Jika di hosting HTTPS (Vercel) dan endpoint localhost, browser akan memblokir Mixed Content
export const isStandaloneMode = isHttpsProtocol && isLocalhostEndpoint;

export const BASE_URL = RAW_BASE_URL;

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

// Interceptor: Otomatis sisipkan Token JWT jika pengguna login
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("si_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── 1. Helper URL File / Gambar ─────────────────────────────────────────────
export function getFileUrl(path) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const serverBase = BASE_URL.replace(/\/api\/?$/, "");
  return `${serverBase}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ─── 2. Helper Upload File ke Backend Multer ─────────────────────────────────
export async function uploadFile(file, onProgress = null) {
  if (isStandaloneMode) {
    // Mode Standalone: fallback ke base64 data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (onProgress) onProgress(100);
        resolve({ file_url: e.target.result });
      };
      reader.readAsDataURL(file);
    });
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 300000, // 5 menit untuk upload video dan file media besar
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
}

// ─── 3. Health Check & Fetch All Data ─────────────────────────────────────────
export async function checkServerHealth() {
  if (isStandaloneMode) {
    return { status: "standalone", message: "Aplikasi berjalan dalam mode mandiri (Vercel Standalone)" };
  }

  try {
    const res = await axiosInstance.get("/health");
    return { status: "ok", data: res.data };
  } catch {
    try {
      const resFallback = await axiosInstance.get("/courses");
      return { status: "ok", data: resFallback.data };
    } catch (err) {
      return { status: "error", message: err.message };
    }
  }
}

export async function fetchAllData() {
  if (isStandaloneMode) {
    return null; // Gunakan INITIAL_DATABASE + localStorage di frontend
  }

  try {
    const [
      coursesRes,
      materialsRes,
      assignmentsRes,
      announcementsRes,
      photosRes,
      membersRes,
      submissionsRes,
    ] = await Promise.allSettled([
      axiosInstance.get("/courses"),
      axiosInstance.get("/materials"),
      axiosInstance.get("/assignments"),
      axiosInstance.get("/announcements"),
      axiosInstance.get("/photos"),
      axiosInstance.get("/members"),
      axiosInstance.get("/submissions"),
    ]);

    const get = (res, fallback = []) =>
      res.status === "fulfilled" && res.value?.data ? res.value.data : fallback;

    return {
      courses: get(coursesRes),
      materials: get(materialsRes),
      assignments: get(assignmentsRes),
      announcements: get(announcementsRes),
      classPhotos: get(photosRes),
      members: get(membersRes, {}),
      submissions: get(submissionsRes),
    };
  } catch (error) {
    console.warn("Gagal mengambil data lengkap dari server MySQL:", error.message);
    return null;
  }
}

// ─── 4. Autentikasi Cerdas Mandiri (Fallback Offline / Vercel Standalone) ───────
export function authenticateOffline({ identifier, password }) {
  const idClean = (identifier || "").trim();
  const passClean = (password || "").trim();

  if (!idClean || !passClean) return null;

  // 1. Cek Kredensial Administrator
  if (
    idClean.toLowerCase() === "admin" &&
    (passClean === "admin123" || passClean === "admin")
  ) {
    return {
      id: "admin",
      code: "ADMIN",
      nim: "ADMIN",
      username: "admin",
      fullname: "Administrator Kelas",
      email: "admin@kelas.ac.id",
      role: "admin",
      status: "Aktif",
    };
  }

  // 2. Cek Kredensial Mahasiswa dari data lokal / CLASS_MEMBERS
  let customMembers = CLASS_MEMBERS;
  try {
    const saved = localStorage.getItem("si_database_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.members) {
        customMembers = { ...CLASS_MEMBERS, ...parsed.members };
      }
    }
  } catch {
    /* ignore error */
  }

  const member = getMemberByNim(idClean, customMembers);
  if (member) {
    // Kriteria kecocokan password mahasiswa yang fleksibel:
    // a. Sama dengan NIM (case-insensitive, contoh: 25SI025 atau 25si025)
    // b. Sama dengan 3 digit kode (contoh: 025)
    // c. Password default 'si2025' atau cocok dengan input identifier
    const normalizedInputNIM = idClean.toUpperCase();
    const studentNIM = member.nim.toUpperCase();

    const isMatch =
      passClean.toUpperCase() === studentNIM ||
      passClean === member.code ||
      passClean.toLowerCase() === "si2025" ||
      passClean.toLowerCase() === idClean.toLowerCase();

    if (isMatch) {
      return {
        id: member.code,
        code: member.code,
        nim: member.nim,
        username: member.nim,
        fullname: member.fullname,
        gender: member.gender || "L",
        photo: member.photo || member.avatar || null,
        role: "student",
        status: "Aktif",
        kelas: member.kelas || "SI-A (Reguler Pagi)",
      };
    }
  }

  return null;
}

// ─── 5. Auth API (Login Administrator & Member Mahasiswa) ─────────────────────
export async function loginUser(credentials) {
  // Jika di Vercel (HTTPS) dan belum ada backend HTTPS publik, langsung gunakan auth mandiri
  if (isStandaloneMode) {
    const user = authenticateOffline(credentials);
    if (user) {
      return {
        message: "Berhasil masuk ke akun",
        token: "si_token_standalone_" + Date.now(),
        user,
      };
    }
    throw new Error(
      "NIM / Username atau Password tidak sesuai. Mahasiswa: gunakan NIM Anda (contoh: 25SI025) dan password sama dengan NIM."
    );
  }

  // Coba kirim ke server backend
  try {
    const response = await axiosInstance.post("/auth/login", credentials);
    return response.data; // { message, token, user }
  } catch (err) {
    const isNetworkError =
      !err.response ||
      err.message === "Network Error" ||
      err.code === "ERR_NETWORK" ||
      err.code === "ECONNABORTED";

    // Jika terjadi Network Error (server backend offline / tidak aktif), aktifkan fallback mandiri
    if (isNetworkError) {
      console.warn(
        "[Auth] Server backend tidak terhubung. Mengalihkan ke mode autentikasi mandiri."
      );
      const fallbackUser = authenticateOffline(credentials);
      if (fallbackUser) {
        return {
          message: "Berhasil masuk (Mode Offline)",
          token: "si_token_offline_" + Date.now(),
          user: fallbackUser,
        };
      }
      throw new Error(
        "Kredensial tidak cocok. Mahasiswa: gunakan NIM (contoh: 25SI025) dan password sama dengan NIM."
      );
    }

    // Jika error dari backend (misal password salah)
    const backendMessage =
      err.response?.data?.message || err.message || "Gagal masuk ke akun.";
    throw new Error(backendMessage);
  }
}

// ─── 6. Object Helper CRUD untuk App.jsx ──────────────────────────────────────
const dummySuccess = (data) => Promise.resolve({ data: { success: true, ...data } });

export const api = {
  courses: {
    add: (item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.post("/courses", item),
    update: (id, item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.put(`/courses/${id}`, item),
    delete: (id) => isStandaloneMode ? dummySuccess({ id }) : axiosInstance.delete(`/courses/${id}`),
  },
  materials: {
    add: (item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.post("/materials", item),
    update: (id, item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.put(`/materials/${id}`, item),
    delete: (id) => isStandaloneMode ? dummySuccess({ id }) : axiosInstance.delete(`/materials/${id}`),
  },
  assignments: {
    add: (item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.post("/assignments", item),
    update: (id, item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.put(`/assignments/${id}`, item),
    delete: (id) => isStandaloneMode ? dummySuccess({ id }) : axiosInstance.delete(`/assignments/${id}`),
  },
  announcements: {
    add: (item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.post("/announcements", item),
    update: (id, item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.put(`/announcements/${id}`, item),
    delete: (id) => isStandaloneMode ? dummySuccess({ id }) : axiosInstance.delete(`/announcements/${id}`),
  },
  photos: {
    add: (item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.post("/photos", item),
    update: (id, item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.put(`/photos/${id}`, item),
    delete: (id) => isStandaloneMode ? dummySuccess({ id }) : axiosInstance.delete(`/photos/${id}`),
    setHero: (id) => isStandaloneMode ? dummySuccess({ id }) : axiosInstance.patch(`/photos/${id}/hero`),
  },
  members: {
    add: (code, item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.post("/members", { code, ...item }),
    update: (oldCode, newCode, item) =>
      isStandaloneMode ? dummySuccess(item) : axiosInstance.put(`/members/${oldCode}`, { newCode, ...item }),
    delete: (code) => isStandaloneMode ? dummySuccess({ code }) : axiosInstance.delete(`/members/${code}`),
  },
  submissions: {
    add: (item) => isStandaloneMode ? dummySuccess(item) : axiosInstance.post("/submissions", item),
  },
};
