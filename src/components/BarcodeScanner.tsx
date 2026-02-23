
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

export default function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const scannerId = "reader-container";

    useEffect(() => {
        if (isOpen) {
            setCameraError(null);
            setIsCameraReady(false);

            // Wait for DOM to be fully stable
            const timer = setTimeout(async () => {
                try {
                    const html5QrCode = new Html5Qrcode(scannerId);
                    html5QrCodeRef.current = html5QrCode;

                    // 1. Requesting cameras typically triggers the browser's permission pop-up
                    const devices = await Html5Qrcode.getCameras();

                    if (!devices || devices.length === 0) {
                        throw { name: 'NotFoundError', message: 'Kamera bulunamadı.' };
                    }

                    // 2. Look for back camera
                    const backCamera = devices.find(device =>
                        device.label.toLowerCase().includes('back') ||
                        device.label.toLowerCase().includes('arka') ||
                        device.label.toLowerCase().includes('environment')
                    );

                    const cameraId = backCamera ? backCamera.id : devices[0].id;

                    const config = {
                        fps: 15,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    };

                    // 3. Start scanning with explicit cameraId
                    await html5QrCode.start(
                        cameraId,
                        config,
                        (decodedText) => {
                            onScan(decodedText);
                            stopScanner();
                        },
                        () => { } // Silent frame error
                    );

                    setIsCameraReady(true);
                } catch (err: any) {
                    console.error("Scanner Error Details:", err);
                    let errorMsg = "Kamera başlatılamadı.";

                    if (err?.name === 'NotAllowedError' || err === 'NotAllowedError') {
                        errorMsg = "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından (adres çubuğundaki kilit ikonu) kamera iznini aktif edin.";
                    } else if (err?.name === 'NotFoundError') {
                        errorMsg = "Cihazda uygun bir kamera bulunamadı.";
                    } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                        errorMsg = "Kamera erişimi için HTTPS güvenli bağlantı gereklidir.";
                    } else if (err?.message) {
                        errorMsg = `Hata: ${err.message}`;
                    }

                    setCameraError(errorMsg);
                    toast.error(errorMsg);
                }
            }, 1000);

            return () => {
                clearTimeout(timer);
                stopScanner();
            };
        }
    }, [isOpen]);

    const stopScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current = null;
            } catch (err) {
                console.error("Stop Error:", err);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-[#0a0a0b] rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col relative">

                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-white flex items-center gap-3">
                            <span className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-xl">📷</span>
                            QR TARAYICI
                        </h2>
                        <p className="text-[10px] font-bold text-white/30 tracking-[0.2em] mt-1 uppercase">PDKS Doğrulama Sistemi</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-2xl text-white/40 hover:text-white transition-all border border-white/5"
                    >
                        &times;
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center">
                    {/* Scanner Container */}
                    <div className="relative w-full aspect-square max-w-[320px] rounded-[48px] overflow-hidden border-2 border-white/5 bg-black ring-8 ring-white/[0.02]">
                        <div id={scannerId} className="w-full h-full object-cover"></div>

                        {/* Overlay elements */}
                        {!isCameraReady && !cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-md">
                                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Kamera Hazırlanıyor</span>
                            </div>
                        )}

                        {cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-rose-500/10 backdrop-blur-md text-center">
                                <span className="text-4xl text-rose-500">⚠️</span>
                                <p className="text-xs font-bold text-rose-400 leading-relaxed">{cameraError}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 px-6 py-2 bg-rose-500 text-white text-[10px] font-black uppercase rounded-xl"
                                >
                                    SAYFAYI YENİLE
                                </button>
                            </div>
                        )}

                        {isCameraReady && (
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Square focus area */}
                                <div className="absolute inset-x-12 inset-y-12 border-2 border-indigo-500/50 rounded-3xl shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

                                    {/* Scanning line animation */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-scan" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 space-y-2 text-center">
                        <p className="text-xs font-bold text-white/60 tracking-tight">
                            QR kodu çerçeve içerisine hizalayın
                        </p>
                        <p className="text-[10px] text-white/20 font-medium uppercase tracking-widest">
                            Netlik için yeterli ışık sağladığınızdan emin olun
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 pt-0 mt-auto">
                    <button
                        onClick={onClose}
                        className="w-full py-5 rounded-[24px] bg-white/[0.03] border border-white/10 text-white/40 font-black text-xs hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all uppercase tracking-widest"
                    >
                        İŞLEMİ İPTAL ET
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(280px); opacity: 0; }
                }
                #reader-container video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                #reader-container {
                    border: none !important;
                }
            `}</style>
        </div>
    );
}
