import React from 'react';
import * as LucideIcons from 'lucide-react';

export default function Icon({ name, className = "w-5 h-5", ...props }) {
    // Mengubah nama ikon dari "graduation-cap" menjadi format PascalCase "GraduationCap"
    const pascalName = name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    const LucideIcon = LucideIcons[pascalName];

    if (!LucideIcon) {
        return <span className={className}>❓</span>;
    }

    return <LucideIcon className={className} {...props} />;
}