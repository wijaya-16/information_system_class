import React, { useState, useRef, useMemo } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';
import ImageCropperModal from './ImageCropperModal';

export default function MembersPage({
    members = {},
    currentUser,
    isAdmin = false,
    adminHandlers,
    showToast,
    navigateTo,
    assignments = [],
    submissions = [],
    courses = [],
}) {
    const [search, setSearch] = useState('');
    const [genderFilter, setGenderFilter] = useState('Semua');
    const [photoFilter, setPhotoFilter] = useState('Semua'); // 'Semua' | 'dengan_foto' | 'tanpa_foto'
    const [selectedMember, setSelectedMember] = useState(null);
    const [detailTab, setDetailTab] = useState('akademik'); // 'akademik' | 'tugas' | 'matkul'

    // Admin modal state
    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
    const [editTarget, setEditTarget] = useState(null);
    const [confirmDeleteCode, setConfirmDeleteCode] = useState(null);

    const fileInputRef = useRef(null);
    const detailFileInputRef = useRef(null);
    const selfFileInputRef = useRef(null);

    const [form, setForm] = useState({
        code: '',
        fullname: '',
        gender: 'L',
        photo: '',
    });

    // State untuk fitur penyesuaian (pemotongan/crop) foto sebelum disimpan
    const [cropperState, setCropperState] = useState({
        isOpen: false,
        imageSrc: '',
        targetCode: null,
        targetData: null,
        isFormEdit: false,
    });

    // Membaca file gambar dan membuka modal pemotongan / penyesuaian foto
    const onSelectFileToCrop = (e, targetCode = null, targetData = null, isFormEdit = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            if (showToast) showToast('Silakan pilih berkas gambar (JPG, PNG, WebP)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setCropperState({
                isOpen: true,
                imageSrc: event.target?.result,
                targetCode,
                targetData,
                isFormEdit,
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Eksekusi setelah foto selesai dipotong/disesuaikan oleh user
    const handleCroppedComplete = (croppedUrl) => {
        const { targetCode, targetData, isFormEdit } = cropperState;

        if (isFormEdit) {
            setForm((f) => ({ ...f, photo: croppedUrl }));
            setCropperState({ isOpen: false, imageSrc: '', targetCode: null, targetData: null, isFormEdit: false });
            if (showToast) showToast('Foto berhasil disesuaikan untuk formulir', 'success');
            return;
        }

        if (targetCode) {
            const memberInfo = targetData || members[targetCode] || {
                fullname: currentUser?.fullname || 'Mahasiswa',
                gender: currentUser?.gender || 'L',
            };

            const updatedMember = {
                ...memberInfo,
                photo: croppedUrl,
            };

            // 1. Simpan foto profil ke data mahasiswa (members_list)
            adminHandlers.member.update(targetCode, targetCode, updatedMember);

            // Update selectedMember jika modal detail sedang terbuka
            if (selectedMember && selectedMember.code === targetCode) {
                setSelectedMember((prev) => ({ ...prev, photo: croppedUrl }));
            }

            // 2. Simpan juga ke dalam database tabel galeri (class_photos)
            if (adminHandlers.classPhoto?.add) {
                const memberNim = `25SI${targetCode}`;
                adminHandlers.classPhoto.add({
                    url: croppedUrl,
                    title: `Foto Profil - ${memberInfo.fullname} (${memberNim})`,
                    caption: `Dokumentasi foto profil resmi mahasiswa Sistem Informasi Semester 3: ${memberInfo.fullname} (${memberNim}).`,
                    category: 'Makrab & Kebersamaan',
                    date: new Date().toISOString().split('T')[0],
                    isHero: false,
                });
            }

            if (showToast) {
                showToast('Foto profil berhasil disesuaikan dan tersimpan ke Galeri Kelas!', 'success');
            }
        }

        setCropperState({ isOpen: false, imageSrc: '', targetCode: null, targetData: null, isFormEdit: false });
    };

    // Ambil kode mahasiswa login
    const currentStudentCode = useMemo(() => {
        if (!currentUser) return null;
        if (currentUser.code) return String(currentUser.code).padStart(3, '0');
        if (currentUser.nim) {
            const match = currentUser.nim.match(/(\d{3})$/);
            return match ? match[1] : null;
        }
        return null;
    }, [currentUser]);

    const isCurrentStudent = Boolean(!isAdmin && currentStudentCode && members[currentStudentCode]);
    const currentStudentData = isCurrentStudent ? members[currentStudentCode] : null;

    // Hitung status tugas untuk mahasiswa tertentu
    const getStudentAssignmentStats = (nim) => {
        if (!assignments.length) return { total: 0, completed: 0, percentage: 100, pending: 0 };
        const mySubmissions = submissions.filter(s => s.nim === nim);
        const completedCount = mySubmissions.length;
        const totalCount = assignments.length;
        const percentage = Math.round((completedCount / totalCount) * 100);
        return {
            total: totalCount,
            completed: completedCount,
            pending: Math.max(0, totalCount - completedCount),
            percentage,
            submissions: mySubmissions,
        };
    };

    // Unggah foto mandiri oleh mahasiswa yang sedang login
    const handleSelfPhotoUpload = (e) => {
        if (!currentStudentCode) return;
        const existing = members[currentStudentCode] || {
            fullname: currentUser.fullname,
            gender: currentUser.gender || 'L',
        };

        handleFileChange(e, (compressedUrl) => {
            adminHandlers.member.update(currentStudentCode, currentStudentCode, {
                ...existing,
                photo: compressedUrl,
            });
            if (showToast) showToast('Foto profil Anda berhasil diunggah!', 'success');
        });
    };

    // Hapus foto mandiri
    const handleSelfPhotoDelete = () => {
        if (!currentStudentCode) return;
        const existing = members[currentStudentCode] || {
            fullname: currentUser.fullname,
            gender: currentUser.gender || 'L',
        };

        adminHandlers.member.update(currentStudentCode, currentStudentCode, {
            ...existing,
            photo: null,
        });
        if (showToast) showToast('Foto profil Anda telah dihapus', 'info');
    };

    // Generate next 3-digit code
    const getNextCode = () => {
        const codes = Object.keys(members).map(k => parseInt(k, 10)).filter(n => !isNaN(n));
        const max = codes.length > 0 ? Math.max(...codes) : 0;
        return String(max + 1).padStart(3, '0');
    };

    const openAdd = () => {
        setForm({
            code: getNextCode(),
            fullname: '',
            gender: 'L',
            photo: '',
        });
        setEditTarget(null);
        setModalMode('add');
    };

    const openEdit = (e, code, member) => {
        e.stopPropagation();
        setForm({
            code: code,
            fullname: member.fullname,
            gender: member.gender || 'L',
            photo: member.photo || member.avatar || '',
        });
        setEditTarget({ code, ...member });
        setModalMode('edit');
    };

    const handleSave = () => {
        const trimmedCode = form.code.trim().padStart(3, '0');
        const trimmedName = form.fullname.trim();

        if (!trimmedCode || trimmedCode.length !== 3) {
            if (showToast) showToast('Kode NIM harus berupa 3 digit angka (contoh: 023)', 'error');
            return;
        }
        if (!trimmedName) {
            if (showToast) showToast('Nama lengkap mahasiswa wajib diisi', 'error');
            return;
        }

        const payload = {
            fullname: trimmedName,
            gender: form.gender,
            photo: form.photo || null,
        };

        if (modalMode === 'add') {
            if (members[trimmedCode]) {
                if (showToast) showToast(`NIM 25SI${trimmedCode} sudah terdaftar`, 'error');
                return;
            }
            adminHandlers.member.add(trimmedCode, payload);
        } else if (modalMode === 'edit' && editTarget) {
            adminHandlers.member.update(editTarget.code, trimmedCode, payload);
        }
        setModalMode(null);
    };

    const handleDelete = () => {
        if (!confirmDeleteCode) return;
        adminHandlers.member.delete(confirmDeleteCode);
        setConfirmDeleteCode(null);
        if (selectedMember?.code === confirmDeleteCode) {
            setSelectedMember(null);
        }
    };

    // Upload foto profil dari Modal Detail
    const handleDetailPhotoUpload = (e) => {
        if (!selectedMember) return;
        handleFileChange(e, (compressedUrl) => {
            adminHandlers.member.update(selectedMember.code, selectedMember.code, {
                fullname: selectedMember.fullname,
                gender: selectedMember.gender,
                photo: compressedUrl,
            });
            setSelectedMember(prev => ({ ...prev, photo: compressedUrl }));
            if (showToast) showToast(`Foto profil ${selectedMember.fullname} berhasil diperbarui!`);
        });
    };

    // Hapus foto profil dari Modal Detail
    const handleDetailPhotoDelete = () => {
        if (!selectedMember) return;
        adminHandlers.member.update(selectedMember.code, selectedMember.code, {
            fullname: selectedMember.fullname,
            gender: selectedMember.gender,
            photo: null,
        });
        setSelectedMember(prev => ({ ...prev, photo: null }));
        if (showToast) showToast(`Foto profil ${selectedMember.fullname} telah dihapus`);
    };

    // Format list mahasiswa
    const memberList = useMemo(() => {
        return Object.entries(members).map(([code, data]) => ({
            code,
            nim: `25SI${code}`,
            fullname: data.fullname,
            gender: data.gender || 'L',
            photo: data.photo || data.avatar || null,
        }));
    }, [members]);

    // Filtered members
    const filtered = useMemo(() => {
        return memberList.filter(m => {
            const matchSearch =
                m.fullname.toLowerCase().includes(search.toLowerCase()) ||
                m.nim.toLowerCase().includes(search.toLowerCase()) ||
                m.code.includes(search);

            const matchGender = genderFilter === 'Semua' || m.gender === genderFilter;

            const matchPhoto =
                photoFilter === 'Semua' ||
                (photoFilter === 'dengan_foto' && Boolean(m.photo)) ||
                (photoFilter === 'tanpa_foto' && !m.photo);

            return matchSearch && matchGender && matchPhoto;
        });
    }, [memberList, search, genderFilter, photoFilter]);

    const countL = memberList.filter(m => m.gender === 'L').length;
    const countP = memberList.filter(m => m.gender === 'P').length;
    const countWithPhoto = memberList.filter(m => Boolean(m.photo)).length;

    // Stats profil mahasiswa yang sedang login
    const selfStats = useMemo(() => {
        if (!currentStudentCode) return null;
        return getStudentAssignmentStats(`25SI${currentStudentCode}`);
    }, [currentStudentCode, assignments, submissions]);

    return (
        <div className="space-y-8">
            {/* Input file tersembunyi untuk upload profil mandiri & detail (dengan fitur crop/penyesuaian) */}
            <input
                type="file"
                ref={selfFileInputRef}
                accept="image/*"
                onChange={(e) => onSelectFileToCrop(e, currentStudentCode, currentStudentData, false)}
                className="hidden"
            />
            <input
                type="file"
                ref={detailFileInputRef}
                accept="image/*"
                onChange={(e) => onSelectFileToCrop(e, selectedMember?.code, selectedMember, false)}
                className="hidden"
            />

            {/* ── Banner / Header Mahasiswa Kelas ── */}
            <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="relative p-6 sm:p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-sm">
                                <Icon name="users" className="w-3.5 h-3.5 text-blue-400" />
                                Direktori Resmi Mahasiswa Kelas SI
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                Anggota & Mahasiswa Kelas
                            </h1>
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                                Daftar seluruh mahasiswa Sistem Informasi Semester 3 Angkatan 2025/2026. 
                                Setiap mahasiswa dapat mengunggah foto profil sendiri dan melihat progres serta informasi perkuliahan.
                            </p>

                            {/* Stat Counter Ringkas */}
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-bold">
                                        <Icon name="graduation-cap" className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <span className="font-extrabold text-slate-900 text-lg leading-none">{memberList.length}</span>
                                        <span className="text-slate-500 text-xs ml-1">Total Mahasiswa</span>
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-slate-200 hidden sm:block" />
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                                        <Icon name="user" className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <span className="font-extrabold text-blue-700 text-lg leading-none">{countL}</span>
                                        <span className="text-slate-500 text-xs ml-1">Laki-laki</span>
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-slate-200 hidden sm:block" />
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                                        <Icon name="user" className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <span className="font-extrabold text-rose-700 text-lg leading-none">{countP}</span>
                                        <span className="text-slate-500 text-xs ml-1">Perempuan</span>
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-slate-200 hidden sm:block" />
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                        <Icon name="camera" className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <span className="font-extrabold text-emerald-700 text-lg leading-none">{countWithPhoto}</span>
                                        <span className="text-slate-500 text-xs ml-1">Foto Terpasang</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi Tambah Mahasiswa (Admin) */}
                        <div className="flex items-center gap-3 shrink-0">
                            {isAdmin && (
                                <button
                                    onClick={openAdd}
                                    className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition shadow-md hover:shadow-lg"
                                >
                                    <Icon name="user-plus" className="w-4 h-4" /> Tambah Mahasiswa
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KARTU PROFIL MAHASISWA LOGIN (Unggah Foto Mandiri & Info Penting) ── */}
            {isCurrentStudent && currentStudentData && (
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden border border-slate-700/50">
                    {/* Decorative glowing circles */}
                    <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Avatar & Identitas */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5">
                            {/* Avatar dengan tombol upload langsung */}
                            <div className="relative group shrink-0">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/20 shadow-2xl flex items-center justify-center">
                                    {currentStudentData.photo ? (
                                        <img
                                            src={currentStudentData.photo}
                                            alt={currentStudentData.fullname}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className={`w-full h-full flex flex-col items-center justify-center font-extrabold text-3xl ${
                                            currentStudentData.gender === 'P'
                                                ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white'
                                                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                                        }`}>
                                            <span>{currentStudentData.fullname.charAt(0)}</span>
                                            <span className="text-[10px] font-semibold opacity-75 mt-0.5">Belum Ada Foto</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tombol cepat ganti foto pada avatar */}
                                <button
                                    type="button"
                                    onClick={() => selfFileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition transform hover:scale-105 flex items-center justify-center border-2 border-slate-900"
                                    title="Unggah Foto Profil Saya"
                                >
                                    <Icon name="camera" className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Teks Identitas */}
                            <div className="text-center sm:text-left space-y-1.5">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
                                        Akun Saya
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Mahasiswa Aktif
                                    </span>
                                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/90">
                                        25SI{currentStudentCode}
                                    </span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                    {currentStudentData.fullname}
                                </h2>

                                <p className="text-xs sm:text-sm text-slate-300">
                                    S1 Sistem Informasi · Semester 3 (2025/2026) · Kelas SI-A Reguler
                                </p>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => selfFileInputRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-md"
                                    >
                                        <Icon name="upload" className="w-3.5 h-3.5" />
                                        {currentStudentData.photo ? 'Ganti Foto Profil' : 'Unggah Foto Profil Saya'}
                                    </button>

                                    {currentStudentData.photo && (
                                        <button
                                            type="button"
                                            onClick={handleSelfPhotoDelete}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-red-500/30 text-white/80 hover:text-red-300 rounded-xl text-xs font-medium transition border border-white/10"
                                        >
                                            <Icon name="trash-2" className="w-3.5 h-3.5" />
                                            Hapus Foto
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setSelectedMember({
                                            code: currentStudentCode,
                                            nim: `25SI${currentStudentCode}`,
                                            fullname: currentStudentData.fullname,
                                            gender: currentStudentData.gender || 'L',
                                            photo: currentStudentData.photo || null,
                                        })}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/10"
                                    >
                                        <Icon name="info" className="w-3.5 h-3.5" />
                                        Lihat Info Lengkap Saya
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Ringkasan Tugas & Akademik Saya */}
                        {selfStats && (
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between max-w-xs w-full">
                                <div>
                                    <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                                        <span className="font-semibold flex items-center gap-1.5 text-white">
                                            <Icon name="clipboard-check" className="w-4 h-4 text-emerald-400" />
                                            Progres Tugas Saya
                                        </span>
                                        <span className="font-bold text-emerald-400">{selfStats.percentage}%</span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden mb-3">
                                        <div
                                            className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${selfStats.percentage}%` }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                        <div className="p-2 bg-white/10 rounded-xl">
                                            <span className="text-white font-extrabold text-sm block">{selfStats.completed}</span>
                                            <span className="text-[10px] text-slate-300">Tugas Selesai</span>
                                        </div>
                                        <div className="p-2 bg-white/10 rounded-xl">
                                            <span className="text-white font-extrabold text-sm block">{selfStats.pending}</span>
                                            <span className="text-[10px] text-slate-300">Menunggu</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[11px] text-slate-300 text-center mt-3 pt-2.5 border-t border-white/10">
                                    {selfStats.pending === 0
                                        ? '🎉 Hebat! Semua tugas kelas sudah Anda kumpulkan.'
                                        : `Terdapat ${selfStats.pending} tugas aktif yang perlu diselesaikan.`}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Search & Filter Bar ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari mahasiswa berdasarkan nama lengkap atau NIM..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 text-sm bg-slate-50"
                        />
                    </div>

                    {/* Filter Dropdowns & Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filter Gender */}
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs">
                            {[
                                { id: 'Semua', label: `Semua (${memberList.length})` },
                                { id: 'L', label: `Laki-laki (${countL})` },
                                { id: 'P', label: `Perempuan (${countP})` },
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => setGenderFilter(btn.id)}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                                        genderFilter === btn.id
                                            ? 'bg-white text-slate-900 font-bold shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        {/* Filter Status Foto */}
                        <select
                            value={photoFilter}
                            onChange={e => setPhotoFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-xs font-medium bg-white text-slate-700"
                        >
                            <option value="Semua">Semua Foto</option>
                            <option value="dengan_foto">Sudah Pasang Foto ({countWithPhoto})</option>
                            <option value="tanpa_foto">Belum Ada Foto ({memberList.length - countWithPhoto})</option>
                        </select>
                    </div>
                </div>

                {/* Sub info filter */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>
                        Menampilkan <strong className="text-slate-900">{filtered.length}</strong> dari <strong className="text-slate-900">{memberList.length}</strong> mahasiswa
                    </span>
                    {(search || genderFilter !== 'Semua' || photoFilter !== 'Semua') && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setGenderFilter('Semua');
                                setPhotoFilter('Semua');
                            }}
                            className="text-blue-600 hover:underline font-semibold"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>
            </div>

            {/* ── Grid Mahasiswa ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filtered.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 text-center py-16 px-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                            <Icon name="users" className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">Mahasiswa tidak ditemukan</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Tidak ada data mahasiswa yang cocok dengan kriteria pencarian Anda.
                        </p>
                        {isAdmin && (
                            <button
                                onClick={openAdd}
                                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                            >
                                <Icon name="plus" className="w-3.5 h-3.5" /> Tambah Mahasiswa Baru
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(member => {
                        const isSelf = currentUser?.nim === member.nim;
                        const memberStats = getStudentAssignmentStats(member.nim);

                        return (
                            <div
                                key={member.code}
                                onClick={() => setSelectedMember(member)}
                                className={`bg-white rounded-2xl border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative hover:shadow-lg ${
                                    isSelf
                                        ? 'border-blue-400 ring-2 ring-blue-100 bg-gradient-to-b from-blue-50/20 to-white'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    {/* Top Bar: NIM & Badges */}
                                    <div className="flex items-start justify-between gap-2 mb-3.5">
                                        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                            {member.nim}
                                        </span>

                                        <div className="flex items-center gap-1">
                                            {isSelf && (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold flex items-center gap-1 border border-blue-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                                    Anda
                                                </span>
                                            )}

                                            {/* Admin Action Menu */}
                                            {isAdmin && (
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                                                    <button
                                                        onClick={(e) => openEdit(e, member.code, member)}
                                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                        title="Edit Mahasiswa"
                                                    >
                                                        <Icon name="pencil" className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmDeleteCode(member.code);
                                                        }}
                                                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                        title="Hapus Mahasiswa"
                                                    >
                                                        <Icon name="trash-2" className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Avatar & Identitas */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="relative shrink-0">
                                            {member.photo ? (
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                                    <img
                                                        src={member.photo}
                                                        alt={member.fullname}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ) : (
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm ${
                                                    member.gender === 'P'
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {member.fullname.charAt(0)}
                                                </div>
                                            )}

                                            {/* Tombol cepat unggah foto jika ini diri sendiri */}
                                            {isSelf && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        selfFileInputRef.current?.click();
                                                    }}
                                                    className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow transition"
                                                    title="Ganti Foto Profil Anda"
                                                >
                                                    <Icon name="camera" className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition truncate leading-snug">
                                                {member.fullname}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${member.gender === 'P' ? 'bg-rose-400' : 'bg-blue-400'}`} />
                                                {member.gender === 'P' ? 'Mahasiswi' : 'Mahasiswa'} · #{member.code}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Informasi Ringkas Tugas */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-400 font-medium flex items-center gap-1">
                                                <Icon name="check-circle-2" className="w-3 h-3 text-slate-400" />
                                                Tugas Kuliah
                                            </span>
                                            <span className="font-semibold text-slate-700">
                                                {memberStats.completed} / {memberStats.total} Selesai
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    memberStats.percentage === 100
                                                        ? 'bg-emerald-500'
                                                        : memberStats.percentage > 0
                                                            ? 'bg-blue-500'
                                                            : 'bg-slate-300'
                                                }`}
                                                style={{ width: `${memberStats.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Card */}
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Aktif
                                    </span>
                                    <span className="text-slate-400 group-hover:text-slate-800 font-semibold transition flex items-center gap-0.5">
                                        Lihat Detail <Icon name="chevron-right" className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── MODAL: DETAIL MAHASISWA & INFORMASI LENGKAP ── */}
            {selectedMember && (() => {
                const isSelectedSelf = currentUser?.nim === selectedMember.nim;
                const canEditPhoto = isAdmin || isSelectedSelf;
                const stats = getStudentAssignmentStats(selectedMember.nim);

                return (
                    <Modal
                        title="Profil & Informasi Mahasiswa"
                        onClose={() => {
                            setSelectedMember(null);
                            setDetailTab('akademik');
                        }}
                    >
                        <div className="space-y-6">
                            {/* Header Profil Mahasiswa */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="relative shrink-0">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md border-2 border-white ring-2 ring-slate-200 bg-white">
                                        {selectedMember.photo ? (
                                            <img
                                                src={selectedMember.photo}
                                                alt={selectedMember.fullname}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center text-3xl font-extrabold ${
                                                selectedMember.gender === 'P'
                                                    ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white'
                                                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                                            }`}>
                                                {selectedMember.fullname.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tombol aksi unggah foto di modal */}
                                    {canEditPhoto && (
                                        <button
                                            type="button"
                                            onClick={() => detailFileInputRef.current?.click()}
                                            className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white shadow-lg transition"
                                            title="Unggah / Ganti Foto Profil"
                                        >
                                            <Icon name="camera" className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="text-center sm:text-left flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-200/80 text-slate-800">
                                            {selectedMember.nim}
                                        </span>
                                        <span className="text-xs px-2.5 py-0.5 rounded-lg font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                            Mahasiswa Aktif
                                        </span>
                                        {isSelectedSelf && (
                                            <span className="text-xs px-2.5 py-0.5 rounded-lg font-bold bg-blue-100 text-blue-800">
                                                Akun Anda
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                                        {selectedMember.fullname}
                                    </h3>

                                    <p className="text-xs text-slate-500 mt-1">
                                        Program Studi S1 Sistem Informasi · Semester 3
                                    </p>

                                    {/* Quick Actions untuk Foto Profil */}
                                    {canEditPhoto && (
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 pt-2 border-t border-slate-200/80">
                                            <button
                                                type="button"
                                                onClick={() => detailFileInputRef.current?.click()}
                                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                                            >
                                                <Icon name="upload" className="w-3 h-3" />
                                                {selectedMember.photo ? 'Ganti Foto' : 'Unggah Foto Profil'}
                                            </button>

                                            {selectedMember.photo && (
                                                <button
                                                    type="button"
                                                    onClick={handleDetailPhotoDelete}
                                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition border border-red-200 flex items-center gap-1"
                                                >
                                                    <Icon name="trash-2" className="w-3 h-3" />
                                                    Hapus Foto
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tabs Navigasi Modal Detail */}
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                {[
                                    { id: 'akademik', label: 'Data Akademik', icon: 'graduation-cap' },
                                    { id: 'tugas', label: `Progres Tugas (${stats.completed}/${stats.total})`, icon: 'clipboard-list' },
                                    { id: 'matkul', label: 'Mata Kuliah', icon: 'book-open' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setDetailTab(tab.id)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                                            detailTab === tab.id
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        <Icon name={tab.icon} className="w-3.5 h-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* TAB 1: DATA AKADEMIK */}
                            {detailTab === 'akademik' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                                                Nomor Induk Mahasiswa
                                            </span>
                                            <span className="font-mono font-bold text-slate-900 text-sm">{selectedMember.nim}</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                                                Jenis Kelamin
                                            </span>
                                            <span className="font-bold text-slate-900 text-sm">
                                                {selectedMember.gender === 'P' ? 'Perempuan (Mahasiswi)' : 'Laki-laki (Mahasiswa)'}
                                            </span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                                                Program Studi
                                            </span>
                                            <span className="font-bold text-slate-900">S1 Sistem Informasi</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                                                Jenjang & Semester
                                            </span>
                                            <span className="font-bold text-slate-900">Semester 3 · S1 Reguler</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                                                Tahun Akademik
                                            </span>
                                            <span className="font-bold text-slate-900">2025/2026</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                                                Beban Studi Semester 3
                                            </span>
                                            <span className="font-bold text-slate-900">22 SKS (8 Mata Kuliah)</span>
                                        </div>
                                    </div>

                                    {/* Kredensial Login default */}
                                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <Icon name="key" className="w-3.5 h-3.5 text-blue-600" />
                                            Informasi Akun Mahasiswa
                                        </div>
                                        <p className="text-[11px] text-blue-800 leading-relaxed">
                                            Akun mahasiswa ini digunakan untuk mengakses materi, melihat informasi akademik, dan mengumpulkan tugas kelas.
                                            Username default: <strong className="font-mono">{selectedMember.nim}</strong>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: PROGRES & PENGUMPULAN TUGAS */}
                            {detailTab === 'tugas' && (
                                <div className="space-y-4 animate-fade-in">
                                    {/* Summary Card */}
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Status Kelengkapan Tugas</span>
                                            <span className="text-[11px] text-slate-500">
                                                {stats.completed} dari {stats.total} tugas kuliah aktif telah dikumpulkan
                                            </span>
                                        </div>
                                        <span className="text-base font-extrabold text-slate-900 px-3 py-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                                            {stats.percentage}%
                                        </span>
                                    </div>

                                    {/* List Tugas & Submisi */}
                                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                        {assignments.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-6">Belum ada tugas kuliah yang aktif.</p>
                                        ) : (
                                            assignments.map(ass => {
                                                const sub = submissions.find(s => s.assignmentId === ass.id && s.nim === selectedMember.nim);
                                                const isSubmitted = Boolean(sub);

                                                return (
                                                    <div
                                                        key={ass.id}
                                                        className={`p-3 rounded-xl border transition ${
                                                            isSubmitted
                                                                ? 'bg-emerald-50/50 border-emerald-200'
                                                                : 'bg-white border-slate-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <span className="text-[10px] font-semibold text-slate-500 block truncate">
                                                                    {ass.course} · Deadline: {ass.deadline}
                                                                </span>
                                                                <h4 className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-1">
                                                                    {ass.title}
                                                                </h4>
                                                            </div>
                                                            {isSubmitted ? (
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 flex items-center gap-1">
                                                                    <Icon name="check" className="w-3 h-3" /> Dikumpulkan
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                                                                    Belum Kumpul
                                                                </span>
                                                            )}
                                                        </div>

                                                        {isSubmitted && (
                                                            <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900 flex items-center justify-between">
                                                                <span className="truncate">
                                                                    Catatan: {sub.note || 'Tugas telah dikumpulkan via link.'}
                                                                </span>
                                                                {sub.link && (
                                                                    <a
                                                                        href={sub.link}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="font-semibold underline ml-2 shrink-0 flex items-center gap-0.5"
                                                                    >
                                                                        Buka <Icon name="external-link" className="w-3 h-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: MATA KULIAH SEMESTER 3 */}
                            {detailTab === 'matkul' && (
                                <div className="space-y-3 animate-fade-in max-h-72 overflow-y-auto pr-1">
                                    <p className="text-xs text-slate-500">
                                        Mata kuliah yang diambil oleh mahasiswa kelas SI pada Semester 3:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {(courses.length > 0 ? courses : [
                                            { id: 1, name: 'UI/UX Design', credits: 4, lecturer: 'Zumratul Muaihidin, M.Kom' },
                                            { id: 2, name: 'Manajemen Database', credits: 3, lecturer: 'Salman, S.ST., M.TI' },
                                            { id: 3, name: 'Agama', credits: 2, lecturer: 'Agus Marjan Saputra, SEI.,MSEI' },
                                            { id: 4, name: 'E-Business', credits: 3, lecturer: 'Zulpan Hadi, M.Kom.' },
                                            { id: 5, name: 'Technopreneurship 1', credits: 2, lecturer: 'Dr. Dwinita Arwidiyanti, M.Kom.' },
                                            { id: 6, name: 'Teknologi Web', credits: 3, lecturer: 'Dr. Muhammad Multazam, S.Kom., M.Kom' },
                                            { id: 7, name: 'Pemrograman Berorientasi Objek', credits: 3, lecturer: 'Dr. Maspaeni, M. Kom' },
                                            { id: 8, name: 'Sistem Operasi', credits: 3, lecturer: 'Ahmad Yani, S.Kom., M.Kom' },
                                        ]).map(c => (
                                            <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <h5 className="font-bold text-slate-900 truncate">{c.name}</h5>
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                                        {c.credits} SKS
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 truncate">{c.lecturer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tombol Tutup */}
                            <button
                                onClick={() => {
                                    setSelectedMember(null);
                                    setDetailTab('akademik');
                                }}
                                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                            >
                                Tutup Informasi Mahasiswa
                            </button>
                        </div>
                    </Modal>
                );
            })()}

            {/* ── MODAL: TAMBAH / EDIT MAHASISWA (ADMIN) ── */}
            {modalMode && (
                <Modal
                    title={modalMode === 'add' ? 'Tambah Mahasiswa Baru' : 'Edit Data Mahasiswa'}
                    onClose={() => setModalMode(null)}
                >
                    <div className="space-y-4">
                        {/* Foto Profil Mahasiswa */}
                        <FormField label="Foto Profil Mahasiswa (Opsional)">
                            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-inner">
                                    {form.photo ? (
                                        <img src={form.photo} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Icon name="user" className="w-7 h-7 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={(e) => onSelectFileToCrop(e, null, null, true)}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Icon name="upload" className="w-3.5 h-3.5 text-blue-600" />
                                            Pilih Foto Dari HP/Komputer
                                        </button>
                                        {form.photo && (
                                            <button
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, photo: '' }))}
                                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition border border-red-200 flex items-center gap-1"
                                            >
                                                <Icon name="trash-2" className="w-3.5 h-3.5" /> Hapus
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Atau tempel link URL foto (https://...)"
                                        value={form.photo.startsWith('data:') ? '(Foto lokal berhasil dikompres)' : form.photo}
                                        onChange={e => setForm(f => ({ ...f, photo: e.target.value }))}
                                        disabled={form.photo.startsWith('data:')}
                                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                                    />
                                </div>
                            </div>
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="3 Digit Kode NIM" required>
                                <div className="flex items-center">
                                    <span className="px-3 py-2.5 rounded-l-xl bg-slate-100 border border-r-0 border-slate-200 text-xs font-mono font-bold text-slate-600">
                                        25SI
                                    </span>
                                    <input
                                        className={`${inputCls} rounded-l-none font-mono font-bold`}
                                        maxLength={3}
                                        value={form.code}
                                        onChange={e => setForm(f => ({ ...f, code: e.target.value.replace(/\D/g, '') }))}
                                        placeholder="023"
                                    />
                                </div>
                            </FormField>

                            <FormField label="Jenis Kelamin">
                                <select
                                    className={selectCls}
                                    value={form.gender}
                                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                                >
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </FormField>
                        </div>

                        <FormField label="Nama Lengkap Mahasiswa" required>
                            <input
                                className={inputCls}
                                value={form.fullname}
                                onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))}
                                placeholder="cth: Budi Santoso"
                            />
                        </FormField>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                            <p className="font-semibold text-slate-800">Akun Login Otomatis Dibuat:</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                                Username & Password: <strong>25SI{form.code.padStart(3, '0')}</strong>
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setModalMode(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition"
                            >
                                {modalMode === 'add' ? 'Simpan Mahasiswa' : 'Perbarui Data'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── DIALOG KONFIRMASI HAPUS ── */}
            {confirmDeleteCode && (
                <ConfirmDialog
                    message={`Mahasiswa "${members[confirmDeleteCode]?.fullname}" (25SI${confirmDeleteCode}) akan dihapus dari daftar anggota kelas.`}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteCode(null)}
                />
            )}

            {/* ── MODAL PENYESUAIAN & PEMOTONGAN FOTO PROFIL (CROPPER) ── */}
            <ImageCropperModal
                isOpen={cropperState.isOpen}
                imageSrc={cropperState.imageSrc}
                onCropComplete={handleCroppedComplete}
                onCancel={() => setCropperState({ isOpen: false, imageSrc: '', targetCode: null, targetData: null, isFormEdit: false })}
                title="Sesuaikan & Potong Foto Profil"
            />
        </div>
    );
}
