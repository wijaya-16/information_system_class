-- ============================================================
-- SKEMA DATABASE SUPABASE UNTUK APLIKASI KELAS SISTEM INFORMASI
-- ============================================================
-- Jalankan skrip ini di menu SQL Editor di Supabase Dashboard Anda.
-- (Buka Supabase -> Pilih Project -> Klik "SQL Editor" -> Tempel & Klik "RUN")

-- 1. TABEL MATA KULIAH (courses)
CREATE TABLE IF NOT EXISTS public.courses (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lecturer VARCHAR(255),
    credits INT DEFAULT 3,
    category VARCHAR(100),
    color VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL MATERI KULIAH (materials)
CREATE TABLE IF NOT EXISTS public.materials (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    course VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'PDF',
    size VARCHAR(50) DEFAULT '2.5MB',
    date VARCHAR(50),
    semester VARCHAR(50) DEFAULT 'Semester 3',
    lecturer VARCHAR(255),
    description TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL TUGAS KULIAH (assignments)
CREATE TABLE IF NOT EXISTS public.assignments (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    course VARCHAR(255) NOT NULL,
    description TEXT,
    lecturer VARCHAR(255),
    deadline VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL PENGUMUMAN (announcements)
CREATE TABLE IF NOT EXISTS public.announcements (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Akademik',
    course VARCHAR(255),
    date VARCHAR(50),
    author VARCHAR(255) DEFAULT 'Administrator Kelas',
    important BOOLEAN DEFAULT FALSE,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL AGENDA / JADWAL (events)
CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    date VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    time VARCHAR(100),
    location VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL GALERI FOTO KELAS (class_photos)
CREATE TABLE IF NOT EXISTS public.class_photos (
    id BIGINT PRIMARY KEY,
    url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    caption TEXT,
    date VARCHAR(50),
    is_hero BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) DEFAULT 'Praktikum & Perkuliahan',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL MAHASISWA / MEMBERS (members)
CREATE TABLE IF NOT EXISTS public.members (
    code VARCHAR(50) PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    gender VARCHAR(10) DEFAULT 'L',
    photo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL PENGUMPULAN TUGAS (submissions)
CREATE TABLE IF NOT EXISTS public.submissions (
    id BIGINT PRIMARY KEY,
    assignment_id BIGINT,
    nim VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    note TEXT,
    link TEXT,
    file_url TEXT,
    submitted_at VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PENGATURAN HAK AKSES (Row Level Security - RLS)
-- Izinkan Akses Baca & Tulis Publik (Anon Key)
-- ============================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Buat Kebijakan Akses Penuh untuk Anon Key
DROP POLICY IF EXISTS "Public access courses" ON public.courses;
CREATE POLICY "Public access courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access materials" ON public.materials;
CREATE POLICY "Public access materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access assignments" ON public.assignments;
CREATE POLICY "Public access assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access announcements" ON public.announcements;
CREATE POLICY "Public access announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access events" ON public.events;
CREATE POLICY "Public access events" ON public.events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access class_photos" ON public.class_photos;
CREATE POLICY "Public access class_photos" ON public.class_photos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access members" ON public.members;
CREATE POLICY "Public access members" ON public.members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access submissions" ON public.submissions;
CREATE POLICY "Public access submissions" ON public.submissions FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA AWAL KELAS SISTEM INFORMASI
-- (Hanya mengisi jika tabel masih kosong)
-- ============================================================

-- A. Data Mata Kuliah
INSERT INTO public.courses (id, name, lecturer, credits, category, color)
VALUES
(1, 'UI/UX Design', 'Zumratul Muaihidin, M.Kom', 4, 'Teori & Praktikum', 'bg-rose-500'),
(2, 'Manajemen Database', 'Salman, S.ST., M.TI', 3, 'Teori', 'bg-cyan-500'),
(3, 'Agama', 'Agus Marjan Saputra, SEI.,MSEI', 2, 'Teori', 'bg-emerald-500'),
(4, 'E-Business', 'Zulpan Hadi, M.Kom.', 3, 'Teori', 'bg-amber-500'),
(5, 'Technopreneurship 1', 'Dr. Dwinita Arwidiyanti, M.Kom.', 2, 'Teori', 'bg-blue-500'),
(6, 'Teknologi Web', 'Dr. Muhammad Multazam, S.Kom., M.Kom', 3, 'Praktik', 'bg-purple-500'),
(7, 'Pemrograman Berorientasi Objek', 'Dr. Maspaeni, M.Kom', 3, 'Praktik', 'bg-violet-500'),
(8, 'Sistem Operasi', 'Ahmad Yani, S.Kom., M.Kom', 3, 'Teori', 'bg-slate-500')
ON CONFLICT (id) DO NOTHING;

-- B. Data Materi Perkuliahan
INSERT INTO public.materials (id, title, course, type, size, date, semester, lecturer, description)
VALUES
(1, 'Manajemen Database', 'Manajemen Database', 'PDF', '2.4MB', '2026-10-11', 'Semester 3', 'Salman, S.ST., M.TI', 'Perbedaan sistem basis data dengan sistem berkas (file system) konvensional, serta peran penting DBMS.'),
(2, 'Sistem Operasi', 'Sistem Operasi', 'PDF', '2.5MB', '2026-10-11', 'Semester 3', 'Ahmad Yani, S.Kom., M.Kom', 'Peran, fungsi, dan evolusi OS serta arsitektur dasarnya.'),
(3, 'Hakikat Manusia', 'Agama', 'PDF', '2.5MB', '2026-10-11', 'Semester 3', 'Agus Marjan Saputra, SEI.,MSEI', 'Peran, fungsi, dan evolusi manusia serta nilai spiritual dalam kehidupan.'),
(4, 'Pengantar E-Business', 'E-Business', 'PDF', '2.5MB', '2026-10-11', 'Semester 3', 'Zulpan Hadi, M.Kom.', 'Perbedaan antara e-business dan e-commerce, serta model bisnis digital.'),
(5, 'Technopreneurship 1', 'Technopreneurship 1', 'PDF', '2.5MB', '2026-10-11', 'Semester 3', 'Dr. Dwinita Arwidiyanti, M.Kom.', 'Menumbuhkan jiwa inovatif dan melihat masalah sebagai peluang bisnis.'),
(6, 'Pengantar UI/UX', 'UI/UX Design', 'PDF', '2.5MB', '2026-10-11', 'Semester 3', 'Zumratul Muaihidin, M.Kom', 'Memahami perbedaan peran antara UI dan UX dalam desain aplikasi.')
ON CONFLICT (id) DO NOTHING;

-- C. Data Tugas Kuliah
INSERT INTO public.assignments (id, title, course, description, lecturer, deadline, status)
VALUES
(1, 'Laporan Normalisasi Database', 'Manajemen Database', 'Buat laporan normalisasi hingga 3NF untuk studi kasus sistem akademik.', 'Salman, S.ST., M.TI', '2026-11-15', 'Aktif'),
(2, 'Analisis Kebutuhan UI', 'UI/UX Design', 'Buat analisis kebutuhan antarmuka untuk aplikasi akademik mahasiswa.', 'Zumratul Muaihidin, M.Kom', '2026-11-20', 'Aktif'),
(3, 'Proposal E-business', 'E-Business', 'Susun proposal bisnis digital dengan model B2C yang lengkap beserta analisis pasar.', 'Zulpan Hadi, M.Kom.', '2026-11-25', 'Aktif')
ON CONFLICT (id) DO NOTHING;

-- D. Data Pengumuman
INSERT INTO public.announcements (id, title, category, course, date, author, important, content)
VALUES
(1, 'Perubahan Jadwal Kuliah Tamu Big Data', 'Akademik', 'Manajemen Database', '2026-10-08', 'Ketua Prodi SI', true, 'Kuliah tamu yang semula dijadwalkan hari Rabu diundur menjadi hari Jumat pukul 09.00 WIB.'),
(2, 'Pengumpulan Tugas Diperpanjang', 'Tugas', 'E-Business', '2026-10-10', 'Zulpan Hadi, M.Kom.', false, 'Batas pengumpulan tugas proposal e-business diperpanjang hingga 25 November 2026.')
ON CONFLICT (id) DO NOTHING;

-- E. Data Galeri Foto Kelas
INSERT INTO public.class_photos (id, url, title, caption, date, is_hero, category)
VALUES
(1, 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', 'Foto Kebersamaan Kelas Sistem Informasi', 'Pertemuan perdana perkuliahan Semester 3 tahun ajaran 2025/2026. Semangat belajar dan berkolaborasi bersama!', '2026-10-15', true, 'Praktikum & Perkuliahan'),
(2, 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', 'Diskusi Kelompok Pemrograman Web & UI/UX', 'Suasana kolaborasi dan pengerjaan tugas proyek di laboratorium komputer.', '2026-10-18', false, 'Praktikum & Perkuliahan')
ON CONFLICT (id) DO NOTHING;

-- F. Data Mahasiswa Kelas SI (42 Mahasiswa)
INSERT INTO public.members (code, fullname, gender)
VALUES
('001', 'Adya Husaeni Akbar', 'L'),
('002', 'Aliya Febi Lestari', 'P'),
('003', 'Cinta Nuraini', 'P'),
('004', 'Dania Febrianti', 'P'),
('005', 'Dila Pebrianti', 'P'),
('006', 'Fasha Deanova Yusmita Agustina', 'P'),
('007', 'Fitri Yuliati', 'P'),
('010', 'Riska Dian Muliana', 'P'),
('011', 'Ruhil', 'P'),
('012', 'Selvina Zia Azizah', 'P'),
('013', 'Silvia Febriani', 'P'),
('014', 'Siti Ramdayan', 'P'),
('015', 'Suci Murniasih', 'P'),
('016', 'Sukma Ariyanti', 'P'),
('017', 'Tina Sapira Lana Sari', 'P'),
('018', 'Tuhfatul Habib', 'P'),
('019', 'Ziaratun Munawaroh', 'P'),
('022', 'Aril Juliawan', 'L'),
('024', 'Fahriansyah', 'L'),
('025', 'Hendi Wijaya', 'L'),
('026', 'Husni Mubaraq', 'L'),
('027', 'Khaidir Abdullah', 'L'),
('028', 'Lalu Anggasa Putra', 'L'),
('029', 'M. Juan Arandi', 'L'),
('030', 'Maksimilianus Makung', 'L'),
('031', 'Muhamad Mawardi', 'L'),
('032', 'Muhamad Mursidin', 'L'),
('033', 'Muhammad Faesal', 'L'),
('035', 'Muhammad Marzanni Pratama', 'L'),
('036', 'Muhammad Masyudi', 'L'),
('039', 'Yasril', 'L'),
('040', 'Zangki Zamzani', 'L'),
('041', 'Indah Prihantini', 'L'),
('042', 'Baiq Indri Juniarti', 'P'),
('043', 'Gina Fadilla', 'P'),
('044', "Dhia'un Najmi", 'L'),
('045', 'Muhammad Hendri', 'L'),
('046', 'Dimas Ahya''ul Qurro', 'L')
ON CONFLICT (code) DO NOTHING;

-- Selesai! Seluruh tabel dan data awal Kelas Sistem Informasi siap digunakan secara online di Supabase.

