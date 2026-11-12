import pool from "./config/db.js";

const CLASS_MEMBERS = {
  '001': { fullname: 'Adya Husaeni Akbar', gender: 'L' },
  '002': { fullname: 'Aliya Febi Lestari', gender: 'P' },
  '003': { fullname: 'Cinta Nuraini', gender: 'P' },
  '004': { fullname: 'Dania Febrianti', gender: 'P' },
  '005': { fullname: 'Dila Pebrianti', gender: 'P' },
  '006': { fullname: 'Fasha Deanova Yusmita Agustina', gender: 'P' },
  '007': { fullname: 'Fitri Yuliati', gender: 'P' },
  '010': { fullname: 'Riska Dian Muliana', gender: 'P' },
  '011': { fullname: 'Ruhil', gender: 'P' },
  '012': { fullname: 'Selvina Zia Azizah', gender: 'P' },
  '013': { fullname: 'Silvia Febriani', gender: 'P' },
  '014': { fullname: 'Siti Ramdayan', gender: 'P' },
  '015': { fullname: 'Suci Murniasih', gender: 'P' },
  '016': { fullname: 'Sukma Ariyanti', gender: 'P' },
  '017': { fullname: 'Tina Sapira Lana Sari', gender: 'P' },
  '018': { fullname: 'Tuhfatul Habib', gender: 'P' },
  '019': { fullname: 'Ziaratun Munawaroh', gender: 'P' },
  '022': { fullname: 'Aril Juliawan', gender: 'L' },
  '024': { fullname: 'Fahriansyah', gender: 'L' },
  '025': { fullname: 'Hendi Wijaya', gender: 'L' },
  '026': { fullname: 'Husni Mubaraq', gender: 'L' },
  '027': { fullname: 'Khaidir Abdullah', gender: 'L' },
  '028': { fullname: 'Lalu Anggasa Putra', gender: 'L' },
  '029': { fullname: 'M. Juan Arandi', gender: 'L' },
  '030': { fullname: 'Maksimilianus Makung', gender: 'L' },
  '031': { fullname: 'Muhamad Mawardi', gender: 'L' },
  '032': { fullname: 'Muhamad Mursidin', gender: 'L' },
  '033': { fullname: 'Muhammad Faesal', gender: 'L' },
  '035': { fullname: 'Muhammad Marzanni Pratama', gender: 'L' },
  '036': { fullname: 'Muhammad Masyudi', gender: 'L' },
  '039': { fullname: 'Yasril', gender: 'L' },
  '040': { fullname: 'Zangki Zamzani', gender: 'L' },
  '041': { fullname: 'Indah Prihantini', gender: 'L' },
  '042': { fullname: 'Baiq Indri Juniarti', gender: 'P' },
  '043': { fullname: 'Gina Fadilla', gender: 'P' },
  '044': { fullname: "Dhia'un Najmi", gender: 'L' },
  '045': { fullname: 'Muhammad Hendri', gender: 'L' },
  '046': { fullname: "Dimas Ahya'ul Qurro", gender: 'L' },
};

async function init() {
  console.log("Menghubungkan ke MySQL Laragon (db_information_system_class)...");

  // Hapus foreign key yang membatasi agar operasi CRUD tidak terblokir
  try { await pool.query("ALTER TABLE announcements DROP FOREIGN KEY fk_announcements_author"); } catch {}
  try { await pool.query("ALTER TABLE assignments DROP FOREIGN KEY fk_assignments_course"); } catch {}
  try { await pool.query("ALTER TABLE materials DROP FOREIGN KEY fk_materials_course"); } catch {}
  try { await pool.query("ALTER TABLE submissions DROP FOREIGN KEY submissions_ibfk_1"); } catch {}

  // 1. users
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      nim VARCHAR(30) NULL,
      username VARCHAR(50) NOT NULL UNIQUE,
      fullname VARCHAR(100) NOT NULL,
      email VARCHAR(100) NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','student') DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Insert / Update admin
  await pool.query(`
    INSERT INTO users (nim, username, fullname, email, password, role)
    VALUES ('ADMIN', 'admin', 'Administrator Kelas', 'admin@kelas.ac.id', 'admin123', 'admin')
    ON DUPLICATE KEY UPDATE fullname='Administrator Kelas', role='admin', password='admin123';
  `);

  // Insert all 42 students into users
  for (const [code, info] of Object.entries(CLASS_MEMBERS)) {
    const nim = `25SI${code}`;
    await pool.query(`
      INSERT INTO users (nim, username, fullname, password, role)
      VALUES (?, ?, ?, ?, 'student')
      ON DUPLICATE KEY UPDATE fullname=VALUES(fullname), nim=VALUES(nim);
    `, [nim, nim, info.fullname, nim]);
  }
  console.log("✓ Tabel users & 42 mahasiswa berhasil disinkronkan.");

  // 2. courses
  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NULL,
      name VARCHAR(100) NOT NULL,
      lecturer VARCHAR(100) NOT NULL,
      credits INT DEFAULT 3,
      semester VARCHAR(50) DEFAULT 'Semester 3',
      category VARCHAR(100) DEFAULT 'Teori',
      color VARCHAR(50) DEFAULT 'bg-blue-500',
      schedule_day VARCHAR(50) NULL,
      schedule_time VARCHAR(50) NULL,
      room VARCHAR(50) NULL,
      description TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Pastikan kolom baru dan tipe data BIGINT ada
  try { await pool.query("ALTER TABLE courses MODIFY COLUMN id BIGINT AUTO_INCREMENT"); } catch {}
  try { await pool.query("ALTER TABLE courses ADD COLUMN category VARCHAR(100) DEFAULT 'Teori'"); } catch {}
  try { await pool.query("ALTER TABLE courses ADD COLUMN color VARCHAR(50) DEFAULT 'bg-blue-500'"); } catch {}
  try { await pool.query("ALTER TABLE courses MODIFY COLUMN code VARCHAR(50) NULL"); } catch {}
  try { await pool.query("ALTER TABLE courses MODIFY COLUMN semester VARCHAR(50) NULL"); } catch {}

  const initialCourses = [
    [1, "UI/UX Design", "Zumratul Muaihidin, M.Kom", 4, "Teori & Praktikum", "bg-rose-500"],
    [2, "Manajemen Database", "Salman, S.ST., M.TI", 3, "Teori", "bg-cyan-500"],
    [3, "Agama", "Agus Marjan Saputra, SEI.,MSEI", 2, "Teori", "bg-emerald-500"],
    [4, "E-Business", "Zulpan Hadi, M.Kom.", 3, "Teori", "bg-amber-500"],
    [5, "Technopreneurship 1", "Dr. Dwinita Arwidiyanti, M.Kom.", 2, "Teori", "bg-blue-500"],
    [6, "Teknologi Web", "Dr. Muhammad Multazam, S.Kom., M.Kom", 3, "Praktik", "bg-purple-500"],
    [7, "Pemrograman Berorientasi Objek", "Dr. Maspaeni, M. Kom", 3, "Praktik", "bg-violet-500"],
    [8, "Sistem Operasi", "Ahmad Yani, S.Kom., M.Kom", 3, "Teori", "bg-slate-500"]
  ];

  for (const c of initialCourses) {
    await pool.query(`
      INSERT INTO courses (id, name, lecturer, credits, category, color)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name), lecturer=VALUES(lecturer), credits=VALUES(credits), category=VALUES(category), color=VALUES(color);
    `, c);
  }
  console.log("✓ Tabel courses & 8 mata kuliah berhasil disinkronkan.");

  // 3. materials
  await pool.query(`
    CREATE TABLE IF NOT EXISTS materials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NULL,
      course VARCHAR(100) NULL,
      title VARCHAR(150) NOT NULL,
      type VARCHAR(50) DEFAULT 'PDF',
      size VARCHAR(50) DEFAULT '2.5MB',
      date VARCHAR(50) NULL,
      semester VARCHAR(50) DEFAULT 'Semester 3',
      lecturer VARCHAR(100) NULL,
      description TEXT NULL,
      file_url VARCHAR(255) NULL,
      external_link VARCHAR(255) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  try { await pool.query("ALTER TABLE materials MODIFY COLUMN id BIGINT AUTO_INCREMENT"); } catch {}
  try { await pool.query("ALTER TABLE materials MODIFY COLUMN course_id BIGINT NULL"); } catch {}
  try { await pool.query("ALTER TABLE materials ADD COLUMN course VARCHAR(100) NULL"); } catch {}
  try { await pool.query("ALTER TABLE materials ADD COLUMN type VARCHAR(50) DEFAULT 'PDF'"); } catch {}
  try { await pool.query("ALTER TABLE materials ADD COLUMN size VARCHAR(50) DEFAULT '2.5MB'"); } catch {}
  try { await pool.query("ALTER TABLE materials ADD COLUMN date VARCHAR(50) NULL"); } catch {}
  try { await pool.query("ALTER TABLE materials ADD COLUMN semester VARCHAR(50) DEFAULT 'Semester 3'"); } catch {}
  try { await pool.query("ALTER TABLE materials ADD COLUMN lecturer VARCHAR(100) NULL"); } catch {}

  const initialMaterials = [
    [1, "Manajemen Database", "Manajemen Database", "PDF", "2.4MB", "2026-10-11", "Semester 3", "Salman, S.ST., M.TI", "Perbedaan sistem basis data dengan sistem berkas konvensional, serta peran penting DBMS."],
    [2, "Sistem Operasi", "Sistem Operasi", "PDF", "2.5MB", "2026-10-11", "Semester 3", "Ahmad Yani, S.Kom., M.Kom", "Peran, fungsi, dan evolusi OS serta arsitektur dasarnya."],
    [3, "Hakikat Manusia", "Agama", "PDF", "2.5MB", "2026-10-11", "Semester 3", "Agus Marjan Saputra, SEI.,MSEI", "Peran, fungsi, dan evolusi manusia serta nilai spiritual dalam kehidupan."],
    [4, "Pengantar E-Business", "E-Business", "PDF", "2.5MB", "2026-10-11", "Semester 3", "Zulpan Hadi, M.Kom.", "Perbedaan antara e-business dan e-commerce, serta model bisnis B2B, B2C, C2C."],
    [5, "Technopreneurship 1", "Technopreneurship 1", "PDF", "2.5MB", "2026-10-11", "Semester 3", "Dr. Dwinita Arwidiyanti, M.Kom.", "Menumbuhkan jiwa inovatif, berani mengambil risiko terukur."],
    [6, "Pengantar UI/UX", "UI/UX Design", "PDF", "2.5MB", "2026-10-11", "Semester 3", "Zumratul Muaihidin, M.Kom", "Memahami perbedaan peran antara UI dan UX."]
  ];

  for (const m of initialMaterials) {
    await pool.query(`
      INSERT INTO materials (id, title, course, type, size, date, semester, lecturer, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE title=VALUES(title), course=VALUES(course);
    `, m);
  }
  console.log("✓ Tabel materials & 6 materi berhasil disinkronkan.");

  // 4. assignments
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NULL,
      course VARCHAR(100) NULL,
      title VARCHAR(150) NOT NULL,
      description TEXT NULL,
      lecturer VARCHAR(100) NULL,
      deadline VARCHAR(50) NULL,
      status VARCHAR(50) DEFAULT 'Aktif',
      file_url VARCHAR(255) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  try { await pool.query("ALTER TABLE assignments MODIFY COLUMN id BIGINT AUTO_INCREMENT"); } catch {}
  try { await pool.query("ALTER TABLE assignments MODIFY COLUMN course_id BIGINT NULL"); } catch {}
  try { await pool.query("ALTER TABLE assignments MODIFY COLUMN deadline VARCHAR(50) NULL"); } catch {}
  try { await pool.query("ALTER TABLE assignments ADD COLUMN course VARCHAR(100) NULL"); } catch {}
  try { await pool.query("ALTER TABLE assignments ADD COLUMN lecturer VARCHAR(100) NULL"); } catch {}
  try { await pool.query("ALTER TABLE assignments ADD COLUMN status VARCHAR(50) DEFAULT 'Aktif'"); } catch {}

  const initialAssignments = [
    [1, "Laporan Normalisasi Database", "Manajemen Database", "Buat laporan normalisasi hingga 3NF untuk studi kasus sistem akademik.", "Salman, S.ST., M.TI", "2026-11-15", "Aktif"],
    [2, "Analisis Kebutuhan UI", "UI/UX Design", "Buat analisis kebutuhan antarmuka untuk aplikasi akademik mahasiswa.", "Zumratul Muaihidin, M.Kom", "2026-11-20", "Aktif"],
    [3, "Proposal E-business", "E-Business", "Susun proposal bisnis digital dengan model B2C yang lengkap beserta analisis pasar.", "Zulpan Hadi, M.Kom.", "2026-11-25", "Aktif"]
  ];

  for (const a of initialAssignments) {
    await pool.query(`
      INSERT INTO assignments (id, title, course, description, lecturer, deadline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE title=VALUES(title), course=VALUES(course);
    `, a);
  }
  console.log("✓ Tabel assignments & 3 tugas berhasil disinkronkan.");

  // 5. announcements
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      author_id INT NULL,
      author VARCHAR(100) DEFAULT 'Ketua Prodi SI',
      title VARCHAR(150) NOT NULL,
      category VARCHAR(50) DEFAULT 'Akademik',
      course VARCHAR(100) NULL,
      date VARCHAR(50) NULL,
      important BOOLEAN DEFAULT false,
      content TEXT NOT NULL,
      priority ENUM('low','medium','high') DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  try { await pool.query("ALTER TABLE announcements MODIFY COLUMN id BIGINT AUTO_INCREMENT"); } catch {}
  try { await pool.query("ALTER TABLE announcements MODIFY COLUMN author_id BIGINT NULL"); } catch {}
  try { await pool.query("ALTER TABLE announcements ADD COLUMN author VARCHAR(100) DEFAULT 'Ketua Prodi SI'"); } catch {}
  try { await pool.query("ALTER TABLE announcements ADD COLUMN category VARCHAR(50) DEFAULT 'Akademik'"); } catch {}
  try { await pool.query("ALTER TABLE announcements ADD COLUMN course VARCHAR(100) NULL"); } catch {}
  try { await pool.query("ALTER TABLE announcements ADD COLUMN date VARCHAR(50) NULL"); } catch {}
  try { await pool.query("ALTER TABLE announcements ADD COLUMN important BOOLEAN DEFAULT false"); } catch {}

  const initialAnnouncements = [
    [1, "Perubahan Jadwal Kuliah Tamu Big Data", "Akademik", "Manajemen Database", "2026-10-08", "Ketua Prodi SI", 1, "Kuliah tamu yang semula dijadwalkan hari Rabu diundur menjadi hari Jumat pukul 09.00 WIB."],
    [2, "Pengumpulan Tugas Diperpanjang", "Tugas", "E-Business", "2026-10-10", "Zulpan Hadi, M.Kom.", 0, "Batas pengumpulan tugas proposal e-business diperpanjang hingga 25 November 2026."]
  ];

  for (const an of initialAnnouncements) {
    await pool.query(`
      INSERT INTO announcements (id, title, category, course, date, author, important, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content);
    `, an);
  }
  console.log("✓ Tabel announcements berhasil disinkronkan.");

  // 6. class_photos
  await pool.query(`
    CREATE TABLE IF NOT EXISTS class_photos (
      id BIGINT PRIMARY KEY,
      url VARCHAR(500) NOT NULL,
      title VARCHAR(200) NOT NULL,
      caption TEXT NULL,
      date VARCHAR(50) NULL,
      category VARCHAR(100) DEFAULT 'Praktikum & Perkuliahan',
      is_hero BOOLEAN DEFAULT false,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  const initialPhotos = [
    [1, "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80", "Foto Kebersamaan Kelas Sistem Informasi", "Pertemuan perdana perkuliahan Semester 3 tahun ajaran 2025/2026. Semangat belajar dan berkolaborasi bersama!", "2026-10-15", "Praktikum & Perkuliahan", 1],
    [2, "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80", "Diskusi Kelompok Pemrograman Web & UI/UX", "Suasana kolaborasi dan pengerjaan tugas proyek di laboratorium komputer.", "2026-10-18", "Praktikum & Perkuliahan", 0]
  ];

  for (const p of initialPhotos) {
    await pool.query(`
      INSERT INTO class_photos (id, url, title, caption, date, category, is_hero)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE title=VALUES(title), url=VALUES(url);
    `, p);
  }
  console.log("✓ Tabel class_photos berhasil disinkronkan.");

  // 7. members_list
  await pool.query(`
    CREATE TABLE IF NOT EXISTS members_list (
      code VARCHAR(10) PRIMARY KEY,
      fullname VARCHAR(100) NOT NULL,
      gender VARCHAR(5) DEFAULT 'L',
      nim VARCHAR(30) NULL,
      photo TEXT NULL,
      password VARCHAR(255) DEFAULT 'si2025',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  for (const [code, info] of Object.entries(CLASS_MEMBERS)) {
    const nim = `25SI${code}`;
    await pool.query(`
      INSERT INTO members_list (code, fullname, gender, nim)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE fullname=VALUES(fullname), gender=VALUES(gender);
    `, [code, info.fullname, info.gender, nim]);
  }
  console.log("✓ Tabel members_list & 42 anggota berhasil disinkronkan.");

  // 8. submissions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      assignment_id BIGINT NOT NULL,
      nim VARCHAR(30) NOT NULL,
      student_name VARCHAR(100) NOT NULL,
      note TEXT NULL,
      link VARCHAR(500) NULL,
      file_url VARCHAR(255) NULL,
      submitted_at VARCHAR(50) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  try { await pool.query("ALTER TABLE submissions MODIFY COLUMN id BIGINT AUTO_INCREMENT"); } catch {}
  try { await pool.query("ALTER TABLE submissions MODIFY COLUMN assignment_id BIGINT NOT NULL"); } catch {}
  try { await pool.query("ALTER TABLE submissions ADD COLUMN link VARCHAR(500) NULL"); } catch {}
  try { await pool.query("ALTER TABLE submissions MODIFY COLUMN submitted_at VARCHAR(50) NULL"); } catch {}

  const initialSubmissions = [
    [1, 1, '25SI001', 'Adya Husaeni Akbar', 'Sudah selesai normalisasi tabel hingga 3NF', 'https://drive.google.com/file/d/demo-tugas-normalisasi', '2026-10-20'],
    [2, 1, '25SI025', 'Hendi Wijaya', 'Laporan normalisasi database studi kasus akademik', 'https://drive.google.com/file/d/demo-ian-normalisasi', '2026-10-21']
  ];

  for (const s of initialSubmissions) {
    await pool.query(`
      INSERT INTO submissions (id, assignment_id, nim, student_name, note, link, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE student_name=VALUES(student_name);
    `, s);
  }
  console.log("✓ Tabel submissions berhasil disinkronkan.");

  console.log("\n=======================================================");
  console.log("🎉 SEMUA TABEL DAN DATA MYSQL LARAGON BERHASIL DIINISIALISASI!");
  console.log("=======================================================");
  process.exit(0);
}

init().catch(err => {
  console.error("Gagal inisialisasi DB:", err);
  process.exit(1);
});

