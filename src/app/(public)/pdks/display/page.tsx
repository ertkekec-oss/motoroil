"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { IconDeviceTablet, IconRefresh, IconCheck, IconAlertCircle, IconClock } from "@/components/icons/PremiumIcons";

export default function PdksDisplayPage() {
    const [status, setStatus] = useState<"LOADING" | "PAIRING" | "DISPLAY">("LOADING");
    const [qrData, setQrData] = useState<{ token: string; exp: number; siteName: string } | null>(null);
    const [pairingCode, setPairingCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [countdown, setCountdown] = useState(0);

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
                    <p className="text-indigo-400 font-bold tracking-widest text-xs uppercase animate-pulse">PERIODYA OS PDKS YÜKLENİYOR</p>
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
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
            {/* Background Animations */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[150px] animate-pulse" />
            </div>

            {/* Header / Site Info */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center">
                <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-3 backdrop-blur-xl mb-4 mx-auto w-fit">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">SİSTEM CANLI</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">{qrData?.siteName || "PERIODYA OFİS"}</h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Otonom PDKS Terminali</p>
            </div>

            {/* QR Section */}
            <div className="relative group">
                {/* Glow Behind */}
                <div className="absolute -inset-8 bg-indigo-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

                <div className="relative bg-white p-12 rounded-[4rem] shadow-2xl shadow-indigo-500/5 transition-transform duration-700 hover:scale-[1.02]">
                    <div className="relative">
                        <QRCodeSVG
                            value={qrData?.token || ""}
                            size={320}
                            level="H"
                            includeMargin={false}
                            className="transition-opacity duration-300"
                        />
                        {countdown === 0 && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                <IconRefresh className="w-12 h-12 text-indigo-600 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Badge for dynamic update */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 px-8 py-3 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[200px] justify-center">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Kod Yenilenme</span>
                        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                                style={{ width: `${(countdown / 8) * 100}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-xl font-black text-indigo-400 tabular-nums w-4 text-center">{countdown}</span>
                </div>
            </div>

            {/* Footer Clock & Info */}
            <div className="absolute bottom-12 left-0 w-full px-12 flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Son Güncelleme</p>
                    <div className="flex items-center gap-2">
                        <IconRefresh className="w-4 h-4 text-emerald-500" />
                        <span className="text-lg font-black tabular-nums">{lastUpdate.toLocaleTimeString('tr-TR', { hour12: false })}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <IconClock className="w-3 h-3" />
                        SİSTEM SAATİ
                    </p>
                    <span className="text-6xl font-black tracking-tighter tabular-nums leading-none">
                        {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest">
                        {currentTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Floating Action Button for Help/Settings placeholder */}
            <div className="absolute top-12 right-12">
                <button className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                    <IconAlertCircle className="w-5 h-5 text-slate-400" />
                </button>
            </div>
        </div>
    );
}
