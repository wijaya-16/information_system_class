import React, { useState, useRef, useEffect, useCallback } from 'react';
import Icon from './Icons';

/**
 * ImageCropperModal
 * Komponen modal untuk penyesuaian (zoom, pan/geser, rotasi, pemotongan 1:1)
 * sebelum foto profil diunggah ke database dan galeri.
 */
export default function ImageCropperModal({
    isOpen,
    imageSrc,
    onCropComplete,
    onCancel,
    title = 'Sesuaikan & Potong Foto Profil',
}) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageObj, setImageObj] = useState(null);

    const containerRef = useRef(null);
    const previewCanvasRef = useRef(null);

    // Ukuran frame pemotongan di layar (persegi 1:1)
    const CROP_SIZE = 280;

    // Load gambar saat imageSrc berubah
    useEffect(() => {
        if (!imageSrc) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImageObj(img);
            // Reset kontrol
            setZoom(1);
            setRotation(0);
            setPan({ x: 0, y: 0 });
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Menggambar preview ke canvas
    const drawPreview = useCallback(() => {
        const canvas = previewCanvasRef.current;
        if (!canvas || !imageObj) return;

        const ctx = canvas.getContext('2d');
        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;

        ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

        ctx.save();
        // Pindahkan ke tengah kanvas
        ctx.translate(CROP_SIZE / 2 + pan.x, CROP_SIZE / 2 + pan.y);
        ctx.rotate((rotation * Math.PI) / 180);

        // Skala gambar agar pas dengan CROP_SIZE secara proporsional
        const minDim = Math.min(imageObj.width, imageObj.height);
        const baseScale = CROP_SIZE / minDim;
        const scale = baseScale * zoom;

        const drawW = imageObj.width * scale;
        const drawH = imageObj.height * scale;

        ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
    }, [imageObj, zoom, rotation, pan]);

    useEffect(() => {
        drawPreview();
    }, [drawPreview]);

    // Handle Drag Mouse (Desktop)
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle Drag Touch (Mobile / HP)
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - pan.x,
                y: e.touches[0].clientY - pan.y,
            });
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        setPan({
            x: e.touches[0].clientX - dragStart.x,
            y: e.touches[0].clientY - dragStart.y,
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Rotasi 90 derajat searah jarum jam
    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    // Reset posisi dan zoom
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setPan({ x: 0, y: 0 });
    };

    // Potong dan ekspor gambar berkualitas tinggi
    const handleCropAndSave = () => {
        if (!imageObj) return;

        const OUTPUT_SIZE = 600; // Ukuran resolusi output foto profil
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = OUTPUT_SIZE;
        exportCanvas.height = OUTPUT_SIZE;
        const ctx = exportCanvas.getContext('2d');

        // Rasio ukuran layar vs ukuran ekspor
        const exportRatio = OUTPUT_SIZE / CROP_SIZE;

        ctx.save();
        ctx.translate(
            (CROP_SIZE / 2 + pan.x) * exportRatio,
            (CROP_SIZE / 2 + pan.y) * exportRatio
        );
        ctx.rotate((rotation * Math.PI) / 180);

        const minDim = Math.min(imageObj.width, imageObj.height);
        const baseScale = CROP_SIZE / minDim;
        const scale = baseScale * zoom * exportRatio;

        const drawW = imageObj.width * scale;
        const drawH = imageObj.height * scale;

        ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.88);
        onCropComplete(croppedDataUrl);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                            <Icon name="crop" className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                                {title}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                Geser dan sesuaikan posisi wajah / foto
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Area Canvas Pemotongan Interaktif */}
                <div className="p-5 flex flex-col items-center bg-slate-900 select-none">
                    <div
                        ref={containerRef}
                        className="relative rounded-2xl overflow-hidden shadow-inner cursor-grab active:cursor-grabbing border-2 border-white/30"
                        style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <canvas
                            ref={previewCanvasRef}
                            className="w-full h-full block bg-slate-950"
                        />

                        {/* Panduan Pemotongan: Garis Grid Rule of Thirds */}
                        <div className="absolute inset-0 pointer-events-none border border-white/20">
                            <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                                <div className="border-r border-b border-white" />
                                <div className="border-r border-b border-white" />
                                <div className="border-b border-white" />
                                <div className="border-r border-b border-white" />
                                <div className="border-r border-b border-white" />
                                <div className="border-b border-white" />
                                <div className="border-r border-white" />
                                <div className="border-r border-white" />
                                <div />
                            </div>
                        </div>

                        {/* Panduan Avatar Bulat */}
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/80 pointer-events-none shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />

                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm pointer-events-none">
                            Tahan & Geser Foto
                        </div>
                    </div>
                </div>

                {/* Panel Kontrol Penyesuaian */}
                <div className="p-4 sm:p-5 space-y-4 bg-white">
                    {/* Zoom Slider */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                            <span className="font-semibold flex items-center gap-1">
                                <Icon name="zoom-in" className="w-3.5 h-3.5 text-blue-600" />
                                Perbesar / Perkecil
                            </span>
                            <span className="font-mono text-slate-400">{Math.round(zoom * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="Perkecil"
                            >
                                <Icon name="minus" className="w-3.5 h-3.5" />
                            </button>
                            <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.05"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="flex-1 accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                            />
                            <button
                                type="button"
                                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="Perbesar"
                            >
                                <Icon name="plus" className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Tombol Aksi Alat (Rotasi & Reset) */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                            type="button"
                            onClick={handleRotate}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                            title="Putar 90 Derajat"
                        >
                            <Icon name="rotate-cw" className="w-3.5 h-3.5 text-slate-600" />
                            Putar 90°
                        </button>

                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition"
                            title="Kembalikan Posisi Awal"
                        >
                            <Icon name="refresh-cw" className="w-3.5 h-3.5" />
                            Reset Posisi
                        </button>
                    </div>

                    {/* Tombol Batal & Simpan */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleCropAndSave}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                        >
                            <Icon name="check" className="w-4 h-4" />
                            Terapkan & Simpan Foto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

