"use client";

import { useState, useEffect } from "react";

/* ─── Tipler ─── */
interface ConsentState {
    required: true;          // her zaman true, değiştirilemez
    analytics: boolean;
    marketing: boolean;
    decided: boolean;         // kullanıcı karar verdi mi?
}

const STORAGE_KEY = "cookie-consent";

const DEFAULT_CONSENT: ConsentState = {
    required: true,
    analytics: false,
    marketing: false,
    decided: false,
};

/* ─── Analytics Placeholder ─── */
function initAnalytics() {
    // Analitik consent TRUE olduğunda buraya entegre edin:
    // • Google Analytics: window.gtag('consent', 'update', { analytics_storage: 'granted' })
    // • Hotjar, Clarity vb. init fonksiyonları burada çağrılır.
    if (process.env.NODE_ENV === "development") {
        console.log("[CookieConsent] Analytics consent granted – init analytics here.");
    }
}

function initMarketing() {
    // Pazarlama consent TRUE olduğunda:
    // • Meta Pixel, Google Ads vb. burada aktif edilir.
    if (process.env.NODE_ENV === "development") {
        console.log("[CookieConsent] Marketing consent granted – init marketing pixels here.");
    }
}

/* ─── Ana Bileşen ─── */
export default function CookieConsent() {
    const [consent, setConsent] = useState<ConsentState | null>(null);
    const [showPreferences, setShowPreferences] = useState(false);
    const [prefAnalytics, setPrefAnalytics] = useState(false);
    const [prefMarketing, setPrefMarketing] = useState(false);
    const [visible, setVisible] = useState(false);

    /* Sayfa yüklenince localStorage'ı oku */
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed: ConsentState = JSON.parse(stored);
                setConsent(parsed);
                applyConsents(parsed);
            } else {
                // Kullanıcı henüz karar vermemiş → banner göster
                setTimeout(() => setVisible(true), 600); // hafif gecikme ile yumuşak görünüm
            }
        } catch {
            setTimeout(() => setVisible(true), 600);
        }
    }, []);

    /* Consent durumuna göre servisleri başlat */
    function applyConsents(c: ConsentState) {
        if (c.analytics) initAnalytics();
        if (c.marketing) initMarketing();
    }

    /* Kaydet ve kapat */
    function saveConsent(c: ConsentState) {
        const final = { ...c, decided: true };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
        setConsent(final);
        applyConsents(final);
        setVisible(false);
        setShowPreferences(false);
    }

    /* Hepsini Kabul Et */
    function acceptAll() {
        saveConsent({ required: true, analytics: true, marketing: true, decided: true });
    }

    /* Reddet (sadece zorunlu) */
    function rejectAll() {
        saveConsent({ required: true, analytics: false, marketing: false, decided: true });
    }

    /* Tercihleri Kaydet */
    function savePreferences() {
        saveConsent({ required: true, analytics: prefAnalytics, marketing: prefMarketing, decided: true });
    }

    /* Karar verilmiş veya henüz mount olmamış → hiçbir şey render etme */
    if (!visible || consent?.decided) return null;

    return (
        <>
            {/* Arka plan overlay (tercihler açıkken) */}
            {showPreferences && (
                <div
                    className="fixed inset-0 z-[9998]"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={() => setShowPreferences(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Cookie Banner ── */}
            <div
                role="region"
                aria-label="Çerez Tercihleri"
                className={`fixed bottom-4 left-4 right-4 z-[9999] max-w-xl mx-auto transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                    }`}
            >
                <div
                    className="rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                        backgroundColor: "#0d0f1a",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                    }}
                >
                    {/* ── TERCIHLER PANELİ (açılınca görünür) ── */}
                    {showPreferences && (
                        <div className="p-5 border-b border-white/5">
                            <h3 className="text-sm font-black text-white mb-4 tracking-tight">
                                Çerez Tercihlerim
                            </h3>
                            <div className="space-y-3">
                                {/* Zorunlu — kapatılamaz */}
                                <label className="flex items-start gap-3 cursor-not-allowed opacity-70">
                                    <input
                                        type="checkbox"
                                        checked={true}
                                        disabled
                                        className="mt-0.5 w-4 h-4 accent-orange-500 cursor-not-allowed"
                                        aria-label="Zorunlu çerezler — devre dışı bırakılamaz"
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-white">
                                            Zorunlu Çerezler{" "}
                                            <span className="text-[10px] text-gray-500 font-normal ml-1">(Zorunlu)</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                                            Sitenin temel işlevleri için gereklidir. Oturum yönetimi, güvenlik vb.
                                            Devre dışı bırakılamaz.
                                        </p>
                                    </div>
                                </label>

                                {/* Analitik */}
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={prefAnalytics}
                                        onChange={e => setPrefAnalytics(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer rounded focus:ring-2 focus:ring-orange-500"
                                        aria-label="Analitik çerezlere izin ver"
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                                            Analitik Çerezler
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                                            Siteyi nasıl kullandığınızı anlamamıza yardımcı olur.
                                            Veriler anonimleştirilir.
                                        </p>
                                    </div>
                                </label>

                                {/* Pazarlama */}
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={prefMarketing}
                                        onChange={e => setPrefMarketing(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer rounded focus:ring-2 focus:ring-orange-500"
                                        aria-label="Pazarlama çerezlerine izin ver"
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                                            Pazarlama Çerezleri
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                                            Kişiselleştirilmiş reklamlar ve kampanya ölçümü için kullanılır.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Kaydet */}
                            <button
                                onClick={savePreferences}
                                className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#0d0f1a]"
                                style={{ background: "linear-gradient(135deg,#FF5500,#E64A00)" }}
                                aria-label="Çerez tercihlerimi kaydet"
                            >
                                Seçimleri Kaydet
                            </button>
                        </div>
                    )}

                    {/* ── BANNER ALANI ── */}
                    <div className="p-5">
                        <div className="flex items-start gap-3 mb-4">
                            <span className="text-xl flex-shrink-0" aria-hidden="true">🍪</span>
                            <div>
                                <p className="text-sm text-gray-300 font-medium leading-relaxed">
                                    Bu web sitesi deneyiminizi geliştirmek için çerezler kullanır.
                                    Zorunlu olmayan çerezler için izninizi alıyoruz.{" "}
                                    <a
                                        href="/kvkk"
                                        className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors text-xs"
                                        aria-label="KVKK ve gizlilik politikasını oku"
                                    >
                                        Gizlilik Politikası
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* Butonlar */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={acceptAll}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#0d0f1a]"
                                style={{ background: "linear-gradient(135deg,#FF5500,#E64A00)" }}
                                aria-label="Tüm çerezleri kabul et"
                            >
                                Hepsini Kabul Et
                            </button>
                            <button
                                onClick={rejectAll}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-300 border border-white/10 hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0d0f1a]"
                                aria-label="Zorunlu olmayan çerezleri reddet"
                            >
                                Reddet
                            </button>
                            <button
                                onClick={() => {
                                    setPrefAnalytics(false);
                                    setPrefMarketing(false);
                                    setShowPreferences(prev => !prev);
                                }}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0d0f1a]"
                                aria-expanded={showPreferences}
                                aria-label="Çerez tercihlerini yönet"
                            >
                                Tercihleri Yönet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ─── Consent Hook (diğer componentlerden kullanmak için) ─── */
export function useCookieConsent(): ConsentState | null {
    const [consent, setConsent] = useState<ConsentState | null>(null);
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setConsent(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);
    return consent;
}
