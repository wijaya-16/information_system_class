// server/db.js
// Koneksi dan manajemen skema PostgreSQL
import pg from 'pg';
import dotenv from 'dotenv';
import {
    INITIAL_COURSES,
    INITIAL_MATERIALS,
    INITIAL_ASSIGNMENTS,
    INITIAL_ANNOUNCEMENTS,
    INITIAL_EVENTS,
    INITIAL_PHOTOS,
    INITIAL_MEMBERS,
    INITIAL_SUBMISSIONS,
} from './initialData.js';

dotenv.config();

const { Pool } = pg;

// Konfigurasi Pool PostgreSQL
// Mendukung DATABASE_URL (Cloud PostgreSQL / Local) maupun variabel terpisah
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
    ? {
          connectionString,
          ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
              ? false
              : { rejectUnauthorized: false },
      }
    : {
          host:     process.env.PGHOST     || 'localhost',
          port:     parseInt(process.env.PGPORT || '5432', 10),
          user:     process.env.PGUSER     || 'postgres',
          password: process.env.PGPASSWORD || 'postgres',
          database: process.env.PGDATABASE || 'kelas_si',
          ssl:      process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
      };

export const pool = new Pool(poolConfig);

// Helper query
export const query = (text, params) => pool.query(text, params);

// Pastikan database target sudah dibuat (membuat otomatis jika belum ada)
async function ensureDatabaseExists() {
    if (connectionString) return;
    const targetDb = process.env.PGDATABASE || 'kelas_si';
    const rootPool = new Pool({
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: 'postgres',
    });
    try {
        const check = await rootPool.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDb]);
        if (check.rows.length === 0) {
            console.log(`[PostgreSQL] 📦 Database '${targetDb}' belum ada, membuat otomatis...`);
            await rootPool.query(`CREATE DATABASE "${targetDb}"`);
            console.log(`[PostgreSQL] ✅ Database '${targetDb}' berhasil dibuat!`);
        }
    } catch (e) {
        // Abaikan jika tidak bisa akses db postgres default
    } finally {
        await rootPool.end().catch(() => {});
    }
}

// Inisialisasi Tabel dan Seed Data Awal
export async function initDatabase() {
    try {
        await ensureDatabaseExists();
        console.log('[PostgreSQL] 🔄 Memeriksa koneksi database...');
        const res = await pool.query('SELECT NOW()');
        console.log('[PostgreSQL] ✅ Berhasil terhubung ke database pada:', res.rows[0].now);

        // 1. Buat Tabel Courses (Mata Kuliah)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id BIGINT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                lecturer VARCHAR(255),
                credits INT DEFAULT 3,
                category VARCHAR(100),
                color VARCHAR(100)
            );
        `);

        // 2. Buat Tabel Materials (Materi Kuliah)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS materials (
                id BIGINT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                course VARCHAR(255) NOT NULL,
                type VARCHAR(50) DEFAULT 'PDF',
                size VARCHAR(50) DEFAULT '2.5MB',
                date VARCHAR(50),
                semester VARCHAR(50) DEFAULT 'Semester 3',
                lecturer VARCHAR(255),
                description TEXT,
                file_url TEXT
            );
        `);

        // 3. Buat Tabel Assignments (Tugas)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id BIGINT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                course VARCHAR(255) NOT NULL,
                description TEXT,
                lecturer VARCHAR(255),
                deadline VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Aktif'
            );
        `);

        // 4. Buat Tabel Announcements (Pengumuman)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id BIGINT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) DEFAULT 'Akademik',
                course VARCHAR(255),
                date VARCHAR(50),
                author VARCHAR(255),
                important BOOLEAN DEFAULT FALSE,
                content TEXT
            );
        `);

        // 5. Buat Tabel Events (Agenda)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                date VARCHAR(50),
                title VARCHAR(255) NOT NULL,
                time VARCHAR(100),
                location VARCHAR(255)
            );
        `);

        // 6. Buat Tabel Class Photos (Galeri / Foto)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS class_photos (
                id BIGINT PRIMARY KEY,
                url TEXT NOT NULL,
                title VARCHAR(255) NOT NULL,
                caption TEXT,
                date VARCHAR(50),
                is_hero BOOLEAN DEFAULT FALSE,
                category VARCHAR(100)
            );
        `);

        // 7. Buat Tabel Members (Mahasiswa)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS members (
                code VARCHAR(10) PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL,
                gender VARCHAR(5) DEFAULT 'L',
                photo TEXT
            );
        `);

        // 8. Buat Tabel Submissions (Pengumpulan Tugas)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS submissions (
                id BIGINT PRIMARY KEY,
                assignment_id BIGINT,
                nim VARCHAR(50),
                student_name VARCHAR(255),
                note TEXT,
                link TEXT,
                file_url TEXT,
                submitted_at VARCHAR(50)
            );
        `);

        console.log('[PostgreSQL] 📋 Seluruh tabel berhasil diverifikasi/dibuat.');

        // Seed data awal jika tabel masih kosong
        await seedIfEmpty();

    } catch (err) {
        console.error('[PostgreSQL] ❌ Gagal inisialisasi database:', err.message);
        console.error('[PostgreSQL] 💡 Pastikan PostgreSQL berjalan dan database sudah dibuat.');
        console.error('[PostgreSQL] 💡 Detail: Cek konfigurasi di server/.env atau DATABASE_URL.');
        throw err;
    }
}

// Auto-seed data awal jika tabel kosong
async function seedIfEmpty() {
    // 1. Seed Courses
    const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
    if (parseInt(coursesCount.rows[0].count, 10) === 0) {
        console.log('[PostgreSQL] 🌱 Melakukan seed data awal Mata Kuliah...');
        for (const c of INITIAL_COURSES) {
            await pool.query(
                `INSERT INTO courses (id, name, lecturer, credits, category, color)
                 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
                [c.id, c.name, c.lecturer, c.credits, c.category, c.color]
            );
        }
    }

    // 2. Seed Materials
    const materialsCount = await pool.query('SELECT COUNT(*) FROM materials');
    if (parseInt(materialsCount.rows[0].count, 10) === 0) {
        console.log('[PostgreSQL] 🌱 Melakukan seed data awal Materi Kuliah...');
        for (const m of INITIAL_MATERIALS) {
            await pool.query(
                `INSERT INTO materials (id, title, course, type, size, date, semester, lecturer, description, file_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
                [m.id, m.title, m.course, m.type, m.size, m.date, m.semester, m.lecturer, m.description, null]
            );
        }
    }

    // 3. Seed Assignments
    const assignmentsCount = await pool.query('SELECT COUNT(*) FROM assignments');
    if (parseInt(assignmentsCount.rows[0].count, 10) === 0) {
        console.log('[PostgreSQL] 🌱 Melakukan seed data awal Tugas...');
        for (const a of INITIAL_ASSIGNMENTS) {
            await pool.query(
                `INSERT INTO assignments (id, title, course, description, lecturer, deadline, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
                [a.id, a.title, a.course, a.description, a.lecturer, a.deadline, a.status]
            );
        }
    }

    // 4. Seed Announcements
    const announcementsCount = await pool.query('SELECT COUNT(*) FROM announcements');
    if (parseInt(announcementsCount.rows[0].count, 10) === 0) {
        console.log('[PostgreSQL] 🌱 Melakukan seed data awal Pengumuman...');
        for (const an of INITIAL_ANNOUNCEMENTS) {
            await pool.query(
                `INSERT INTO announcements (id, title, category, course, date, author, important, content)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
                [an.id, an.title, an.category, an.course, an.date, an.author, an.important, an.content]
            );
        }
    }

    // 5. Seed Events
    const eventsCount = await pool.query('SELECT COUNT(*) FROM events');
    if (parseInt(eventsCount.rows[0].count, 10) === 0) {
        console.log('[PostgreSQL] 🌱 Melakukan seed data awal Agenda...');
        for (const ev of INITIAL_EVENTS) {
            await pool.query(
                `INSERT INTO events (date, title, time, location) VALUES ($1, $2, $3, $4)`,
                [ev.date, ev.title, ev.time, ev.location]
            );
        }
    }

    // 6. Seed Photos
    const photosCount = await pool.query('SELECT COUNT(*) FROM class_photos');
    if (parseInt(photosCount.rows[0].count, 10) === 0) {
        console.log('[PostgreSQL] 🌱 Melakukan seed data awal Galeri...');
        for (const p of INITIAL_PHOTOS) {
            await pool.query(
                `INSERT INTO class_photos (id, url, title, caption, date, is_hero, category)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
                [p.id, p.url, p.title, p.caption, p.date, p.is_hero, p.category]
            );
        }
    }

    // 7. Seed Members
    const membersCount = await pool.query('SELECT COUNT(*) FROM members');
    if (parseInt(membersCount.rows[0].count, 10) === 0) {
        console.log('[PostgreSQL] 🌱 Melakukan seed data awal Mahasiswa...');
        for (const mem of INITIAL_MEMBERS) {
            await pool.query(
                `INSERT INTO members (code, fullname, gender, photo)
                 VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING`,
                [mem.code, mem.fullname, mem.gender, null]
            );
        }
    }

    // 8. Seed Submissions
    const submissionsCount = await pool.query('SELECT COUNT(*) FROM submissions');
    if (parseInt(submissionsCount.rows[0].count, 10) === 0) {
        console.log('[PostgreSQL] 🌱 Melakukan seed data awal Pengumpulan Tugas...');
        for (const s of INITIAL_SUBMISSIONS) {
            await pool.query(
                `INSERT INTO submissions (id, assignment_id, nim, student_name, note, link, file_url, submitted_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
                [s.id, s.assignment_id, s.nim, s.student_name, s.note, s.link, null, s.submitted_at]
            );
        }
    }

    console.log('[PostgreSQL] ✨ Data awal berhasil disinkronkan ke PostgreSQL.');
}

