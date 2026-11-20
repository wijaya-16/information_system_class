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
 * Mendapatkan data member berdasarkan NIM atau Kode Mahasiswa (case-insensitive).
 * Format NIM standar: 25SIxxx (3 digit angka terakhir unik)
 * HANYA mengembalikan data jika member BENAR-BENAR TERDAFTAR dalam membersMap.
 * Jika tidak terdaftar, WAJIB mengembalikan null agar sembarang orang tidak bisa masuk.
 */
export function getMemberByNim(nim, customMembersMap = CLASS_MEMBERS) {
    if (!nim) return null;
    const clean = nim.trim().toUpperCase();
    const membersMap = customMembersMap || CLASS_MEMBERS;

    let targetCode = null;
    let memberData = null;

    // 1. Cek langsung jika input adalah key code di membersMap (contoh: '001', '025')
    if (membersMap[clean]) {
        targetCode = clean;
        memberData = membersMap[clean];
    } else {
        // 2. Cek format NIM standar: diawali 25SI dan 3 digit angka, atau 3 digit angka unik
        const match = clean.match(/^25SI(\d{3})$/i) || clean.match(/^(\d{3})$/);
        if (match) {
            const candidateCode = match[1];
            if (membersMap[candidateCode]) {
                targetCode = candidateCode;
                memberData = membersMap[candidateCode];
            }
        }
    }

    // 3. Fallback: cari berdasarkan properti nim atau username yang tersimpan di objek member
    if (!memberData) {
        for (const [key, val] of Object.entries(membersMap)) {
            if (!val) continue;
            const valNim = (val.nim || '').trim().toUpperCase();
            const valUsername = (val.username || '').trim().toUpperCase();
            if (valNim === clean || valUsername === clean) {
                targetCode = key;
                memberData = val;
                break;
            }
        }
    }

    // JIKA TIDAK TERDAFTAR DALAM DAFTAR MEMBER RESMI: KEMBALIKAN NULL (AKSES DITOLAK)
    if (!memberData) {
        return null;
    }

    const standardNim = memberData.nim || (targetCode.length === 3 ? `25SI${targetCode}` : targetCode);

    return {
        id: targetCode,
        username: memberData.username || standardNim,
        nim: standardNim,
        code: targetCode,
        fullname: memberData.fullname && memberData.fullname.trim() ? memberData.fullname.trim() : `Mahasiswa SI ${targetCode}`,
        gender: memberData.gender || 'L',
        photo: memberData.photo || memberData.avatar || null,
        avatar: memberData.avatar || memberData.photo || null,
        role: 'student',
        prodi: 'Sistem Informasi',
        jenjang: 'S1 Reguler',
        semester: 'Semester 3',
        kelas: memberData.kelas || 'SI-1',
        angkatan: memberData.angkatan || '2025/2026',
        status: memberData.status || 'Aktif',
        password: memberData.password || null,
    };
}
