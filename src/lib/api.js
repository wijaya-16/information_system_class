// src/lib/api.js
// Client API untuk menghubungkan React Frontend ke Backend PostgreSQL
// Mendukung localhost (development) dan URL Cloud/Vercel (production)

const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper untuk URL berkas/gambar upload
export function getFileUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    return `${API_BASE}${path}`;
}

// Helper request umum
async function request(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, config);
    if (!res.ok) {
        let errMessage = `HTTP error ${res.status}`;
        try {
            const errData = await res.json();
            errMessage = errData.error || errData.message || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
    }
    return res.json();
}

// ─── 1. Health Check & Cek Koneksi PostgreSQL ─────────────────────────────────
export async function checkServerHealth() {
    try {
        const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
        if (res.ok) {
            return await res.json();
        }
        return { status: 'error', database: 'disconnected' };
    } catch (err) {
        return { status: 'offline', database: 'disconnected', error: err.message };
    }
}

// ─── 2. Fetch Seluruh Data (Data Awal / Sinkronisasi) ──────────────────────────
export async function fetchAllData() {
    return request('/api/data');
}

// ─── 3. Upload Berkas / Gambar / Dokumen ke Server PostgreSQL ─────────────────
export async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        throw new Error(`Upload gagal dengan status ${res.status}`);
    }
    return res.json(); // { success: true, url: '/uploads/...' }
}

// ─── 4. Layanan CRUD per Modul ────────────────────────────────────────────────
export const api = {
    courses: {
        add:    (data)     => request('/api/courses', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id)       => request(`/api/courses/${id}`, { method: 'DELETE' }),
    },
    materials: {
        add:    (data)     => request('/api/materials', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/api/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id)       => request(`/api/materials/${id}`, { method: 'DELETE' }),
    },
    assignments: {
        add:    (data)     => request('/api/assignments', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/api/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id)       => request(`/api/assignments/${id}`, { method: 'DELETE' }),
    },
    announcements: {
        add:    (data)     => request('/api/announcements', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/api/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id)       => request(`/api/announcements/${id}`, { method: 'DELETE' }),
    },
    photos: {
        add:     (data)     => request('/api/photos', { method: 'POST', body: JSON.stringify(data) }),
        update:  (id, data) => request(`/api/photos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        setHero: (id)       => request(`/api/photos/${id}/hero`, { method: 'PATCH' }),
        delete:  (id)       => request(`/api/photos/${id}`, { method: 'DELETE' }),
    },
    members: {
        add:    (code, data)           => request('/api/members', { method: 'POST', body: JSON.stringify({ code, ...data }) }),
        update: (oldCode, newCode, data) => request(`/api/members/${oldCode}`, { method: 'PUT', body: JSON.stringify({ code: newCode, ...data }) }),
        delete: (code)                 => request(`/api/members/${code}`, { method: 'DELETE' }),
    },
    submissions: {
        add: (data) => request('/api/submissions', { method: 'POST', body: JSON.stringify(data) }),
    },
};

