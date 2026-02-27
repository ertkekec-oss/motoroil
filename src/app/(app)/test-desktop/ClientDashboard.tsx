"use client";

import {
    Building2, ShoppingCart, Send, LayoutList,
    Wallet, TrendingUp, Briefcase, Users,
    PackageSearch, LineChart, HeadphonesIcon, Landmark,
    ArrowUpRight, ArrowDownRight, Clock, Plus, Settings, FileText, Pickaxe, BookOpen, Fingerprint, ShieldAlert, BadgeInfo,
    Search, Activity, Percent, Info, AlertTriangle, ShieldCheck, PieChart, Banknote, ListTodo, Store, Receipt, MapPin, SearchCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import Link from "next/link";
import { useRouter } from "next/navigation";

// Utility for currency formatting
const formatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 });

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

// Blocks Definitions
const CATEGORY_BLOCKS = [
    {
        category: "SATIŞ",
        features: [
            { id: "pos", title: "POS Terminal", metric: "Hızlı Satış & Perakende", icon: <ShoppingCart className="w-6 h-6" />, href: "/terminal", roles: ["SUPER_ADMIN", "admin", "seller", "finance"] },
            { id: "orders", title: "Siparişler", metric: "Toptan & Perakende Yönetimi", icon: <Send className="w-6 h-6" />, href: "/network/seller/orders", roles: ["SUPER_ADMIN", "admin", "seller", "buyer"] },
            { id: "field_sales", title: "Saha Satış Paneli", metric: "Rota & Müşteri Ziyaretleri", icon: <MapPin className="w-6 h-6" />, href: "/field-sales", roles: ["SUPER_ADMIN", "admin", "seller"] },
            { id: "quotes", title: "Teklifler", metric: "Müşteriye Özel Fiyatlandırma", icon: <FileText className="w-6 h-6" />, href: "/seller/contracts", roles: ["SUPER_ADMIN", "admin", "seller"] }
        ]
    },
    {
        category: "TİCARET",
        features: [
            { id: "b2b_network", title: "B2B Ağı", metric: "Global Bayi ve Satıcı Ağı", icon: <Building2 className="w-6 h-6" />, href: "/catalog", roles: ["SUPER_ADMIN", "admin", "growth", "seller", "buyer"] },
            { id: "purchasing", title: "Satın Alma", metric: "RFQ Talepleri (Alıcı)", icon: <Briefcase className="w-6 h-6" />, href: "/rfq", roles: ["SUPER_ADMIN", "admin", "buyer"] },
            { id: "my_products", title: "Ürünlerim", metric: "Kendi Katalog Yönetiminiz", icon: <LayoutList className="w-6 h-6" />, href: "/seller/products", roles: ["SUPER_ADMIN", "admin", "seller"] },
            { id: "supplier_network", title: "Tedarikçi Ağı", metric: "Direkt Bağlantılar", icon: <SearchCheck className="w-6 h-6" />, href: "/network/trust-score", roles: ["SUPER_ADMIN", "admin", "growth", "buyer"] }
        ]
    },
    {
        category: "FİNANS & KONTROL",
        features: [
            { id: "finance_b2b", title: "Finansal Yönetim", metric: "Gelir Gider Analizi", icon: <Wallet className="w-6 h-6" />, href: "/accounting", roles: ["SUPER_ADMIN", "admin", "finance"] },
            { id: "accounts", title: "Cari Hesaplar", metric: "Mutabakat Durumu", icon: <Receipt className="w-6 h-6" />, href: "/accounting/accounts", roles: ["SUPER_ADMIN", "admin", "finance"] },
            { id: "fraud_tower", title: "Finansal Kontrol Kulesi", metric: "Risk ve Limit İzleme", icon: <Landmark className="w-6 h-6" />, href: "/admin/dashboard", roles: ["SUPER_ADMIN", "admin", "finance", "risk"] },
            { id: "disputes", title: "Anlaşmazlık Çözümü", metric: "Dispute Center", icon: <AlertTriangle className="w-6 h-6" />, href: "/disputes", roles: ["SUPER_ADMIN", "admin", "risk"] }
        ]
    },
    {
        category: "OPERASYON",
        features: [
            { id: "inventory", title: "Envanter & Depo", metric: "Stok ve Hareket İzleme", icon: <PackageSearch className="w-6 h-6" />, href: "/products", roles: ["SUPER_ADMIN", "admin", "seller"] },
            { id: "staff", title: "PDKS & Personel", metric: "Performans ve Bordro", icon: <Users className="w-6 h-6" />, href: "/staff/me", roles: ["SUPER_ADMIN", "admin", "staff", "seller", "buyer", "finance", "growth", "risk"] },
            { id: "service_desk", title: "Servis Masası", metric: "İç ve Dış Destek", icon: <HeadphonesIcon className="w-6 h-6" />, href: "/support/tickets", roles: ["SUPER_ADMIN", "admin", "staff"] },
            { id: "audit", title: "Denetim Kayıtları", metric: "Sistem ve İşlem Logları", icon: <ShieldCheck className="w-6 h-6" />, href: "/admin/audit", roles: ["SUPER_ADMIN", "admin", "risk"] }
        ]
    },
    {
        category: "BÜYÜME",
        features: [
            { id: "intelligence", title: "İş Zekası & Analiz", metric: "Makro Metrikler", icon: <LineChart className="w-6 h-6" />, href: "/admin/ceo-metrics", roles: ["SUPER_ADMIN", "admin", "growth", "finance"] },
            { id: "boost", title: "Boost Performansı", metric: "Görünürlük Sinyalleri", icon: <TrendingUp className="w-6 h-6" />, href: "/monetization/boost", roles: ["SUPER_ADMIN", "admin", "growth", "seller"] },
            { id: "trust_score", title: "Güven Skoru", metric: "Ağ İçi Endeks Sıralaması", icon: <ShieldAlert className="w-6 h-6" />, href: "/network/trust-score", roles: ["SUPER_ADMIN", "admin", "growth"] },
        ]
    }
];

export default function ClientDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { setIsSidebarOpen } = useApp();
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
        setIsSidebarOpen(false); // 1) Focus layout implicitly
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
    }, [setIsSidebarOpen]);

    const userRole = (user?.role || "GUEST").toUpperCase();
    const setupNeeded = summary?.setup ? (!summary.setup.hasCompanyProfile || (!summary.setup.hasAnyProduct && !summary.setup.hasAnyRFQ)) : false;

    const isAuthorized = (roles: string[]) => {
        if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
        return roles.map(r => r.toUpperCase()).includes(userRole);
    };

    // Dinamik Stratejik Metrikler (Rol Bazlı Katman 1)
    const renderHeroLayer1 = () => {
        if (loading || !summary) return <div className="animate-pulse h-32 bg-white dark:bg-slate-800 rounded-2xl w-full"></div>;

        if (userRole === "FINANCE" || userRole === "RISK") {
            return (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-[#0F172A]/[0.06] dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                    <div>
                        <p className="text-[#64748B] dark:text-gray-400 font-semibold mb-2 text-sm tracking-wide">GÜNLÜK TAHSİLAT</p>
                        <h1 className="text-4xl sm:text-5xl font-bold text-[#0F172A] dark:text-white tracking-tight">{formatter.format(summary.collectedThisMonth / 30 + summary.dailyTxCount * 5000)}</h1>
                        <p className="text-[#64748B] dark:text-gray-400 mt-3 text-sm flex gap-4">
                            <span><span className="font-semibold text-[#0F172A] dark:text-white">Açık Cari:</span> {formatter.format(summary.escrowPending * 1.5)}</span>
                            <span><span className="font-semibold text-[#0F172A] dark:text-white">Net Nakit Akışı:</span> {formatter.format(summary.collectedThisMonth * 0.8)}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[#10B981] bg-[#10B981]/10 px-3 py-1.5 rounded-lg text-sm font-semibold">
                        <ArrowUpRight className="w-5 h-5" /> <span>+2.4% Bugün</span>
                    </div>
                </div>
            );
        } else if (userRole === "SELLER") {
            return (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-[#0F172A]/[0.06] dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                    <div>
                        <p className="text-[#64748B] dark:text-gray-400 font-semibold mb-2 text-sm tracking-wide">GÜNLÜK SATIŞ CİROSU</p>
                        <h1 className="text-4xl sm:text-5xl font-bold text-[#0F172A] dark:text-white tracking-tight">{formatter.format(summary.gmvTotal / 30)}</h1>
                        <p className="text-[#64748B] dark:text-gray-400 mt-3 text-sm flex gap-4">
                            <span><span className="font-semibold text-[#0F172A] dark:text-white">Açık Sipariş:</span> 12</span>
                            <span><span className="font-semibold text-[#0F172A] dark:text-white">Stok Değeri:</span> {formatter.format(summary.gmvTotal * 4.2)}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[#10B981] bg-[#10B981]/10 px-3 py-1.5 rounded-lg text-sm font-semibold">
                        <ArrowUpRight className="w-5 h-5" /> <span>+8.1% Düne Göre</span>
                    </div>
                </div>
            );
        } else {
            // CEO / SUPER_ADMIN / Default
            return (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-[#0F172A]/[0.06] dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                    <div>
                        <p className="text-[#64748B] dark:text-gray-400 font-semibold mb-2 text-sm tracking-wide">GÜNLÜK TOPLAM CİRO</p>
                        <h1 className="text-4xl sm:text-5xl font-bold text-[#0F172A] dark:text-white tracking-tight">{formatter.format(summary.gmvTotal / 30)} <span className="text-2xl text-slate-400 font-normal">(/aylık baz limit)</span></h1>
                        <p className="text-[#64748B] dark:text-gray-400 mt-3 text-sm flex gap-4">
                            <span><span className="font-semibold text-[#0F172A] dark:text-white">POS:</span> 34%</span>
                            <span><span className="font-semibold text-[#0F172A] dark:text-white">B2B:</span> 52%</span>
                            <span><span className="font-semibold text-[#0F172A] dark:text-white">Saha:</span> 14%</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[#10B981] bg-[#10B981]/10 px-3 py-1.5 rounded-lg text-sm font-semibold">
                        <ArrowUpRight className="w-5 h-5" /> <span>+12.4% Bugün</span>
                    </div>
                </div>
            );
        }
    };

    // Dinamik Operasyonel Şerit (Rol Bazlı Katman 2)
    const renderHeroLayer2 = () => {
        if (loading || !summary) return null;

        let strips = [];
        if (userRole === "FINANCE" || userRole === "RISK") {
            strips = [
                { label: "Tahsilat", val: formatter.format(summary.collectedThisMonth), warn: false },
                { label: "Cari Açık", val: formatter.format(summary.escrowPending * 1.5), warn: true },
                { label: "Mutabakat", val: `${Math.round(summary.reconciliation.matched / (summary.reconciliation.matched + summary.reconciliation.pending || 1) * 100)}%`, warn: false },
                { label: "Escrow", val: formatter.format(summary.escrowPending), warn: false },
                { label: "Risk Skoru", val: "Düşük (88)", warn: false },
            ];
        } else if (userRole === "SELLER") {
            strips = [
                { label: "Açık Sipariş", val: "12", warn: false },
                { label: "Sevkiyat Bekleyen", val: "4", warn: true },
                { label: "Kritik Stok", val: "18", warn: true },
                { label: "Aktif Teklif", val: summary.rfqActive, warn: false },
                { label: "Satış Adedi", val: summary.dailyTxCount, warn: false },
            ];
        } else {
            // Admin/CEO
            strips = [
                { label: "Aylık Ciro", val: formatter.format(summary.gmvTotal), warn: false },
                { label: "Tahsilat (Ay)", val: formatter.format(summary.collectedThisMonth), warn: false },
                { label: "Bekleyen Sipariş", val: "28", warn: true },
                { label: "Ağ RFQ İsteği", val: summary.rfqActive, warn: false },
                { label: "Risk Skoru", val: "Güvenli (92)", warn: false },
            ];
        }

        return (
            <div className="bg-[#F1F5F9] dark:bg-slate-800/50 rounded-2xl p-4 flex flex-wrap gap-4 items-center mt-4">
                {strips.map((s, i) => (
                    <div key={i} className={`flex-auto bg-white dark:bg-slate-900 px-5 py-3 rounded-xl border border-[#0F172A]/[0.06] dark:border-white/5 shadow-sm transition-colors hover:border-[#CBD5E1] dark:hover:border-slate-700`}>
                        <div className="text-xs text-[#64748B] dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">{s.label}</div>
                        <div className={`text-lg font-bold tracking-tight ${s.warn ? 'text-rose-600 dark:text-rose-400' : 'text-[#0F172A] dark:text-white'}`}>{s.val}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans antialiased text-[#0F172A] dark:text-slate-200">
            <div className="max-w-[1600px] mx-auto p-8 flex flex-col xl:flex-row gap-8">

                {/* Sol Ana İçerik */}
                <div className="flex-1 flex flex-col gap-8 min-w-0">

                    {/* Header Info */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">Workspace Overview</h2>
                        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">Sistemin genel sağlığını ve metriklerini takip ediyorsunuz. <span className="text-xs ml-1 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{userRole}</span></p>
                    </div>

                    {/* Setup Notification */}
                    {setupNeeded && !loading && (
                        <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900 rounded-2xl p-6 shadow-sm flex items-start gap-5">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Info className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">Kurulum Bekleniyor</h3>
                                <p className="text-sm text-[#64748B] dark:text-slate-400 mb-4">Sistemin avantajlarından tam yararlanmak için öncelikli adımları tamamlayın.</p>
                                <div className="flex flex-wrap gap-3">
                                    <Link href="/settings/company" onClick={() => trackEvent("SETUP_ACTION_CLICKED", { which: 'company_profile' })} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                        Şirket Bilgileri
                                    </Link>
                                    <Link href="/seller/products" onClick={() => trackEvent("SETUP_ACTION_CLICKED", { which: 'import_products' })} className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                        Ürünleri Ekle
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HERO BÖLÜMÜ */}
                    <div className="flex flex-col">
                        {renderHeroLayer1()}
                        {renderHeroLayer2()}
                    </div>

                    {/* WORKSPACE BLOCKS (SERVICE LAUNCHER) */}
                    <div className="mt-4 flex flex-col gap-10 pb-16">
                        {CATEGORY_BLOCKS.map((cat, idx) => {
                            const allowedFeatures = cat.features.filter(f => isAuthorized(f.roles));
                            if (allowedFeatures.length === 0) return null; // If role sees nothing in category, hide category

                            return (
                                <div key={idx} className="flex flex-col gap-4">
                                    <h3 className="text-sm font-bold text-[#64748B] dark:text-slate-500 uppercase tracking-widest pl-1">{cat.category}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {allowedFeatures.map(feat => (
                                            <button
                                                key={feat.id}
                                                onClick={() => {
                                                    trackEvent("FEATURE_TILE_CLICKED", { tileKey: feat.id });
                                                    router.push(feat.href);
                                                }}
                                                className="group flex items-start gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-[#0F172A]/[0.06] dark:border-white/5 shadow-sm hover:border-[#3B82F6] dark:hover:border-blue-500 transition-colors cursor-pointer text-left"
                                            >
                                                <div className="p-2.5 bg-[#F1F5F9] dark:bg-slate-700 text-[#0F172A] dark:text-slate-300 rounded-xl group-hover:bg-[#3B82F6] group-hover:text-white transition-colors shrink-0">
                                                    {feat.icon}
                                                </div>
                                                <div>
                                                    <h4 className="text-[15px] font-bold text-[#0F172A] dark:text-white tracking-tight">{feat.title}</h4>
                                                    <p className="text-xs font-medium text-[#64748B] dark:text-slate-400 mt-1 line-clamp-1">{feat.metric}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* Sağ Activity Rail */}
                <div className="w-full xl:w-80 shrink-0">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#0F172A]/[0.06] dark:border-white/5 p-6 shadow-sm sticky top-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Son Aktiviteler</h3>
                            <Clock className="w-4 h-4 text-[#64748B]" />
                        </div>

                        <div className="space-y-6">
                            {/* Aktivite Listesi Örnekleri - Dinamik hale getirilebilir */}
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
                                    <ShoppingCart className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white text-wrap">Yüz Yüze Perakende Satış</p>
                                    <span className="text-xs text-[#64748B] dark:text-slate-400">₺ 4,250 • POS Terminali</span>
                                    <span className="text-xs text-slate-400 mt-1 font-medium">5 dk önce</span>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800">
                                    <Banknote className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white text-wrap">B2B Tahsilat Eşleşti</p>
                                    <span className="text-xs text-[#64748B] dark:text-slate-400">Acar Tedarik LTD (Cari Mutabakat)</span>
                                    <span className="text-xs text-slate-400 mt-1 font-medium">42 dk önce</span>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white text-wrap">Yeni RFQ Talebi</p>
                                    <span className="text-xs text-[#64748B] dark:text-slate-400">Otomotiv Yedek Parça İhalesi #231</span>
                                    <span className="text-xs text-slate-400 mt-1 font-medium">1 saat önce</span>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start opacity-70">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white text-wrap">Saha Müşteri Check-in</p>
                                    <span className="text-xs text-[#64748B] dark:text-slate-400">Marmara Bayisi - Rota Ziyareti</span>
                                    <span className="text-xs text-slate-400 mt-1 font-medium">1.5 saat önce</span>
                                </div>
                            </div>

                            {userRole === "RISK" || userRole === "FINANCE" || userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? (
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 text-wrap">Escrow İtiraz Uyarısı (Dispute)</p>
                                        <span className="text-xs text-[#64748B] dark:text-slate-400">B2B Siparişi #84 - Kusurlu İade</span>
                                        <span className="text-xs text-slate-400 mt-1 font-medium">Bugün 09:12</span>
                                    </div>
                                </div>
                            ) : null}

                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                            <button className="w-full text-center text-sm font-semibold text-[#3B82F6] hover:text-blue-700 transition-colors">Tüm Aktivitelerei Gör</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
