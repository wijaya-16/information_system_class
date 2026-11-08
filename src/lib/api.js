import axios from "axios";

// 1. Base URL & Axios Instance Utama
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Otomatis sisipkan Token JWT di setiap request jika pengguna sudah login
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("si_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Helper URL File/Gambar (Mencegah Error Navbar.jsx)
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

// 3. Helper Upload File (Mencegah Error MaterialsPage.jsx)
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data; // Mengembalikan { file_url: '/uploads/filename...' }
}

// 4. Health Check & Fetch All Data
export async function checkServerHealth() {
  try {
    const res = await axiosInstance.get("/courses");
    return { status: "ok", data: res.data };
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

export async function fetchAllData() {
  try {
    const [coursesRes, materialsRes, assignmentsRes, submissionsRes] =
      await Promise.allSettled([
        axiosInstance.get("/courses"),
        axiosInstance.get("/materials"),
        axiosInstance.get("/assignments"),
        axiosInstance.get("/submissions"),
      ]);

    return {
      courses: coursesRes.status === "fulfilled" ? coursesRes.data : [],
      materials: materialsRes.status === "fulfilled" ? materialsRes.data : [],
      assignments:
        assignmentsRes.status === "fulfilled" ? assignmentsRes.data : [],
      submissions:
        submissionsRes.status === "fulfilled" ? submissionsRes.data : [],
    };
  } catch (error) {
    console.error("Gagal mengambil data dari server:", error);
    return null;
  }
}

// 5. Auth API
export async function loginUser(credentials) {
  const response = await axiosInstance.post("/auth/login", credentials);
  return response.data;
}

// 6. Object Helper CRUD untuk App.jsx
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
