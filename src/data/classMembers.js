// Data Mahasiswa / Member Kelas Sistem Informasi
export const CLASS_MEMBERS = {
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

/**
 * Mendapatkan data member berdasarkan NIM (case-insensitive).
 * Format NIM standar: 25SIxxx (3 digit angka terakhir unik)
 */
export function getMemberByNim(nim, customMembersMap = CLASS_MEMBERS) {
    if (!nim) return null;
    const clean = nim.trim().toUpperCase();

    // Cek format: bisa diawali 25SI atau huruf lain, dan diakhiri 3 digit angka unik
    const match = clean.match(/^(?:25SI)?(\d{3})$/i) || clean.match(/(\d{3})$/);
    if (!match) return null;

    const code = match[1]; // 3 digit angka unik
    const membersMap = customMembersMap || CLASS_MEMBERS;
    const member = membersMap[code];

    const standardNim = clean.startsWith('25SI') ? clean : `25SI${code}`;

    return {
        username: standardNim,
        nim: standardNim,
        code: code,
        fullname: member && member.fullname && member.fullname.trim() ? member.fullname.trim() : `Mahasiswa SI ${code}`,
        gender: member?.gender || 'L',
        photo: member?.photo || member?.avatar || null,
        avatar: member?.avatar || member?.photo || null,
        role: 'member',
        prodi: 'Sistem Informasi',
        jenjang: 'S1 Reguler',
        semester: 'Semester 3',
        kelas: 'SI-1',
        angkatan: '2025/2026',
        status: 'Aktif',
    };
}
