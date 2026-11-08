import axiosInstance from "./axios";

// ─── HELPER FILE URL & UPLOAD ─────────────────────────────────────────────────
export function getFileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `http://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function uploadFile(file) {
  if (!file) return null;
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.file_url;
}

// ─── HEALTH CHECK & BULK DATA FETCH ──────────────────────────────────────────
export async function checkServerHealth() {
  try {
    await axiosInstance.get("/courses");
    return { status: "ok" };
  } catch {
    return { status: "error" };
  }
}

export async function fetchAllData() {
  try {
    const [coursesRes, materialsRes, assignmentsRes] = await Promise.allSettled(
      [
        axiosInstance.get("/courses"),
        axiosInstance.get("/materials"),
        axiosInstance.get("/assignments"),
      ],
    );

    return {
      courses: coursesRes.status === "fulfilled" ? coursesRes.data : [],
      materials: materialsRes.status === "fulfilled" ? materialsRes.data : [],
      assignments:
        assignmentsRes.status === "fulfilled" ? assignmentsRes.data : [],
    };
  } catch (error) {
    console.error("Gagal mengambil data dari server:", error);
    return null;
  }
}

// ─── STANDALONE API FUNCTIONS ────────────────────────────────────────────────
export async function getCourses() {
  const response = await axiosInstance.get("/courses");
  return response.data;
}

export async function getCourseById(id) {
  const response = await axiosInstance.get(`/courses/${id}`);
  return response.data;
}

export async function getMaterials(courseId) {
  const response = await axiosInstance.get("/materials", {
    params: { course_id: courseId },
  });
  return response.data;
}

export async function getAssignments(courseId) {
  const response = await axiosInstance.get("/assignments", {
    params: { course_id: courseId },
  });
  return response.data;
}

// ─── OBJECT API UNTUK HANDLER APP.JSX ─────────────────────────────────────────
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
    add: (item) => axiosInstance.post("/gallery", item),
    update: (id, item) => axiosInstance.put(`/gallery/${id}`, item),
    delete: (id) => axiosInstance.delete(`/gallery/${id}`),
    setHero: (id) => axiosInstance.patch(`/gallery/${id}/hero`),
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
