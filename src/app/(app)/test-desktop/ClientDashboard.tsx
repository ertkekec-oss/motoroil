"use client";

import {
    Building2, ShoppingCart, Send, LayoutList,
    Wallet, TrendingUp, Briefcase, Users,
    PackageSearch, LineChart, HeadphonesIcon, Landmark,
    ArrowUpRight, Clock, ShieldAlert, Search,
    Activity, Percent, Info, AlertTriangle, ShieldCheck, PieChart, Banknote, Store, Receipt, MapPin, SearchCheck,
    Box, CheckSquare, BarChart3, Fingerprint, Settings, HelpCircle, FileText, FileBarChart2
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

const ALL_MENU_KEYS = [
    { id: "terminal", title: "POS Terminal", href: "/terminal", icon: <ShoppingCart className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER", "FINANCE"], color: "bg-orange-50 text-orange-600" },
    { id: "dashboard", title: "B2B Ağı", href: "/dashboard", icon: <PieChart className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "GROWTH", "BUYER", "SELLER"], color: "bg-blue-50 text-blue-600" },

    // Orders
    { id: "seller_orders", title: "Siparişler (Satıcı)", href: "/network/seller/orders", icon: <Send className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-indigo-50 text-indigo-600" },
    { id: "buyer_orders", title: "Siparişler (Alıcı)", href: "/network/buyer/orders", icon: <Send className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "BUYER"], color: "bg-indigo-50 text-indigo-600" },

    // Catalog
    { id: "my_products", title: "Ürünlerim", href: "/seller/products", icon: <Box className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-emerald-50 text-emerald-600" },
    { id: "catalog", title: "B2B Keşfet", href: "/catalog", icon: <SearchCheck className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "BUYER", "SELLER"], color: "bg-emerald-50 text-emerald-600" },

    // B2B Finance
    { id: "b2b_finance", title: "Finans (B2B)", href: "/network/finance", icon: <Banknote className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "SELLER"], color: "bg-rose-50 text-rose-600" },

    // Growth
    { id: "boost", title: "Boost Yönetimi", href: "/seller/boost", icon: <TrendingUp className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "GROWTH", "SELLER"], color: "bg-amber-50 text-amber-600" },
    { id: "boost_analytics", title: "Boost Performansı", href: "/seller/boost/analytics", icon: <BarChart3 className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "GROWTH", "SELLER"], color: "bg-amber-50 text-amber-600" },
    { id: "trust_score", title: "Güven Skoru", href: "/network/trust-score", icon: <ShieldCheck className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "GROWTH"], color: "bg-amber-50 text-amber-600" },

    // Purchasing
    { id: "contracts", title: "Sözleşmelerim", href: "/contracts", icon: <FileText className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "BUYER"], color: "bg-cyan-50 text-cyan-600" },
    { id: "rfqs", title: "Pazarlıklı Alımlar (RFQ)", href: "/rfq", icon: <Briefcase className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "BUYER"], color: "bg-cyan-50 text-cyan-600" },

    // Team
    { id: "staff", title: "Personel Paneli", href: "/staff/me", icon: <Users className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "SELLER", "BUYER", "FINANCE", "GROWTH", "RISK"], color: "bg-slate-100 text-slate-600" },

    // Financial Mgmt
    { id: "accounting", title: "Finansal Yönetim", href: "/accounting", icon: <Landmark className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"], color: "bg-rose-50 text-rose-600" },
    { id: "sales_mgmt", title: "Satış Yönetimi", href: "/sales", icon: <Receipt className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "SELLER"], color: "bg-rose-50 text-rose-600" },
    { id: "customers", title: "Cari Hesaplar", href: "/customers", icon: <CheckSquare className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"], color: "bg-rose-50 text-rose-600" },
    { id: "suppliers", title: "Tedarikçi Ağı", href: "/suppliers", icon: <Building2 className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "BUYER"], color: "bg-emerald-50 text-emerald-600" },

    // Smart Systems
    { id: "control_tower", title: "Finansal Kontrol Kulesi", href: "/fintech/control-tower", icon: <Activity className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "RISK"], color: "bg-purple-50 text-purple-600" },

    // Ops
    { id: "inventory", title: "Envanter & Depo", href: "/inventory", icon: <PackageSearch className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-sky-50 text-sky-600" },

    // Field Sales
    { id: "fs_admin", title: "Saha Satış Yönetimi", href: "/field-sales/admin/routes", icon: <Settings className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-fuchsia-50 text-fuchsia-600" },
    { id: "fs_panel", title: "Saha Satış Paneli", href: "/field-sales", icon: <MapPin className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-fuchsia-50 text-fuchsia-600" },
    { id: "fs_live", title: "Canlı Saha Takibi", href: "/field-sales/admin/live", icon: <Clock className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-fuchsia-50 text-fuchsia-600" },
    { id: "quotes", title: "Teklifler", href: "/quotes", icon: <FileText className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-fuchsia-50 text-fuchsia-600" },
    { id: "service", title: "Servis Masası", href: "/service", icon: <HeadphonesIcon className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "STAFF"], color: "bg-teal-50 text-teal-600" },

    // Analysis
    { id: "ceo_metrics", title: "İş Zekası (CEO)", href: "/reports/ceo", icon: <FileBarChart2 className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-800 text-white" },
    { id: "reports", title: "Veri Analizi", href: "/reports", icon: <LineChart className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "GROWTH"], color: "bg-slate-800 text-white" },
    { id: "pdks", title: "PDKS Yönetimi", href: "/staff/pdks", icon: <Fingerprint className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-600" },
    { id: "audit_logs", title: "Denetim Kayıtları", href: "/admin/audit-logs", icon: <SearchCheck className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "RISK"], color: "bg-red-50 text-red-600" },
    { id: "suspicious", title: "Kaçak Satış Tespit", href: "/security/suspicious", icon: <ShieldAlert className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "RISK"], color: "bg-red-50 text-red-600" },

    // System
    { id: "support", title: "Destek Talepleri", href: "/support/tickets", icon: <HelpCircle className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "SELLER", "BUYER"], color: "bg-teal-50 text-teal-600" },
    { id: "advisor", title: "Mali Müşavir", href: "/advisor", icon: <Briefcase className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-600" },
    { id: "settings", title: "Sistem Ayarları", href: "/settings", icon: <Settings className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-600" },
    { id: "team", title: "Ekip & Yetki", href: "/staff", icon: <Users className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-600" },
    { id: "billing", title: "Abonelik & Planlar", href: "/billing", icon: <PieChart className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-amber-50 text-amber-600" },
    { id: "support_inbox", title: "Destek Masası (Inbox)", href: "/admin/support/tickets", icon: <Search className="w-5 h-5" />, roles: ["SUPER_ADMIN"], color: "bg-orange-50 text-orange-600" },
    { id: "knowledge", title: "Bilgi Bankası", href: "/admin/tenants/PLATFORM_ADMIN/help", icon: <FileText className="w-5 h-5" />, roles: ["SUPER_ADMIN"], color: "bg-orange-50 text-orange-600" },
];

export default function ClientDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { setIsSidebarOpen } = useApp();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const trackEvent = async (eventName: string, properties?: any) => {
        if (!mounted) return;
        try {
            await fetch("/api/metrics/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventName, properties })
            });
        } catch (err) { }
    };

    useEffect(() => {
        setMounted(true);
        setIsSidebarOpen(false);

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

    useEffect(() => {
        if (mounted) trackEvent("CONTROL_HUB_VIEWED");
    }, [mounted]);

    const userRole = (user?.role || "GUEST").toUpperCase();
    const setupNeeded = summary?.setup ? (!summary.setup.hasCompanyProfile || (!summary.setup.hasAnyProduct && !summary.setup.hasAnyRFQ)) : false;

    const isAuthorized = (roles: string[]) => {
        if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
        return roles.includes(userRole);
    };

    const allowedFeatures = ALL_MENU_KEYS.filter(f => isAuthorized(f.roles));

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans antialiased text-[#0F172A] dark:text-slate-200">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-8 flex flex-col gap-6">

                {/* Header Info */}
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">Workspace</h2>
                    <p className="text-sm text-[#64748B] dark:text-slate-400 mt-2">Sisteminize hoş geldiniz. Tüm uygulamalarınız parmaklarınızın ucunda.</p>
                </div>

                {/* Setup Notification */}
                {setupNeeded && !loading && (
                    <div className="bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 border border-blue-200 dark:border-blue-900 rounded-2xl p-6 shadow-sm flex items-start gap-5">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Info className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">Kurulum Bekleniyor</h3>
                            <p className="text-sm text-[#64748B] dark:text-slate-400 mb-4">Sistemin avantajlarından tam yararlanmak için öncelikli adımları tamamlayın.</p>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/settings/company" onClick={() => trackEvent("SETUP_ACTION_CLICKED", { which: 'company_profile' })} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm">
                                    Şirket Bilgileri
                                </Link>
                                <Link href="/seller/products" onClick={() => trackEvent("SETUP_ACTION_CLICKED", { which: 'import_products' })} className="px-5 py-2.5 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
                                    Ürünleri Ekle
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* PREMIUM INFO BOXES (STOK, FINANS, SIPARIS) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sipariş Info Box */}
                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <Send className="w-5 h-5" />
                                </div>
                                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">Sipariş & İşlem</h3>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tighter text-slate-900 dark:text-white">
                                    {loading ? "..." : summary?.dailyTxCount || 0}
                                </h1>
                                <p className="text-sm text-slate-500 font-medium mt-1">Bugünkü Toplam İşlem</p>
                            </div>
                        </div>
                    </div>

                    {/* Finans Info Box */}
                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                                    <Landmark className="w-5 h-5" />
                                </div>
                                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">Finansal Durum</h3>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tighter text-slate-900 dark:text-white">
                                    {loading ? "..." : formatter.format(summary?.collectedThisMonth || 0)}
                                </h1>
                                <p className="text-sm text-slate-500 font-medium mt-1">Aylık Tahsilat</p>
                            </div>
                        </div>
                    </div>

                    {/* Stok / Katalog Info Box */}
                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                    <PackageSearch className="w-5 h-5" />
                                </div>
                                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">Aktif Arayüzler & B2B</h3>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tighter text-slate-900 dark:text-white">
                                    {loading ? "..." : (summary?.rfqActive || 0) + (summary?.setup?.hasAnyProduct ? 1 : 0)}
                                </h1>
                                <p className="text-sm text-slate-500 font-medium mt-1">Aktif Sinyal (Ürün/Teklif)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FLAT PREMIUM GRID */}
                <div className="mt-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {!mounted || loading ? (
                            Array.from({ length: 15 }).map((_, i) => (
                                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[20px] animate-pulse"></div>
                            ))
                        ) : (
                            allowedFeatures.map(feat => (
                                <button
                                    key={feat.id}
                                    onClick={() => {
                                        trackEvent("FEATURE_TILE_CLICKED", { tileKey: feat.id });
                                        router.push(feat.href);
                                    }}
                                    className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 cursor-pointer"
                                >
                                    <div className={`p-4 rounded-[18px] mb-4 transition-transform duration-300 group-hover:-translate-y-1 ${feat.color}`}>
                                        {feat.icon}
                                    </div>
                                    <h4 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 text-center uppercase tracking-wider">{feat.title}</h4>
                                </button>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
