import React, { useEffect } from "react";
import Icon from "./Icons";

export default function Toast({ message, type, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium flex items-center gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
        type === "error"
          ? "bg-red-50 border-red-200 text-red-800"
          : "bg-slate-900 border-slate-800 text-white"
      }`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="opacity-70 hover:opacity-100 transition ml-1"
        title="Tutup"
      >
        <Icon name="x" className="w-4 h-4" />
      </button>
    </div>
  );
}
