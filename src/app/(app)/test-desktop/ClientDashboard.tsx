"use client";

import {
    Building2, ShoppingCart, Send, LayoutList,
    Wallet, TrendingUp, Briefcase, Users,
    PackageSearch, LineChart, HeadphonesIcon, Landmark,
    ArrowUpRight, ArrowDownRight, Activity, Percent, ArrowRightLeft, ClockAlert, Info, AlertTriangle, ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardSummary {
    gmvTotal: number;
    rfqActive: number;
    escrowPending: number;
    collectedThisMonth: number;
    rfqTrend: number[];
    boostClicks: number;
    boostDeltaPct: number;
    reconciliation: { matched: number; pending: number; disputed: number };
    dailyTxCount: number;
    setup: {
        hasCompanyProfile: boolean;
        hasAnyProduct: boolean;
        hasAnyRFQ: boolean;
        hasAtLeastOneOrder: boolean;
    };
}

const ALL_FEATURES = [
    { id: "pos", title: "POS Terminal", icon: <ShoppingCart className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "seller", "finance"], href: "/terminal" },
    { id: "b2b_network", title: "B2B Ağı", icon: <Building2 className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "growth", "seller", "buyer"], href: "/catalog" },
    { id: "orders", title: "Siparişler", icon: <Send className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "seller", "buyer"], href: "/network/seller/orders" },
    { id: "catalog", title: "Katalog", icon: <LayoutList className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "seller"], href: "/seller/products" },
    { id: "finance_b2b", title: "Tahsilat (B2B)", icon: <Wallet className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "finance"], href: "/accounting" },
    { id: "growth", title: "GMV & Büyüme", icon: <TrendingUp className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "growth", "seller"], href: "/network/trust-score" },
    { id: "purchasing", title: "Satın Alma (Alıcı)", icon: <Briefcase className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "buyer"], href: "/rfq" },
    { id: "staff", title: "Personel Paneli", icon: <Users className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "staff", "seller", "buyer", "finance", "growth", "risk"], href: "/staff/me" },
    { id: "inventory", title: "Envanter & Depo", icon: <PackageSearch className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "seller"], href: "/seller/products" },
    { id: "intelligence", title: "İş Zekası & Analiz", icon: <LineChart className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "growth", "finance"], href: "/admin/ceo-metrics" },
    { id: "service_desk", title: "Servis Masası", icon: <HeadphonesIcon className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "staff"], href: "/support/tickets" },
    { id: "fraud_tower", title: "Finansal Kontrol Kulesi", icon: <Landmark className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "finance", "risk"], href: "/admin/dashboard" },
    { id: "disputes", title: "Dispute Center", icon: <AlertTriangle className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "risk"], href: "/disputes" },
    { id: "audit", title: "Denetim Kayıtları", icon: <ShieldCheck className="w-6 h-6" />, roles: ["SUPER_ADMIN", "admin", "risk"], href: "/admin/audit" },
];

export default function ClientDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const trackEvent = async (eventName: string, properties?: any) => {
        try {
            await fetch("/api/metrics/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventName, properties })
            });
        } catch (err) { }
    };

    useEffect(() => {
        trackEvent("CONTROL_HUB_VIEWED");

        async function fetchSummary() {
            try {
                const res = await fetch("/api/dashboard/summary");
                if (res.ok) {
                    const data = await res.json();
                    setSummary(data);

                    const isNew = data.setup && (!data.setup.hasCompanyProfile || !data.setup.hasAnyProduct || !data.setup.hasAtLeastOneOrder);
                    if (isNew) {
                        trackEvent("SETUP_CHECKLIST_SHOWN");
                    }
                } else {
                    console.error("Failed to fetch dashboard summary");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchSummary();
    }, []);

    const userRole = user?.role || "GUEST";
    const setupNeeded = summary?.setup ? (!summary.setup.hasCompanyProfile || (!summary.setup.hasAnyProduct && !summary.setup.hasAnyRFQ)) : false;

    const formatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 });

    const kpis = summary ? [
        { title: "Toplam GMV", value: formatter.format(summary.gmvTotal), trend: "---", up: true },
        { title: "Aktif RFQ", value: summary.rfqActive.toString(), trend: "---", up: true },
        { title: "Escrow'da Bekleyen", value: formatter.format(summary.escrowPending), trend: "---", up: summary.escrowPending >= 0 },
        { title: "Tahsil Edilen (Bu Ay)", value: formatter.format(summary.collectedThisMonth), trend: "---", up: true },
    ] : [];

    const isAuthorized = (roles: string[]) => {
        if (!userRole) return false;
        // Map SUPER_ADMIN and Admin variations
        const roleStr = userRole.toUpperCase();
        if (roleStr === "SUPER_ADMIN" || roleStr === "ADMIN") return true;

        return roles.map(r => r.toUpperCase()).includes(roleStr);
    };

    const maxTrendVal = summary?.rfqTrend ? Math.max(...summary.rfqTrend, 1) : 1;

    // Reconciliation logic
    const rec = summary?.reconciliation || { matched: 0, pending: 0, disputed: 0 };
    const totalRec = rec.matched + rec.pending + rec.disputed || 1;
    const matchedPct = Math.round((rec.matched / totalRec) * 100);
    const pendingPct = Math.round((rec.pending / totalRec) * 100);
    const disputedPct = Math.round((rec.disputed / totalRec) * 100);

    // SVG Dash lengths
    const matchedLen = (matchedPct / 100) * 100;
    const pendingLen = (pendingPct / 100) * 100;
    const disputedLen = (disputedPct / 100) * 100;

    return (
        <div className="min-h-screen p-6 font-sans text-slate-900 dark:text-gray-100 dark:bg-[#0f172a] bg-[#F1F5F9] rounded-tl-xl relative">
            <div className="max-w-7xl mx-auto space-y-8 relative">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">Control Hub</h1>
                        <p className="text-[#64748B] dark:text-gray-400 mt-1">Sistemin genel sağlığını ve temel metriklerini takip edin. (Role: {userRole})</p>
                    </div>
                </div>

                {/* 4. Welcome / Setup State */}
                {setupNeeded && !loading && (
                    <div className="bg-white border-2 border-[#2563EB] dark:bg-slate-800 dark:border-blue-500 rounded-xl p-6 shadow-sm">
                        <div className="flex gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full h-fit">
                                <Info className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-[#0F172A] dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Kurulum Kontrol Listesi</h2>
                                <p className="text-[#64748B] dark:text-gray-400 mt-2 text-sm">Ağa henüz tam entegre olmadınız. Sistemin avantajlarından yararlanmak için aşağıdaki adımları tamamlayın.</p>
                                <div className="mt-4 flex flex-wrap gap-4">
                                    <Link href="/settings/company" onClick={() => trackEvent("SETUP_ACTION_CLICKED", { which: 'company_profile' })} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-md hover:bg-slate-200 transition-colors">
                                        1. Şirket Bilgilerini Tamamla
                                    </Link>
                                    <Link href="/seller/products" onClick={() => trackEvent("SETUP_ACTION_CLICKED", { which: 'import_products' })} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-md hover:bg-slate-200 transition-colors">
                                        2. İlk Ürünleri İçe Aktar
                                    </Link>
                                    <Link href="/rfq" onClick={() => trackEvent("SETUP_ACTION_CLICKED", { which: 'create_rfq' })} className="px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors">
                                        3. İlk RFQ'yu Oluştur
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 1. Üst Bölüm – KPI Kartları */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {kpis.map((kpi, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <span className="text-[#64748B] dark:text-slate-400 text-sm font-medium">{kpi.title}</span>
                                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${kpi.up ? 'bg-emerald-50 text-[#10B981]' : 'bg-slate-100 text-slate-500'}`}>
                                        {/* Trend calc logic pending */}
                                        ~
                                    </div>
                                </div>
                                <div className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                                    {kpi.value}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. Orta Bölüm – Feature Button Grid (Role-based) */}
                <div>
                    <h2 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4">Hızlı Erişim <span className="text-sm font-normal text-slate-500 ml-2">(Sadece Rolünüze Uygun Olanlar Aktiftir)</span></h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {ALL_FEATURES.map((feat, idx) => {
                            const authorized = isAuthorized(feat.roles);
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        if (authorized) {
                                            trackEvent("FEATURE_TILE_CLICKED", { tileKey: feat.id });
                                            router.push(feat.href);
                                        }
                                    }}
                                    disabled={!authorized}
                                    className={`group flex flex-col items-center justify-center p-6 rounded-xl border transition-all cursor-pointer focus:outline-none relative
                                        ${authorized
                                            ? "bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#2563EB] dark:hover:border-[#2563EB] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)]"
                                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 opacity-60 cursor-not-allowed grayscale"
                                        }
                                    `}
                                    title={!authorized ? "Yetki gerekli" : feat.title}
                                >
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-lg shadow-sm transition-all duration-300
                                        ${authorized ? "bg-[#F1F5F9] dark:bg-slate-700 text-[#2563EB] dark:text-blue-400 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"}
                                    `}>
                                        {feat.icon}
                                    </div>
                                    <span className={`mt-3 font-semibold text-sm transition-colors text-center
                                        ${authorized ? "text-[#0F172A] dark:text-slate-300 group-hover:text-[#2563EB] dark:group-hover:text-blue-400" : "text-slate-400 dark:text-slate-500"}
                                    `}>
                                        {feat.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Alt Bölüm – Analitik Widget Alanı */}
                {!loading && summary && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                        {/* Sol Kolon */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-[#2563EB]" />
                                        <h3 className="font-bold text-[#0F172A] dark:text-white">RFQ Aktivite Trendi (Sinyal)</h3>
                                    </div>
                                    <span className="text-xs text-[#64748B]">Son 7 Gün</span>
                                </div>
                                <div className="h-32 w-full flex items-end gap-2 px-2">
                                    {/* Responsive Bar Chart from read-model data */}
                                    {summary.rfqTrend.map((val, i) => {
                                        const hPct = maxTrendVal > 0 ? (val / maxTrendVal) * 100 : 0;
                                        return (
                                            <div key={i} title={`${val} Aktivite`} className="flex-1 bg-gradient-to-t from-[#2563EB] to-blue-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${Math.max(5, hPct)}%` }}></div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Percent className="w-5 h-5 text-[#10B981]" />
                                    <h3 className="font-bold text-[#0F172A] dark:text-white">Ağ İçi Görünürlük (Boost)</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-[#64748B] font-medium">Performans Delta</span>
                                            <span className="text-[#0F172A] dark:text-white font-bold">+{summary.boostDeltaPct}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                            <div className="bg-[#10B981] h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, summary.boostDeltaPct * 2))}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-[#64748B] font-medium">Toplam Tıklama (Sinyal)</span>
                                            <span className="text-[#0F172A] dark:text-white font-bold">{summary.boostClicks}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                            <div className="bg-[#2563EB] h-2 rounded-full" style={{ width: '42%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sağ Kolon */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <ArrowRightLeft className="w-5 h-5 text-[#F59E0B]" />
                                    <h3 className="font-bold text-[#0F172A] dark:text-white">Cari Mutabakat Durumu</h3>
                                </div>
                                <div className="flex-1 flex items-center justify-center py-6">
                                    {/* Value-driven Donut SVG Placeholder */}
                                    <div className="relative w-40 h-40">
                                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                            <circle className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="6" fill="transparent" r="15.9155" cx="18" cy="18" />
                                            {/* Segment 1 (Mutabık) */}
                                            {matchedLen > 0 && <circle className="stroke-[#10B981] transition-all duration-700" strokeWidth="6" strokeDasharray={`${matchedLen}, 100`} fill="transparent" r="15.9155" cx="18" cy="18" />}
                                            {/* Segment 2 (Bekleyen) */}
                                            {pendingLen > 0 && <circle className="stroke-[#F59E0B] transition-all duration-700" strokeWidth="6" strokeDasharray={`${pendingLen}, 100`} strokeDashoffset={`-${matchedLen}`} fill="transparent" r="15.9155" cx="18" cy="18" />}
                                            {/* Segment 3 (İhtilaflı) */}
                                            {disputedLen > 0 && <circle className="stroke-[#EF4444] transition-all duration-700" strokeWidth="6" strokeDasharray={`${disputedLen}, 100`} strokeDashoffset={`-${matchedLen + pendingLen}`} fill="transparent" r="15.9155" cx="18" cy="18" />}
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold text-[#0F172A] dark:text-white">{matchedPct}%</span>
                                            <span className="text-xs text-[#64748B]">Mutabık</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-center gap-6 text-sm font-medium">
                                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10B981]"></span> Mutabık ({rec.matched})</div>
                                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span> Bekleyen ({rec.pending})</div>
                                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#EF4444]"></span> İhtilaflı ({rec.disputed})</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2">
                                    <ClockAlert className="w-5 h-5 text-[#8B5CF6]" />
                                    <h3 className="font-bold text-[#0F172A] dark:text-white">Günlük Ağ İşlemleri</h3>
                                </div>
                                <div className="flex items-end gap-4 mt-2">
                                    <span className="text-5xl font-black text-[#0F172A] dark:text-white tracking-tight">{summary.dailyTxCount}</span>
                                </div>
                                <p className="text-[#64748B] text-sm mt-4 leading-relaxed">Şirketinizin bugün içerisinde işleme dahil olduğu sipariş/RFQs olay limitidir. Gecikmeli ödemelerin veya aktif sözleşmelerin veritabanı yansıması.</p>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
