
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

export default function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Give the DOM a moment to render the scanner container
            const timer = setTimeout(() => {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true,
                        showZoomSliderIfSupported: true,
                        defaultZoomValueIfSupported: 2
                    },
                    /* verbose= */ false
                );

                scanner.render(
                    (decodedText) => {
                        // Success callback
                        onScan(decodedText);
                        // Stop scanning after success
                        scanner.clear().then(() => {
                            onClose();
                        }).catch(err => {
                            console.error("Failed to clear scanner", err);
                            onClose();
                        });
                    },
                    (error) => {
                        // Error callback (silent to avoid spam)
                        // console.warn(error);
                    }
                );

                scannerRef.current = scanner;
            }, 300);

            return () => {
                clearTimeout(timer);
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(err => console.error("Scanner clear error", err));
                }
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-md bg-[#0f172a] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <span>📷</span> Barkod Okutucu
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-2xl transition-all"
                    >
                        ×
                    </button>
                </div>

                <div className="p-4 flex flex-col items-center">
                    <div id="reader" className="w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40"></div>

                    <p className="mt-6 text-xs font-bold text-white/40 text-center leading-relaxed">
                        Ürün barkodunu kameraya hizalayın. <br />
                        Netlik için yeterli ışık olduğundan emin olun.
                    </p>
                </div>

                <div className="p-6 bg-white/5 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-black text-xs hover:bg-red-500/10 hover:text-red-500 transition-all"
                    >
                        TARAMAYI İPTAL ET
                    </button>
                </div>
            </div>

            <style jsx global>{`
                #reader__scan_region {
                    background: transparent !important;
                }
                #reader__dashboard {
                    padding: 20px !important;
                    background: transparent !important;
                }
                #reader__dashboard_section_csr_button {
                    background: var(--primary) !important;
                    color: white !important;
                    border: none !important;
                    padding: 8px 16px !important;
                    border-radius: 8px !important;
                    font-weight: bold !important;
                    cursor: pointer !important;
                }
                #reader__dashboard_section_csr_button:hover {
                    opacity: 0.9 !important;
                }
                #reader img {
                    display: none !important;
                }
                #reader select {
                    background: #1e293b !important;
                    color: white !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 8px !important;
                    padding: 4px 8px !important;
                    margin-bottom: 10px !important;
                }
            `}</style>
        </div>
    );
}
