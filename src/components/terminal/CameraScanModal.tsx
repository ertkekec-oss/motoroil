"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { Camera, X, RefreshCw } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function CameraScanModal({ onScan, onClose }: { onScan: (barcode: string) => void, onClose: () => void }) {
    const isCameraEnabled = process.env.NEXT_PUBLIC_POS_CAMERA_VISION !== 'false';
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        if (!isCameraEnabled) return;

        const scannerId = "reader";
        scannerRef.current = new Html5Qrcode(scannerId);

        const config = {
            fps: 60, // Tarama hızını maksimum çerçeve sayısına çektik (Saniyede 60 tarama denemesi)
            qrbox: function (viewfinderWidth: number, viewfinderHeight: number) {
                // Ekran genişliğine göre daha yaygın bir tarama alanı oluştur (özellikle telefonda kenarlara kadar)
                return {
                    width: Math.min(viewfinderWidth * 0.9, 400),
                    height: Math.min(viewfinderHeight * 0.4, 250)
                };
            },
            aspectRatio: 1.0,
            disableFlip: false,
            // Sadece endüstride en çok kullanılan formatları tanımlıyoruz. Gereksiz formatları elemek CPU gücünü ana barkodlara odaklar.
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };

        scannerRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                if (decodedText) {
                    // Close and pass the text
                    // Html5Qrcode stops automatically if we unmount, but best to stop explicitly
                    if (scannerRef.current?.isScanning) {
                        scannerRef.current.stop().then(() => {
                            onScan(decodedText);
                        }).catch((err) => {
                            onScan(decodedText);
                        });
                    } else {
                        onScan(decodedText);
                    }
                }
            },
            (errorMessage) => {
                // Ignore parse errors, it reports every frame it fails to find a code
            }
        ).then(() => {
            setIsScanning(true);
        }).catch((err) => {
            console.error("Camera start error", err);
            setIsScanning(false);
        });

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [isCameraEnabled, onScan]);

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

                    {/* The reader container for html5-qrcode */}
                    <div id="reader" className="w-full h-full [&_video]:object-cover" />

                    {!isScanning ? (
                        <div className="text-white flex flex-col items-center opacity-50 absolute inset-0 justify-center pointer-events-none bg-black">
                            <RefreshCw size={32} className="animate-spin mb-4" />
                            <p className="text-sm">Kamera başlatılıyor...</p>
                        </div>
                    ) : (
                        <div className="absolute inset-x-8 inset-y-8 border-2 border-primary/50 rounded-lg flex flex-col justify-between items-center py-4 pointer-events-none">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary/90 opacity-80" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary/90 opacity-80" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary/90 opacity-80" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary/90 opacity-80" />

                            <div className="w-full h-0.5 bg-red-500/50 animate-[scan_2s_ease-in-out_infinite]" />
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-center border-t border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        SİSTEM BARKODU OTOMATİK TARAYACAKTIR
                    </p>
                </div>
            </div>
        </div>
    );
}
