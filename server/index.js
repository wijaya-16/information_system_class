// server/index.js
// Express API Server yang menghubungkan React ke PostgreSQL
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool, query, initDatabase } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Pastikan folder uploads tersedia
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Layanan File Statis (Uploads: Gambar, PDF, Dokumen)
app.use('/uploads', express.static(uploadsDir));

// Konfigurasi Multer untuk upload berkas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${base}-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // Maksimal 25MB per file
});

// ─── 1. Endpoint Upload Berkas (Gambar / Dokumen / PDF) ────────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada berkas yang diunggah' });
        }
        // Buat URL yang bisa diakses publik
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            url: fileUrl,
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
        });
    } catch (err) {
        console.error('[Upload] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── Visual Database Viewer (Bisa dibuka di Browser untuk cek data tanpa psql) ───
app.get('/db-view', async (req, res) => {
    try {
        const [courses, materials, assignments, announcements, photos, members, submissions] = await Promise.all([
            query('SELECT * FROM courses ORDER BY id ASC').catch(() => ({ rows: [] })),
            query('SELECT * FROM materials ORDER BY id DESC').catch(() => ({ rows: [] })),
            query('SELECT * FROM assignments ORDER BY id DESC').catch(() => ({ rows: [] })),
            query('SELECT * FROM announcements ORDER BY id DESC').catch(() => ({ rows: [] })),
            query('SELECT * FROM class_photos ORDER BY id DESC').catch(() => ({ rows: [] })),
            query('SELECT * FROM members ORDER BY code ASC').catch(() => ({ rows: [] })),
            query('SELECT * FROM submissions ORDER BY id DESC').catch(() => ({ rows: [] })),
        ]);

        const renderTable = (title, rows) => {
            if (!rows.length) return `<div style="color:#64748b;font-size:13px;padding:12px;background:#f8fafc;border-radius:8px;">Belum ada data ${title}</div>`;
            const keys = Object.keys(rows[0]);
            return `
                <div style="overflow-x:auto;margin-bottom:24px;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <thead>
                            <tr style="background:#0f172a;color:white;text-align:left;">
                                ${keys.map(k => `<th style="padding:10px 12px;border:1px solid #1e293b;">${k}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(r => `
                                <tr style="border-bottom:1px solid #e2e8f0;">
                                    ${keys.map(k => `<td style="padding:8px 12px;border:1px solid #e2e8f0;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${typeof r[k] === 'object' ? JSON.stringify(r[k]) : (r[k] !== null ? r[k] : '<em style="color:#94a3b8">null</em>')}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        };

        res.send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>PostgreSQL Database Viewer - Kelas SI</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#f1f5f9; padding:24px; color:#1e293b; }
                    .card { background:white; padding:20px; border-radius:12px; border:1px solid #cbd5e1; margin-bottom:20px; box-shadow:0 2px 4px rgba(0,0,0,0.02); }
                    .badge { display:inline-block; padding:4px 10px; border-radius:9999px; font-weight:bold; font-size:12px; background:#10b981; color:white; }
                    .stat { display:flex; gap:16px; margin-top:12px; flex-wrap:wrap; }
                    .stat-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 18px; min-width:120px; }
                    .stat-box h4 { margin:0; color:#64748b; font-size:11px; text-transform:uppercase; }
                    .stat-box p { margin:4px 0 0; font-size:20px; font-weight:bold; color:#0f172a; }
                    h2 { margin-top:0; font-size:18px; color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:8px; }
                </style>
            </head>
            <body>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div>
                        <h1 style="margin:0; font-size:24px; color:#0f172a;">📊 PostgreSQL Database Viewer</h1>
                        <p style="margin:4px 0 0; color:#64748b; font-size:13px;">Aplikasi Portal Akademik Kelas Sistem Informasi</p>
                    </div>
                    <span class="badge">● DATABASE TERHUBUNG</span>
                </div>

                <div class="card">
                    <h3 style="margin:0 0 8px 0; font-size:14px; color:#475569;">Ringkasan Data Tersimpan:</h3>
                    <div class="stat">
                        <div class="stat-box"><h4>Mata Kuliah</h4><p>${courses.rows.length}</p></div>
                        <div class="stat-box"><h4>Materi</h4><p>${materials.rows.length}</p></div>
                        <div class="stat-box"><h4>Tugas</h4><p>${assignments.rows.length}</p></div>
                        <div class="stat-box"><h4>Pengumuman</h4><p>${announcements.rows.length}</p></div>
                        <div class="stat-box"><h4>Mahasiswa</h4><p>${members.rows.length}</p></div>
                        <div class="stat-box"><h4>Pengumpulan</h4><p>${submissions.rows.length}</p></div>
                        <div class="stat-box"><h4>Foto Galeri</h4><p>${photos.rows.length}</p></div>
                    </div>
                </div>

                <div class="card">
                    <h2>📚 1. Mata Kuliah (courses)</h2>
                    ${renderTable('Mata Kuliah', courses.rows)}

                    <h2>📖 2. Materi Kuliah (materials)</h2>
                    ${renderTable('Materi', materials.rows)}

                    <h2>📝 3. Tugas Kuliah (assignments)</h2>
                    ${renderTable('Tugas', assignments.rows)}

                    <h2>📢 4. Pengumuman (announcements)</h2>
                    ${renderTable('Pengumuman', announcements.rows)}

                    <h2>👥 5. Mahasiswa / Members (members)</h2>
                    ${renderTable('Mahasiswa', members.rows)}

                    <h2>📥 6. Pengumpulan Tugas (submissions)</h2>
                    ${renderTable('Pengumpulan Tugas', submissions.rows)}

                    <h2>🖼️ 7. Galeri Foto Kelas (class_photos)</h2>
                    ${renderTable('Foto Kelas', photos.rows)}
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send(`<h1>Error Database</h1><pre>${err.message}</pre>`);
    }
});

// ─── 2. Endpoint Health Check ─────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
    try {
        const dbCheck = await query('SELECT NOW()');
        res.json({
            status: 'ok',
            database: 'connected',
            serverTime: dbCheck.rows[0].now,
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            message: err.message,
        });
    }
});

// ─── 3. Endpoint Get All Data (Bundle untuk Load Cepat Frontend) ───────────────
app.get('/api/data', async (req, res) => {
    try {
        const [
            courses,
            materials,
            assignments,
            announcements,
            events,
            photos,
            members,
            submissions,
        ] = await Promise.all([
            query('SELECT * FROM courses ORDER BY id ASC'),
            query('SELECT * FROM materials ORDER BY id DESC'),
            query('SELECT * FROM assignments ORDER BY id DESC'),
            query('SELECT * FROM announcements ORDER BY id DESC'),
            query('SELECT * FROM events ORDER BY id ASC'),
            query('SELECT * FROM class_photos ORDER BY is_hero DESC, id DESC'),
            query('SELECT * FROM members ORDER BY code ASC'),
            query('SELECT * FROM submissions ORDER BY id DESC'),
        ]);

        // Transform members array to { code: memberData } map
        const membersMap = {};
        members.rows.forEach(m => {
            membersMap[m.code] = {
                fullname: m.fullname,
                gender:   m.gender,
                photo:    m.photo || null,
            };
        });

        // Normalize photos field name (is_hero -> isHero)
        const normalizedPhotos = photos.rows.map(p => ({
            id:       Number(p.id),
            url:      p.url,
            title:    p.title,
            caption:  p.caption,
            date:     p.date,
            isHero:   p.is_hero,
            category: p.category,
        }));

        // Normalize submissions field names
        const normalizedSubmissions = submissions.rows.map(s => ({
            id:           Number(s.id),
            assignmentId: Number(s.assignment_id),
            nim:          s.nim,
            studentName:  s.student_name,
            note:         s.note,
            link:         s.link,
            fileUrl:      s.file_url,
            submittedAt:  s.submitted_at,
        }));

        res.json({
            courses:       courses.rows.map(c => ({ ...c, id: Number(c.id) })),
            materials:     materials.rows.map(m => ({ ...m, id: Number(m.id) })),
            assignments:   assignments.rows.map(a => ({ ...a, id: Number(a.id) })),
            announcements: announcements.rows.map(an => ({ ...an, id: Number(an.id) })),
            events:        events.rows,
            classPhotos:   normalizedPhotos,
            members:       membersMap,
            submissions:   normalizedSubmissions,
        });
    } catch (err) {
        console.error('[API /api/data] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── 4. CRUD Mata Kuliah ──────────────────────────────────────────────────────
app.post('/api/courses', async (req, res) => {
    try {
        const { id, name, lecturer, credits, category, color } = req.body;
        const newId = id || Date.now();
        const result = await query(
            `INSERT INTO courses (id, name, lecturer, credits, category, color)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [newId, name, lecturer, credits || 3, category, color]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, lecturer, credits, category, color } = req.body;

        // Ambil nama lama jika ada perubahan nama (untuk sinkronisasi relasi)
        const old = await query('SELECT name FROM courses WHERE id = $1', [id]);
        const oldName = old.rows[0]?.name;

        const result = await query(
            `UPDATE courses
             SET name = $1, lecturer = $2, credits = $3, category = $4, color = $5
             WHERE id = $6 RETURNING *`,
            [name, lecturer, credits, category, color, id]
        );

        if (oldName && oldName !== name) {
            await Promise.all([
                query('UPDATE materials SET course = $1 WHERE course = $2', [name, oldName]),
                query('UPDATE assignments SET course = $1 WHERE course = $2', [name, oldName]),
                query('UPDATE announcements SET course = $1 WHERE course = $2', [name, oldName]),
            ]);
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const old = await query('SELECT name FROM courses WHERE id = $1', [id]);
        const courseName = old.rows[0]?.name;

        await query('DELETE FROM courses WHERE id = $1', [id]);

        if (courseName) {
            await Promise.all([
                query('DELETE FROM materials WHERE course = $1', [courseName]),
                query('DELETE FROM assignments WHERE course = $1', [courseName]),
                query('DELETE FROM announcements WHERE course = $1', [courseName]),
            ]);
        }

        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 5. CRUD Materi Kuliah ───────────────────────────────────────────────────
app.post('/api/materials', async (req, res) => {
    try {
        const { id, title, course, type, size, date, semester, lecturer, description, file_url } = req.body;
        const newId = id || Date.now();
        const result = await query(
            `INSERT INTO materials (id, title, course, type, size, date, semester, lecturer, description, file_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [newId, title, course, type || 'PDF', size || '2.5MB', date, semester || 'Semester 3', lecturer, description, file_url || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, course, type, size, date, semester, lecturer, description, file_url } = req.body;
        const result = await query(
            `UPDATE materials
             SET title = $1, course = $2, type = $3, size = $4, date = $5, semester = $6, lecturer = $7, description = $8, file_url = COALESCE($9, file_url)
             WHERE id = $10 RETURNING *`,
            [title, course, type, size, date, semester, lecturer, description, file_url || null, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM materials WHERE id = $1', [id]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 6. CRUD Tugas ────────────────────────────────────────────────────────────
app.post('/api/assignments', async (req, res) => {
    try {
        const { id, title, course, description, lecturer, deadline, status } = req.body;
        const newId = id || Date.now();
        const result = await query(
            `INSERT INTO assignments (id, title, course, description, lecturer, deadline, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [newId, title, course, description, lecturer, deadline, status || 'Aktif']
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/assignments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, course, description, lecturer, deadline, status } = req.body;
        const result = await query(
            `UPDATE assignments
             SET title = $1, course = $2, description = $3, lecturer = $4, deadline = $5, status = $6
             WHERE id = $7 RETURNING *`,
            [title, course, description, lecturer, deadline, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/assignments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM assignments WHERE id = $1', [id]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 7. CRUD Pengumuman ───────────────────────────────────────────────────────
app.post('/api/announcements', async (req, res) => {
    try {
        const { id, title, category, course, date, author, important, content } = req.body;
        const newId = id || Date.now();
        const result = await query(
            `INSERT INTO announcements (id, title, category, course, date, author, important, content)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [newId, title, category || 'Akademik', course, date, author, !!important, content]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/announcements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, course, date, author, important, content } = req.body;
        const result = await query(
            `UPDATE announcements
             SET title = $1, category = $2, course = $3, date = $4, author = $5, important = $6, content = $7
             WHERE id = $8 RETURNING *`,
            [title, category, course, date, author, !!important, content, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/announcements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM announcements WHERE id = $1', [id]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 8. CRUD Galeri Foto Kelas ────────────────────────────────────────────────
app.post('/api/photos', async (req, res) => {
    try {
        const { id, url, title, caption, date, isHero, category } = req.body;
        const newId = id || Date.now();

        if (isHero) {
            await query('UPDATE class_photos SET is_hero = FALSE WHERE is_hero = TRUE');
        }

        const result = await query(
            `INSERT INTO class_photos (id, url, title, caption, date, is_hero, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [newId, url, title, caption, date, !!isHero, category || 'Praktikum & Perkuliahan']
        );

        const row = result.rows[0];
        res.json({ ...row, id: Number(row.id), isHero: row.is_hero });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/photos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { url, title, caption, date, isHero, category } = req.body;

        if (isHero) {
            await query('UPDATE class_photos SET is_hero = FALSE WHERE id != $1', [id]);
        }

        const result = await query(
            `UPDATE class_photos
             SET url = $1, title = $2, caption = $3, date = $4, is_hero = $5, category = $6
             WHERE id = $7 RETURNING *`,
            [url, title, caption, date, !!isHero, category, id]
        );

        const row = result.rows[0];
        res.json({ ...row, id: Number(row.id), isHero: row.is_hero });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/photos/:id/hero', async (req, res) => {
    try {
        const { id } = req.params;
        await query('UPDATE class_photos SET is_hero = FALSE');
        const result = await query(
            'UPDATE class_photos SET is_hero = TRUE WHERE id = $1 RETURNING *',
            [id]
        );
        const row = result.rows[0];
        res.json({ ...row, id: Number(row.id), isHero: row.is_hero });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/photos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM class_photos WHERE id = $1', [id]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 9. CRUD Mahasiswa (Members) ──────────────────────────────────────────────
app.post('/api/members', async (req, res) => {
    try {
        const { code, fullname, gender, photo } = req.body;
        const result = await query(
            `INSERT INTO members (code, fullname, gender, photo)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [code, fullname, gender || 'L', photo || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/members/:code', async (req, res) => {
    try {
        const { code: oldCode } = req.params;
        const { code: newCode, fullname, gender, photo } = req.body;

        const targetCode = newCode || oldCode;

        if (oldCode !== targetCode) {
            await query('DELETE FROM members WHERE code = $1', [oldCode]);
        }

        const result = await query(
            `INSERT INTO members (code, fullname, gender, photo)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (code) DO UPDATE
             SET fullname = EXCLUDED.fullname, gender = EXCLUDED.gender, photo = EXCLUDED.photo
             RETURNING *`,
            [targetCode, fullname, gender || 'L', photo || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/members/:code', async (req, res) => {
    try {
        const { code } = req.params;
        await query('DELETE FROM members WHERE code = $1', [code]);
        res.json({ success: true, code });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 10. Pengumpulan Tugas (Submissions) ───────────────────────────────────────
app.post('/api/submissions', async (req, res) => {
    try {
        const { assignmentId, nim, studentName, note, link, fileUrl } = req.body;
        const newId = Date.now();
        const submittedAt = new Date().toISOString().split('T')[0];

        // Hapus submission mahasiswa sebelumnya jika ada
        await query(
            'DELETE FROM submissions WHERE assignment_id = $1 AND nim = $2',
            [assignmentId, nim]
        );

        const result = await query(
            `INSERT INTO submissions (id, assignment_id, nim, student_name, note, link, file_url, submitted_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [newId, assignmentId, nim, studentName, note, link, fileUrl || null, submittedAt]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Jalankan Server & Inisialisasi PostgreSQL ─────────────────────────────────
async function startServer() {
    try {
        await initDatabase();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`[Server] 🚀 Server Backend PostgreSQL berjalan pada http://localhost:${PORT}`);
            console.log(`[Server] 📁 Folder upload tersedia pada http://localhost:${PORT}/uploads`);
            console.log(`[Server] 🌐 Siap diakses dari device lain di jaringan lokal!`);
        });
    } catch (err) {
        console.error('[Server] ⚠️ Gagal menginisialisasi database PostgreSQL saat startup:', err.message);
        console.log('[Server] ℹ️ Tetap menjalankan server Express...');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`[Server] 🚀 Server Backend berjalan pada port ${PORT} (menunggu koneksi DB stabil)`);
        });
    }
}

startServer();

