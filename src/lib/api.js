import axios from "axios";

// Base URL API Backend Express + MySQL
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000,
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
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data; // { file_url: '/uploads/filename.ext' }
}

// ─── 3. Health Check & Fetch All Data ─────────────────────────────────────────
export async function checkServerHealth() {
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

// ─── 4. Auth API (Login Administrator & Member Mahasiswa) ─────────────────────
export async function loginUser(credentials) {
  const response = await axiosInstance.post("/auth/login", credentials);
  return response.data; // { message, token, user }
}

// ─── 5. Object Helper CRUD untuk App.jsx ──────────────────────────────────────
export const api = {
  courses: {
    add: (item) => axiosInstance.post("/courses", item),
    update: (id, item) => axiosInstance.put(`/courses/${id}`, item),
    delete: (id) => axiosInstance.delete(`/courses/${id}`),
  },
  materials: {
    add: (item) => axiosInstance.post("/materials", item),
    update: (id, item) => axiosInstance.put(`/materials/${id}`, item),
    delete: (id) => axiosInstance.delete(`/materials/${id}`),
  },
  assignments: {
    add: (item) => axiosInstance.post("/assignments", item),
    update: (id, item) => axiosInstance.put(`/assignments/${id}`, item),
    delete: (id) => axiosInstance.delete(`/assignments/${id}`),
  },
  announcements: {
    add: (item) => axiosInstance.post("/announcements", item),
    update: (id, item) => axiosInstance.put(`/announcements/${id}`, item),
    delete: (id) => axiosInstance.delete(`/announcements/${id}`),
  },
  photos: {
    add: (item) => axiosInstance.post("/photos", item),
    update: (id, item) => axiosInstance.put(`/photos/${id}`, item),
    delete: (id) => axiosInstance.delete(`/photos/${id}`),
    setHero: (id) => axiosInstance.patch(`/photos/${id}/hero`),
  },
  members: {
    add: (code, item) => axiosInstance.post("/members", { code, ...item }),
    update: (oldCode, newCode, item) =>
      axiosInstance.put(`/members/${oldCode}`, { newCode, ...item }),
    delete: (code) => axiosInstance.delete(`/members/${code}`),
  },
  submissions: {
    add: (item) => axiosInstance.post("/submissions", item),
  },
};
