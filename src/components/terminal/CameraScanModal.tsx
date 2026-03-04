import React, { useRef, useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { Camera, X, RefreshCw } from 'lucide-react';

export default function CameraScanModal({ onScan, onClose }: { onScan: (barcode: string) => void, onClose: () => void }) {
    const isCameraEnabled = process.env.NEXT_PUBLIC_POS_CAMERA_VISION === 'true';
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const { showError } = useModal();

    useEffect(() => {
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsScanning(true);
                }
            } catch (err) {
                console.error(err);
                setIsScanning(false);
            }
        };

        if (isCameraEnabled) {
            startCamera();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }
        };
    }, [isCameraEnabled]);

    const handleMockScan = () => {
        // Mock scan handler for demonstration. E.g. barcode reader API call.
        const barcodes = ['111111', '869055', '334455', 'NO_BARCODE'];
        const random = barcodes[Math.floor(Math.random() * barcodes.length)];
        onScan(random);
    };

    if (!isCameraEnabled) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl relative border border-slate-200 dark:border-white/10 animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                        <Camera size={20} className="text-primary" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">Kamera Okuma Sistemi</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Video Area */}
                <div className="relative aspect-square bg-black overflow-hidden flex items-center justify-center">
                    {!isScanning ? (
                        <div className="text-white flex flex-col items-center opacity-50">
                            <RefreshCw size={32} className="animate-spin mb-4" />
                            <p className="text-sm">Kamera başlatılıyor...</p>
                        </div>
                    ) : (
                        <>
                            <video ref={videoRef} autoPlay playsInline muted className="min-w-full min-h-full object-cover scale-[1.05]" />
                            <div className="absolute inset-x-8 inset-y-8 border-2 border-primary/50 rounded-lg flex flex-col justify-between items-center py-4">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary/90 opacity-80" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary/90 opacity-80" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary/90 opacity-80" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary/90 opacity-80" />

                                <div className="w-full h-0.5 bg-red-500/50 animate-[scan_2s_ease-in-out_infinite]" />
                            </div>
                        </>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-center border-t border-slate-100 dark:border-white/5">
                    <button onClick={handleMockScan} className="h-12 px-6 flex items-center justify-center gap-2 text-white bg-primary hover:bg-primary/90 font-bold rounded-xl transition-all shadow-sm">
                        <Camera size={20} /> Görsel Yakala
                    </button>
                </div>
            </div>
        </div>
    );
}
