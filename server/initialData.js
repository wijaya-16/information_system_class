// server/initialData.js
// Data awal untuk otomatis di-seed ke PostgreSQL saat database pertama kali diinisialisasi

export const INITIAL_COURSES = [
    { id: 1, name: 'UI/UX Design', lecturer: 'Zumratul Muaihidin, M.Kom', credits: 4, category: 'Teori & Praktikum', color: 'bg-rose-500' },
    { id: 2, name: 'Manajemen Database', lecturer: 'Salman, S.ST., M.TI', credits: 3, category: 'Teori', color: 'bg-cyan-500' },
    { id: 3, name: 'Agama', lecturer: 'Agus Marjan Saputra, SEI.,MSEI', credits: 2, category: 'Teori', color: 'bg-emerald-500' },
    { id: 4, name: 'E-Business', lecturer: 'Zulpan Hadi, M.Kom.', credits: 3, category: 'Teori', color: 'bg-amber-500' },
    { id: 5, name: 'Technopreneurship 1', lecturer: 'Dr. Dwinita Arwidiyanti, M.Kom.', credits: 2, category: 'Teori', color: 'bg-blue-500' },
    { id: 6, name: 'Teknologi Web', lecturer: 'Dr. Muhammad Multazam, S.Kom., M.Kom', credits: 3, category: 'Praktik', color: 'bg-purple-500' },
    { id: 7, name: 'Pemrograman Berorientasi Objek', lecturer: 'Dr. Muhammad Multazam, S.Kom., M.Kom', credits: 3, category: 'Praktik', color: 'bg-violet-500' },
    { id: 8, name: 'Sistem Operasi', lecturer: 'Ahmad Yani, S.Kom., M.Kom', credits: 3, category: 'Teori', color: 'bg-slate-500' },
];

export const INITIAL_MATERIALS = [
    { id: 1, title: 'Manajemen Database', course: 'Manajemen Database', type: 'PDF', size: '2.4MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Salman, S.ST., M.TI', description: 'Perbedaan sistem basis data dengan sistem berkas (file system) konvensional, serta peran penting DBMS.' },
    { id: 2, title: 'Sistem Operasi', course: 'Sistem Operasi', type: 'PDF', size: '2.5MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Ahmad Yani, S.Kom., M.Kom', description: 'Peran, fungsi, dan evolusi OS (seperti Windows, Linux, macOS, dan Android) serta arsitektur dasarnya (kernel dan user space).' },
    { id: 3, title: 'Hakikat Manusia', course: 'Agama', type: 'PDF', size: '2.5MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Agus Marjan Saputra, SEI.,MSEI', description: 'Peran, fungsi, dan evolusi manusia serta nilai spiritual dalam kehidupan.' },
    { id: 4, title: 'Pengantar E-Business', course: 'E-Business', type: 'PDF', size: '2.5MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Zulpan Hadi, M.Kom.', description: 'Perbedaan antara e-business dan e-commerce, serta model bisnis seperti B2B, B2C, C2C, dan B2G.' },
    { id: 5, title: 'Technopreneurship 1', course: 'Technopreneurship 1', type: 'PDF', size: '2.5MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Dr. Dwinita Arwidiyanti, M.Kom.', description: 'Menumbuhkan jiwa inovatif, berani mengambil risiko terukur, serta peka dalam melihat masalah sebagai peluang bisnis.' },
    { id: 6, title: 'Pengantar UI/UX', course: 'UI/UX Design', type: 'PDF', size: '2.5MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Zumratul Muaihidin, M.Kom', description: 'Memahami perbedaan peran antara UI (keindahan visual, warna, tipografi) dan UX (alur pengguna, arsitektur informasi).' },
];

export const INITIAL_ASSIGNMENTS = [
    { id: 1, title: 'Laporan Normalisasi Database', course: 'Manajemen Database', description: 'Buat laporan normalisasi hingga 3NF untuk studi kasus sistem akademik.', lecturer: 'Salman, S.ST., M.TI', deadline: '2026-11-15', status: 'Aktif' },
    { id: 2, title: 'Analisis Kebutuhan UI', course: 'UI/UX Design', description: 'Buat analisis kebutuhan antarmuka untuk aplikasi akademik mahasiswa.', lecturer: 'Zumratul Muaihidin, M.Kom', deadline: '2026-11-20', status: 'Aktif' },
    { id: 3, title: 'Proposal E-business', course: 'E-Business', description: 'Susun proposal bisnis digital dengan model B2C yang lengkap beserta analisis pasar.', lecturer: 'Zulpan Hadi, M.Kom.', deadline: '2026-11-25', status: 'Aktif' },
];

export const INITIAL_ANNOUNCEMENTS = [
    { id: 1, title: 'Perubahan Jadwal Kuliah Tamu Big Data', category: 'Akademik', course: 'Manajemen Database', date: '2026-10-08', author: 'Ketua Prodi SI', important: true, content: 'Kuliah tamu yang semula dijadwalkan hari Rabu diundur menjadi hari Jumat pukul 09.00 WIB.' },
    { id: 2, title: 'Pengumpulan Tugas Diperpanjang', category: 'Tugas', course: 'E-Business', date: '2026-10-10', author: 'Zulpan Hadi, M.Kom.', important: false, content: 'Batas pengumpulan tugas proposal e-business diperpanjang hingga 25 November 2026.' },
];

export const INITIAL_EVENTS = [
    { date: '2026-11-12', title: 'Kuliah Tamu Big Data Analytics', time: '09.00 - 11.30 WIB', location: 'Aula Utama' },
];

export const INITIAL_PHOTOS = [
    {
        id: 1,
        url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
        title: 'Foto Kebersamaan Kelas Sistem Informasi',
        caption: 'Pertemuan perdana perkuliahan Semester 3 tahun ajaran 2025/2026. Semangat belajar dan berkolaborasi bersama!',
        date: '2026-10-15',
        is_hero: true,
        category: 'Makrab & Kebersamaan',
    },
    {
        id: 2,
        url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
        title: 'Diskusi Kelompok Pemrograman Web & UI/UX',
        caption: 'Suasana kolaborasi dan pengerjaan tugas proyek di laboratorium komputer.',
        date: '2026-10-18',
        is_hero: false,
        category: 'Praktikum & Perkuliahan',
    },
];

export const INITIAL_MEMBERS = [
    { code: '001', fullname: 'Adya Husaeni Akbar', gender: 'L' },
    { code: '002', fullname: 'Aliya Febi Lestari', gender: 'P' },
    { code: '003', fullname: 'Cinta Nuraini', gender: 'P' },
    { code: '004', fullname: 'Dania Febrianti', gender: 'P' },
    { code: '005', fullname: 'Dila Pebrianti', gender: 'P' },
    { code: '006', fullname: 'Fasha Deanova Yusmita Agustina', gender: 'P' },
    { code: '007', fullname: 'Fitri Yuliati', gender: 'P' },
    { code: '010', fullname: 'Riska Dian Muliana', gender: 'P' },
    { code: '011', fullname: 'Ruhil', gender: 'P' },
    { code: '012', fullname: 'Selvina Zia Azizah', gender: 'P' },
    { code: '013', fullname: 'Silvia Febriani', gender: 'P' },
    { code: '014', fullname: 'Siti Ramdayan', gender: 'P' },
    { code: '015', fullname: 'Suci Murniasih', gender: 'P' },
    { code: '016', fullname: 'Sukma Ariyanti', gender: 'P' },
    { code: '017', fullname: 'Tina Sapira Lana Sari', gender: 'P' },
    { code: '018', fullname: 'Tuhfatul Habib', gender: 'P' },
    { code: '019', fullname: 'Ziaratun Munawaroh', gender: 'P' },
    { code: '022', fullname: 'Aril Juliawan', gender: 'L' },
    { code: '023', fullname: 'Darmawan Saputra', gender: 'P' },
    { code: '024', fullname: 'Fahriansyah', gender: 'L' },
    { code: '025', fullname: 'Hendi Wijaya', gender: 'L' },
    { code: '026', fullname: 'Husni Mubaraq', gender: 'L' },
    { code: '027', fullname: 'Khaidir Abdullah', gender: 'L' },
    { code: '028', fullname: 'Lalu Anggasa Putra', gender: 'L' },
    { code: '029', fullname: 'M. Juan Arandi', gender: 'L' },
    { code: '030', fullname: 'Maksimilianus Makung', gender: 'L' },
    { code: '031', fullname: 'Muhamad Mawardi', gender: 'L' },
    { code: '032', fullname: 'Muhamad Mursidin', gender: 'L' },
    { code: '033', fullname: 'Muhammad Faesal', gender: 'L' },
    { code: '035', fullname: 'Muhammad Marzanni Pratama', gender: 'L' },
    { code: '036', fullname: 'Muhammad Masyudi', gender: 'L' },
    { code: '039', fullname: 'Yasril', gender: 'L' },
    { code: '040', fullname: 'Zangki Zamzani', gender: 'L' },
    { code: '041', fullname: 'Indah Prihantini', gender: 'L' },
    { code: '042', fullname: 'Baiq Indri Juniarti', gender: 'P' },
    { code: '043', fullname: 'Gina Fadilla', gender: 'P' },
    { code: '044', fullname: "Dhia'un Najmi", gender: 'L' },
    { code: '045', fullname: 'Muhammad Hendri', gender: 'L' },
    { code: '046', fullname: "Dimas Ahya'ul Qurro", gender: 'L' },
];

export const INITIAL_SUBMISSIONS = [
    { id: 1, assignment_id: 1, nim: '25SI001', student_name: 'Adya Husaeni Akbar', note: 'Sudah selesai normalisasi tabel hingga 3NF', link: 'https://drive.google.com/file/d/demo-tugas-normalisasi', submitted_at: '2026-10-20' },
    { id: 2, assignment_id: 1, nim: '25SI011', student_name: 'Ian Pratama', note: 'Laporan normalisasi database studi kasus akademik', link: 'https://drive.google.com/file/d/demo-ian-normalisasi', submitted_at: '2026-10-21' },
];

