"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { IconDeviceTablet, IconRefresh, IconCheck, IconAlertCircle, IconClock, IconInfoCircle } from "@/components/icons/PremiumIcons";

export default function PdksDisplayPage() {
    const [status, setStatus] = useState<"LOADING" | "PAIRING" | "DISPLAY">("LOADING");
    const [qrData, setQrData] = useState<{ token: string; exp: number; siteName: string } | null>(null);
    const [pairingCode, setPairingCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [countdown, setCountdown] = useState(0);
    const [announcement, setAnnouncement] = useState<string | null>(null);

    // Saat güncellemesi
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Geri sayım mantığı
    useEffect(() => {
        if (qrData) {
            const timer = setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                const diff = qrData.exp - now;
                setCountdown(diff > 0 ? diff : 0);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [qrData]);

    const fetchToken = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/pdks/display/token");
            const data = await res.json();

            if (res.status === 401) {
                setStatus("PAIRING");
                return;
            }

            if (data.success) {
                setQrData({
                    token: data.qrToken,
                    exp: data.exp,
                    siteName: data.siteName
                });
                setAnnouncement(data.announcement || null);
                setStatus("DISPLAY");
                setLastUpdate(new Date());
            } else {
                setError(data.error || "Token hatası");
            }
        } catch (err) {
            setError("Sunucu bağlantısı koptu");
        }
    }, []);

    // İlk yükleme ve periyodik çekim
    useEffect(() => {
        fetchToken();
        const interval = setInterval(fetchToken, 4000); // 4 saniyede bir kontrol et (8s TTL için güvenli)
        return () => clearInterval(interval);
    }, [fetchToken]);

    const handlePair = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await fetch("/api/v1/pdks/display/pair", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pairingCode })
            });
            const data = await res.json();
            if (data.success) {
                fetchToken();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Eşleştirme başarısız");
        }
    };

    if (status === "LOADING") {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-indigo-400 font-black tracking-widest text-xs uppercase animate-pulse">PERIODYA OS PDKS YÜKLENİYOR</p>
                </div>
            </div>
        );
    }

    if (status === "PAIRING") {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl shadow-indigo-500/10">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                        <IconDeviceTablet className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-black text-white text-center mb-2 tracking-tighter">Cihaz Eşleştirme</h2>
                    <p className="text-slate-400 text-center text-sm mb-10 font-bold">Lütfen şube yöneticisinden aldığınız pairing kodunu girin.</p>

                    <form onSubmit={handlePair} className="space-y-6">
                        <input
                            type="text"
                            value={pairingCode}
                            onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                            placeholder="Örn: PDKS-7H2K9"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xl text-center font-black text-white placeholder:text-slate-700 focus:border-indigo-500 outline-none transition-all tracking-[0.2em]"
                        />
                        {error && (
                            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold justify-center bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">
                                <IconAlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        <button className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                            SİSTEME BAĞLAN
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600 rounded-full blur-[150px] animate-pulse delay-700" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 h-screen relative z-10">
                {/* Left Side: QR and Basic Info */}
                <div className="flex flex-col items-center justify-center p-8 md:p-12 relative border-b md:border-b-0 md:border-r border-white/5 h-full">

                    {/* Header Site Info */}
                    <div className="mb-12 text-center">
                        <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-3 backdrop-blur-xl mb-6 mx-auto w-fit shadow-2xl shadow-indigo-500/10">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">SİSTEM ÇEVRİMİÇİ</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 leading-none">
                            {qrData?.siteName || "PERIODYA TERMINAL"}
                        </h1>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em]">OTONOM PDKS NOKTASI</p>
                    </div>

                    {/* QR Code Container */}
                    <div className="relative group">
                        <div className="absolute -inset-10 bg-indigo-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

                        <div className="relative bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl shadow-black/80 ring-1 ring-white/10 overflow-hidden transform transition-all duration-700 hover:scale-[1.02]">
                            <div className="relative">
                                <QRCodeSVG
                                    value={qrData?.token || ""}
                                    size={360}
                                    level="H"
                                    includeMargin={false}
                                    className="transition-opacity duration-300"
                                />
                                {countdown === 0 && (
                                    <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center rounded-2xl">
                                        <div className="flex flex-col items-center gap-4">
                                            <IconRefresh className="w-14 h-14 text-indigo-600 animate-spin" />
                                            <span className="text-indigo-900 font-black text-xs uppercase tracking-widest">Yükleniyor</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Corner Accents */}
                            <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-indigo-600/20 rounded-tl-[4rem]" />
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-indigo-600/20 rounded-br-[4rem]" />
                        </div>

                        {/* Dynamic Progress Indicator */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-3xl border border-white/10 px-10 py-4 rounded-3xl shadow-2xl flex items-center gap-6 min-w-[280px] justify-center transition-all group-hover:-translate-y-2">
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">GÜVENLİK ANAHTARI YENİLENME</span>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-linear ${countdown < 3 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${(countdown / 8) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <span className={`text-4xl font-black tabular-nums w-10 text-center ${countdown < 3 ? 'text-rose-500 animate-pulse' : 'text-indigo-400'}`}>
                                {countdown}
                            </span>
                        </div>
                    </div>

                    {/* Footer Info Left */}
                    <div className="absolute bottom-12 left-12 flex flex-col gap-2">
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] opacity-50">SİSTEM ÇEKİRDEĞİ V3.4.0</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <IconRefresh className="w-4 h-4 text-emerald-500/70" />
                            </div>
                            <span className="text-lg font-black tabular-nums tracking-tight">{lastUpdate.toLocaleTimeString('tr-TR', { hour12: false })}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Announcements and Clock */}
                <div className="bg-white/5 backdrop-blur-3xl flex flex-col p-10 md:p-16 relative overflow-hidden h-full">

                    {/* Main Clock Display */}
                    <div className="mb-10 lg:mb-16">
                        <div className="flex flex-col gap-0">
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 mb-2">
                                <IconClock className="w-4 h-4" />
                                GÜNCEL ZAMAN
                            </p>
                            <span className="text-7xl lg:text-9xl font-black tracking-tighter tabular-nums leading-none text-white drop-shadow-2xl">
                                {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <div className="flex items-center gap-4 mt-4">
                                <span className="text-xl font-black text-slate-300 uppercase tracking-tighter">
                                    {currentTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <div className="h-4 w-[1px] bg-white/10" />
                                <span className="text-xl font-bold text-slate-500 uppercase tracking-tighter">
                                    {currentTime.toLocaleDateString('tr-TR', { weekday: 'long' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Announcements Section */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30">
                                DUYURULAR
                            </div>
                            <div className="flex-1 h-[1px] bg-white/10" />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-6 custom-scrollbar">
                            {announcement ? (
                                <div className="space-y-8">
                                    <div className="relative">
                                        <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/0 via-indigo-600 to-indigo-500/0 rounded-full" />
                                        <p className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-200 tracking-tight whitespace-pre-line">
                                            {announcement}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <div className="w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center">
                                            <IconInfoCircle className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-widest italic">Periodya Sistem Duyurusu</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center gap-6">
                                    <IconDeviceTablet className="w-24 h-24" />
                                    <div>
                                        <p className="text-lg font-black uppercase tracking-[0.2em] mb-2">Duyuru Bulunmuyor</p>
                                        <p className="text-sm font-bold uppercase tracking-[0.1em]">Yöneticiler buradan önemli mesajlar paylaşabilir.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logo Accent */}
                    <div className="mt-12 opacity-30">
                        <span className="text-4xl font-black tracking-tighter italic">PERIODYA<span className="text-indigo-500">.</span></span>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
