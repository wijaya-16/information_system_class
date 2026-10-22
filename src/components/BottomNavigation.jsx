import React from 'react';
import Icon from './Icons';

export default function BottomNavigation({activePage, navigateTo}){
    const items = [
        {id: 'beranda', label: 'Beranda', icon:'home'},
        {id: 'matkul', label: 'Matkul', icon:'library'},
        {id: 'materi', label: 'Materi', icon:'book-open'},
        {id: 'tugas', label: 'Tugas', icon:'check-square'},
        {id: 'pengumuman', label: 'Info', icon:'bell'},
    ];

    return(
        <nav className="md:hidden bg-white border-t border-slate-200 sticky bottom-0 z-40 flex justify-around py-2 px-1">
            {items.map(item => (
                <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition ${activePage === item.id ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Icon name={item.icon} className="w-5 h-5 mb-1" />
                    {item.label}
                </button>
            ))}
        </nav>
    )
}