import React from 'react';
import Icon from './Icons';

export default function BottomNavigation({ activePage, navigateTo }) {
    const items = [
        { id: 'beranda', label: 'Beranda', icon: 'home' },
        { id: 'matkul', label: 'Matkul', icon: 'library' },
        { id: 'materi', label: 'Materi', icon: 'book-open' },
        { id: 'tugas', label: 'Tugas', icon: 'check-square' },
        { id: 'pengumuman', label: 'Info', icon: 'bell' },
    ];

    return (
        <nav className="md:hidden backdrop-blur-xl bg-slate-950/85 border-t border-white/10 sticky bottom-0 z-40 flex justify-around py-2.5 px-2 shadow-2xl">
            {items.map(item => {
                const isActive = activePage === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => navigateTo(item.id)}
                        className={`flex flex-col items-center py-1 px-3 rounded-xl text-xs font-semibold transition-all relative ${
                            isActive
                                ? 'text-white font-bold scale-105'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {isActive && (
                            <span className="absolute -top-1 w-6 h-1 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-sm" />
                        )}
                        <Icon name={item.icon} className={`w-5 h-5 mb-1 ${isActive ? 'text-cyan-400' : ''}`} />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
