import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'midnight',
    name: 'Cyber Midnight',
    category: 'Paling Populer',
    desc: 'Tema gelap ultra-modern bergaya Linear & Vercel dengan aksen electric cyan dan obsidian glass.',
    icon: 'moon',
    accentColor: '#38bdf8',
    gradient: 'from-blue-600 via-cyan-500 to-indigo-600',
    badgeCls: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    swatches: ['#070a13', '#0f172a', '#38bdf8', '#818cf8'],
    isDark: true,
  },
  {
    id: 'aurora',
    name: 'Aurora Emerald',
    category: 'Neo Tech',
    desc: 'Tema tech modern bergaya Supabase dengan kilau hijau mint neon dan nuansa deep charcoal.',
    icon: 'sparkles',
    accentColor: '#10b981',
    gradient: 'from-emerald-600 via-teal-500 to-green-600',
    badgeCls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    swatches: ['#05130e', '#0b231a', '#10b981', '#34d399'],
    isDark: true,
  },
  {
    id: 'sunset',
    name: 'Sunset Nebula',
    category: 'Cyberpunk Aesthetic',
    desc: 'Tema futuristik penuh energi dengan pendaran neon rose, ungu kosmik, dan golden sunset.',
    icon: 'flame',
    accentColor: '#f43f5e',
    gradient: 'from-rose-600 via-purple-600 to-amber-500',
    badgeCls: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
    swatches: ['#0d0716', '#1a0d2e', '#f43f5e', '#a855f7'],
    isDark: true,
  },
  {
    id: 'sapphire',
    name: 'Sapphire Ocean',
    category: 'Academic Elite',
    desc: 'Tema prestise akademis bergaya portal universitas dunia dengan deep royal navy & ice sapphire.',
    icon: 'compass',
    accentColor: '#0284c7',
    gradient: 'from-blue-700 via-sky-500 to-amber-400',
    badgeCls: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    swatches: ['#060e1d', '#0c1b36', '#0284c7', '#38bdf8'],
    isDark: true,
  },
  {
    id: 'cupertino',
    name: 'Studio Cupertino',
    category: 'Minimalist Light',
    desc: 'Tema terang minimalis elegan bergaya Apple Studio dengan kontras ramah mata dan frosted glass bersih.',
    icon: 'sun',
    accentColor: '#2563eb',
    gradient: 'from-slate-900 to-blue-600',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    swatches: ['#e9eef5', '#f8fafc', '#2563eb', '#64748b'],
    isDark: false,
  },
];

const ThemeContext = createContext({
  theme: 'midnight',
  setTheme: () => {},
  themes: THEMES,
  currentTheme: THEMES[0],
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('si_theme');
      if (saved && THEMES.some(t => t.id === saved)) {
        return saved;
      }
    } catch {}
    return 'midnight'; // Default tema paling populer
  });

  const setTheme = (themeId) => {
    if (!THEMES.some(t => t.id === themeId)) return;
    setThemeState(themeId);
    try {
      localStorage.setItem('si_theme', themeId);
    } catch {}
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
