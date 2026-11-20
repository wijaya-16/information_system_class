import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitcher({ compact = false }) {
  const { theme, setTheme, themes, currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      {compact ? (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="theme-switcher-btn p-2 rounded-xl transition-all duration-200 flex items-center justify-center text-xs font-semibold shadow-xs"
          title={`Ubah Tema (${currentTheme.name})`}
          aria-label="Ubah Tema Tampilan"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-sm animate-pulse"
              style={{ backgroundColor: currentTheme.accentColor }}
            />
            <Icon name={currentTheme.icon} className="w-4 h-4 theme-icon" />
          </div>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="theme-switcher-btn group flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 text-xs font-semibold shadow-xs"
        >
          {/* Swatch Dot */}
          <div className="flex items-center -space-x-1">
            {currentTheme.swatches.slice(2, 4).map((c, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full ring-1 ring-black/30 shadow-xs"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <Icon
            name={currentTheme.icon}
            className="w-3.5 h-3.5 theme-icon group-hover:rotate-12 transition-transform"
          />

          <span className="font-medium hidden sm:inline theme-name">
            {currentTheme.name}
          </span>

          <Icon
            name="chevron-down"
            className={`w-3 h-3 theme-chevron transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl p-2.5 shadow-2xl z-50 backdrop-blur-2xl border border-white/15 bg-slate-950/95 animate-scale-in"
          style={{ animationDuration: '180ms' }}
        >
          {/* Header Menu */}
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-400 text-white flex items-center justify-center">
                <Icon name="palette" className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                Tema Website
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
              5 Tema Populer
            </span>
          </div>

          {/* Theme List */}
          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-0.5 scrollbar-thin">
            {themes.map((t) => {
              const isActive = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 flex items-start gap-3 relative group ${
                    isActive
                      ? 'bg-white/12 border border-white/20 shadow-md ring-1 ring-white/15'
                      : 'hover:bg-white/6 border border-transparent hover:border-white/10'
                  }`}
                >
                  {/* Swatch Mini Box */}
                  <div
                    className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/20 p-1 flex flex-col justify-between shadow-inner"
                    style={{ backgroundColor: t.swatches[0] }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.accentColor }}
                      />
                      <Icon
                        name={t.icon}
                        className="w-3.5 h-3.5"
                        style={{ color: t.accentColor }}
                      />
                    </div>
                    <div className="flex gap-1">
                      {t.swatches.slice(1, 4).map((color, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-1.5 rounded-xs"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {t.name}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${t.badgeCls}`}
                      >
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 line-clamp-2 mt-0.5 leading-relaxed">
                      {t.desc}
                    </p>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 self-center text-slate-950 font-bold shadow-md animate-scale-in"
                      style={{ backgroundColor: t.accentColor }}
                    >
                      <Icon name="check" className="w-3 h-3 text-slate-950 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="pt-2 mt-1 border-t border-white/10 px-2 flex items-center justify-between text-[10px] text-white/50">
            <span>Tersimpan otomatis di browser</span>
            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              <Icon name="sparkles" className="w-3 h-3" /> Real-time
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
