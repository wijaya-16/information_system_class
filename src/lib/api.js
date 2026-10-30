// src/lib/api.js
// Client API layer: Menghubungkan React Frontend langsung ke Supabase Cloud (PostgreSQL)
// Dilengkapi fallback offline otomatis ke localStorage di handphone pengguna.

import { supabase, isSupabaseConfigured } from './supabase';

// Helper URL untuk berkas / file
export function getFileUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    // Jika path berupa nama file di Supabase Storage
    if (isSupabaseConfigured && supabase) {
        const { data } = supabase.storage.from('uploads').getPublicUrl(path);
        if (data?.publicUrl) return data.publicUrl;
    }
    return path;
}

// ─── 1. Health Check Koneksi Supabase ─────────────────────────────────────────
export async function checkServerHealth() {
    if (!isSupabaseConfigured || !supabase) {
        return { status: 'offline', database: 'disconnected', reason: 'Supabase URL/Key belum diisi di .env' };
    }
    try {
        const { error } = await supabase.from('courses').select('id').limit(1);
        if (error) throw error;
        return { status: 'ok', database: 'connected' };
    } catch (err) {
        return { status: 'offline', database: 'disconnected', error: err.message };
    }
}

// ─── 2. Fetch Seluruh Data dari Supabase Cloud ────────────────────────────────
export async function fetchAllData() {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
        const [
            coursesRes,
            materialsRes,
            assignmentsRes,
            announcementsRes,
            eventsRes,
            photosRes,
            membersRes,
            submissionsRes,
        ] = await Promise.all([
            supabase.from('courses').select('*').order('id', { ascending: true }),
            supabase.from('materials').select('*').order('id', { ascending: false }),
            supabase.from('assignments').select('*').order('id', { ascending: false }),
            supabase.from('announcements').select('*').order('id', { ascending: false }),
            supabase.from('events').select('*').order('id', { ascending: true }),
            supabase.from('class_photos').select('*').order('id', { ascending: false }),
            supabase.from('members').select('*').order('code', { ascending: true }),
            supabase.from('submissions').select('*').order('id', { ascending: false }),
        ]);

        if (coursesRes.error) throw coursesRes.error;

        // Normalisasi format members ke format map { code: { fullname, gender, photo } }
        const membersMap = {};
        (membersRes.data || []).forEach(m => {
            membersMap[m.code] = {
                fullname: m.fullname,
                gender:   m.gender,
                photo:    m.photo || null,
            };
        });

        // Normalisasi format foto kelas (is_hero -> isHero)
        const normalizedPhotos = (photosRes.data || []).map(p => ({
            id:       Number(p.id),
            url:      p.url,
            title:    p.title,
            caption:  p.caption,
            date:     p.date,
            isHero:   Boolean(p.is_hero),
            category: p.category,
        }));

        // Normalisasi format pengumpulan tugas
        const normalizedSubmissions = (submissionsRes.data || []).map(s => ({
            id:           Number(s.id),
            assignmentId: Number(s.assignment_id || s.assignmentId),
            nim:          s.nim,
            studentName:  s.student_name || s.studentName,
            note:         s.note,
            link:         s.link,
            fileUrl:      s.file_url || s.fileUrl,
            submittedAt:  s.submitted_at || s.submittedAt,
        }));

        return {
            courses:       (coursesRes.data || []).map(c => ({ ...c, id: Number(c.id) })),
            materials:     (materialsRes.data || []).map(m => ({ ...m, id: Number(m.id) })),
            assignments:   (assignmentsRes.data || []).map(a => ({ ...a, id: Number(a.id) })),
            announcements: (announcementsRes.data || []).map(an => ({ ...an, id: Number(an.id) })),
            events:        eventsRes.data || [],
            classPhotos:   normalizedPhotos,
            members:       membersMap,
            submissions:   normalizedSubmissions,
        };
    } catch (err) {
        console.warn('[Supabase API] Gagal memuat data cloud:', err.message);
        throw err;
    }
}

// ─── 3. Upload Berkas ke Supabase Storage (atau konversi data URL) ─────────────
export async function uploadFile(file) {
    if (!file) throw new Error('Berkas tidak ditemukan');

    // Jika Supabase aktif, coba upload ke bucket storage 'uploads'
    if (isSupabaseConfigured && supabase) {
        try {
            const ext = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
            const { error: uploadErr } = await supabase.storage.from('uploads').upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

            if (!uploadErr) {
                const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
                return { success: true, url: data.publicUrl };
            }
        } catch (e) {
            console.warn('[Supabase Storage] Upload error, beralih ke pembacaan lokal:', e);
        }
    }

    // Fallback otomatis: baca file secara lokal sebagai Data URL agar tetap tersimpan
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ success: true, url: e.target.result });
        reader.onerror = () => reject(new Error('Gagal membaca berkas'));
        reader.readAsDataURL(file);
    });
}

// ─── 4. Layanan CRUD Supabase ────────────────────────────────────────────────
export const api = {
    courses: {
        add: async (data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            const { error } = await supabase.from('courses').insert([{
                id: data.id,
                name: data.name,
                lecturer: data.lecturer,
                credits: data.credits || 3,
                category: data.category,
                color: data.color,
            }]);
            if (error) throw error;
            return data;
        },
        update: async (id, data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            const { error } = await supabase.from('courses').update({
                name: data.name,
                lecturer: data.lecturer,
                credits: data.credits,
                category: data.category,
                color: data.color,
            }).eq('id', id);
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            if (!isSupabaseConfigured || !supabase) return true;
            const { error } = await supabase.from('courses').delete().eq('id', id);
            if (error) throw error;
            return true;
        },
    },

    materials: {
        add: async (data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            const { error } = await supabase.from('materials').insert([{
                id: data.id,
                title: data.title,
                course: data.course,
                type: data.type || 'PDF',
                size: data.size || '2.5MB',
                date: data.date,
                semester: data.semester || 'Semester 3',
                lecturer: data.lecturer,
                description: data.description,
                file_url: data.file_url || null,
            }]);
            if (error) throw error;
            return data;
        },
        update: async (id, data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            const { error } = await supabase.from('materials').update({
                title: data.title,
                course: data.course,
                type: data.type,
                size: data.size,
                date: data.date,
                semester: data.semester,
                lecturer: data.lecturer,
                description: data.description,
                file_url: data.file_url,
            }).eq('id', id);
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            if (!isSupabaseConfigured || !supabase) return true;
            const { error } = await supabase.from('materials').delete().eq('id', id);
            if (error) throw error;
            return true;
        },
    },

    assignments: {
        add: async (data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            const { error } = await supabase.from('assignments').insert([{
                id: data.id,
                title: data.title,
                course: data.course,
                description: data.description,
                lecturer: data.lecturer,
                deadline: data.deadline,
                status: data.status || 'Aktif',
            }]);
            if (error) throw error;
            return data;
        },
        update: async (id, data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            const { error } = await supabase.from('assignments').update({
                title: data.title,
                course: data.course,
                description: data.description,
                lecturer: data.lecturer,
                deadline: data.deadline,
                status: data.status,
            }).eq('id', id);
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            if (!isSupabaseConfigured || !supabase) return true;
            const { error } = await supabase.from('assignments').delete().eq('id', id);
            if (error) throw error;
            return true;
        },
    },

    announcements: {
        add: async (data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            const { error } = await supabase.from('announcements').insert([{
                id: data.id,
                title: data.title,
                category: data.category || 'Akademik',
                course: data.course,
                date: data.date,
                author: data.author || 'Administrator Kelas',
                important: Boolean(data.important),
                content: data.content,
            }]);
            if (error) throw error;
            return data;
        },
        update: async (id, data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            const { error } = await supabase.from('announcements').update({
                title: data.title,
                category: data.category,
                course: data.course,
                date: data.date,
                author: data.author,
                important: Boolean(data.important),
                content: data.content,
            }).eq('id', id);
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            if (!isSupabaseConfigured || !supabase) return true;
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;
            return true;
        },
    },

    photos: {
        add: async (data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            if (data.isHero) {
                await supabase.from('class_photos').update({ is_hero: false }).eq('is_hero', true);
            }
            const { error } = await supabase.from('class_photos').insert([{
                id: data.id,
                url: data.url,
                title: data.title,
                caption: data.caption,
                date: data.date,
                is_hero: Boolean(data.isHero),
                category: data.category || 'Praktikum & Perkuliahan',
            }]);
            if (error) throw error;
            return data;
        },
        update: async (id, data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            if (data.isHero) {
                await supabase.from('class_photos').update({ is_hero: false }).neq('id', id);
            }
            const { error } = await supabase.from('class_photos').update({
                url: data.url,
                title: data.title,
                caption: data.caption,
                date: data.date,
                is_hero: Boolean(data.isHero),
                category: data.category,
            }).eq('id', id);
            if (error) throw error;
            return data;
        },
        setHero: async (id) => {
            if (!isSupabaseConfigured || !supabase) return true;
            await supabase.from('class_photos').update({ is_hero: false }).neq('id', 0);
            const { error } = await supabase.from('class_photos').update({ is_hero: true }).eq('id', id);
            if (error) throw error;
            return true;
        },
        delete: async (id) => {
            if (!isSupabaseConfigured || !supabase) return true;
            const { error } = await supabase.from('class_photos').delete().eq('id', id);
            if (error) throw error;
            return true;
        },
    },

    members: {
        add: async (code, data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            const { error } = await supabase.from('members').upsert([{
                code,
                fullname: data.fullname,
                gender: data.gender || 'L',
                photo: data.photo || null,
            }]);
            if (error) throw error;
            return data;
        },
        update: async (oldCode, newCode, data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            if (oldCode !== newCode) {
                await supabase.from('members').delete().eq('code', oldCode);
            }
            const { error } = await supabase.from('members').upsert([{
                code: newCode,
                fullname: data.fullname,
                gender: data.gender || 'L',
                photo: data.photo || null,
            }]);
            if (error) throw error;
            return data;
        },
        delete: async (code) => {
            if (!isSupabaseConfigured || !supabase) return true;
            const { error } = await supabase.from('members').delete().eq('code', code);
            if (error) throw error;
            return true;
        },
    },

    submissions: {
        add: async (data) => {
            if (!isSupabaseConfigured || !supabase) return data;
            // Hapus pengumpulan sebelumnya oleh mahasiswa yang sama jika ada
            await supabase.from('submissions')
                .delete()
                .eq('assignment_id', data.assignmentId)
                .eq('nim', data.nim);

            const { error } = await supabase.from('submissions').insert([{
                id: data.id,
                assignment_id: data.assignmentId,
                nim: data.nim,
                student_name: data.studentName,
                note: data.note,
                link: data.link,
                file_url: data.fileUrl || null,
                submitted_at: data.submittedAt,
            }]);
            if (error) throw error;
            return data;
        },
    },
};
