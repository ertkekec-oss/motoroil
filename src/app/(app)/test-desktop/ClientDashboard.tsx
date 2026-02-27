"use client";

import {
    Building2, ShoppingCart, Send, LayoutList,
    Wallet, TrendingUp, Briefcase, Users,
    PackageSearch, LineChart, HeadphonesIcon, Landmark,
    ArrowUpRight, Clock, ShieldAlert, Search,
    Activity, Percent, Info, AlertTriangle, ShieldCheck, PieChart, Banknote, Store, Receipt, MapPin, SearchCheck,
    Box, CheckSquare, BarChart3, Fingerprint, Settings, HelpCircle, FileText, FileBarChart2,
    ChevronRight, ArrowDownRight, FileDown, FileUp, BoxSelect
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

const ALL_MODULES = [
    { id: "terminal", title: "POS Terminal", desc: "Hızlı Perakende Satış", href: "/terminal", icon: <ShoppingCart className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER", "FINANCE"], color: "bg-orange-50 text-orange-600" },
    { id: "b2b_network", title: "B2B Network", desc: "Global Ağa Bağlanın", href: "/dashboard", icon: <Building2 className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "GROWTH", "BUYER", "SELLER"], color: "bg-blue-50 text-blue-600" },
    { id: "orders", title: "Orders", desc: "Sipariş Merkezi", href: "/network/seller/orders", icon: <Send className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER", "BUYER"], color: "bg-indigo-50 text-indigo-600" },
    { id: "catalog", title: "Catalog", desc: "Katalog & Ürünler", href: "/seller/products", icon: <Box className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER", "BUYER"], color: "bg-emerald-50 text-emerald-600" },
    { id: "finance_b2b", title: "Finance (B2B)", desc: "Ağ İçi Finans & Escrow", href: "/network/finance", icon: <Banknote className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "SELLER"], color: "bg-rose-50 text-rose-600" },
    { id: "growth", title: "Growth (Seller)", desc: "Boost & Güven Skoru", href: "/network/trust-score", icon: <TrendingUp className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "GROWTH", "SELLER"], color: "bg-amber-50 text-amber-600" },
    { id: "purchasing", title: "Purchasing (Buyer)", desc: "Sözleşme & RFQ", href: "/rfq", icon: <Briefcase className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "BUYER"], color: "bg-cyan-50 text-cyan-600" },
    { id: "staff", title: "Personel Paneli", desc: "Kişisel Portalınız", href: "/staff/me", icon: <Users className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "SELLER", "BUYER", "FINANCE", "GROWTH", "RISK"], color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
    { id: "accounting", title: "Finansal Yönetim", desc: "Kasa & Banka Bütçe", href: "/accounting", icon: <Landmark className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"], color: "bg-rose-50 text-rose-600" },
    { id: "sales", title: "Satış Yönetimi", desc: "Fatura ve Ciro İzleme", href: "/sales", icon: <Receipt className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "SELLER"], color: "bg-rose-50 text-rose-600" },
    { id: "customers", title: "Cari Hesaplar", desc: "Müşteri Bakiyeleri", href: "/customers", icon: <CheckSquare className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"], color: "bg-rose-50 text-rose-600" },
    { id: "suppliers", title: "Tedarikçi Ağı", desc: "Tedarikçi İlişkileri", href: "/suppliers", icon: <Building2 className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "BUYER"], color: "bg-emerald-50 text-emerald-600" },
    { id: "control_tower", title: "Finansal Kontrol Kulesi", desc: "Limit & Risk İzleme", href: "/fintech/control-tower", icon: <Activity className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "RISK"], color: "bg-purple-50 text-purple-600" },
    { id: "inventory", title: "Envanter & Depo", desc: "Stok Kontrol & Depolar", href: "/inventory", icon: <PackageSearch className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-sky-50 text-sky-600" },
    { id: "field_sales", title: "Saha Satış Yönetimi", desc: "Rota ve Canlı Takip", href: "/field-sales", icon: <MapPin className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-fuchsia-50 text-fuchsia-600" },
    { id: "quotes", title: "Teklifler", desc: "Özel Müşteri Fiyatları", href: "/quotes", icon: <FileText className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-fuchsia-50 text-fuchsia-600" },
    { id: "service", title: "Servis Masası", desc: "Bakım & Onarım Hizmeti", href: "/service", icon: <HeadphonesIcon className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "STAFF"], color: "bg-teal-50 text-teal-600" },
    { id: "analytics", title: "İş Zekası & Analiz", desc: "CEO Metrikleri & Veri", href: "/reports/ceo", icon: <LineChart className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "GROWTH", "FINANCE"], color: "bg-slate-800 text-white dark:bg-slate-700 dark:text-blue-100" },
    { id: "pdks", title: "PDKS Yönetimi", desc: "Vardiya ve Giriş/Çıkış", href: "/staff/pdks", icon: <Fingerprint className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
    { id: "audit_logs", title: "Denetim Kayıtları", desc: "Sistem ve İşlem Logları", href: "/admin/audit-logs", icon: <SearchCheck className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "RISK"], color: "bg-red-50 text-red-600" },
    { id: "suspicious", title: "Kaçak Satış Tespit", desc: "Şüpheli İşlem Uyarıları", href: "/security/suspicious", icon: <ShieldAlert className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "RISK"], color: "bg-red-50 text-red-600" },
    { id: "support_tickets", title: "Destek Talepleri", desc: "Kullanıcı İletişim Merkezi", href: "/support/tickets", icon: <HelpCircle className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "SELLER", "BUYER"], color: "bg-teal-50 text-teal-600" },
    { id: "advisor", title: "Mali Müşavir", desc: "E-Fatura & Beyanname", href: "/advisor", icon: <Briefcase className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
    { id: "settings", title: "Sistem Ayarları", desc: "Altyapı ve Yapılandırma", href: "/settings", icon: <Settings className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
    { id: "team", title: "Ekip & Yetki", desc: "Rol ve Kullanıcı Ata", href: "/staff", icon: <Users className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
    { id: "billing", title: "Abonelik & Planlar", desc: "Lisans ve Faturalar", href: "/billing", icon: <PieChart className="w-5 h-5" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-amber-50 text-amber-600" },
    { id: "support_inbox", title: "Destek Masası (Inbox)", desc: "Platform Gelen Kutusu", href: "/admin/support/tickets", icon: <Search className="w-5 h-5" />, roles: ["SUPER_ADMIN"], color: "bg-orange-50 text-orange-600" },
    { id: "knowledge", title: "Bilgi Bankası Yönetimi", desc: "Yardım Makaleleri", href: "/admin/tenants/PLATFORM_ADMIN/help", icon: <FileText className="w-5 h-5" />, roles: ["SUPER_ADMIN"], color: "bg-orange-50 text-orange-600" },
];

export default function ClientDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { setIsSidebarOpen } = useApp();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

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

    const allowedFeatures = ALL_MODULES.filter(f => isAuthorized(f.roles));
    const filteredFeatures = allowedFeatures.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.desc.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1120] font-sans">

            {/* L E F T   P A N E L  (MODULE LİSTESİ) */}
            <div className="w-[340px] xl:w-[380px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-white/5 flex flex-col h-full z-10 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.03)] hidden md:flex">
                <div className="p-6 pb-4">
                    <h2 className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-white mb-4">Modüller</h2>
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Modül ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-1.5 custom-scrollbar">
                    {!mounted ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                        ))
                    ) : (
                        filteredFeatures.map(feat => (
                            <button
                                key={feat.id}
                                onClick={() => {
                                    trackEvent("FEATURE_TILE_CLICKED", { tileKey: feat.id });
                                    router.push(feat.href);
                                }}
                                className="w-full text-left group flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all duration-200 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50 cursor-pointer min-h-[64px]"
                            >
                                <div className={`p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-105 shrink-0 ${feat.color}`}>
                                    {feat.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 tracking-tight truncate">{feat.title}</h4>
                                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{feat.desc}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 transition-colors shrink-0 mr-1" />
                            </button>
                        ))
                    )}
                    {mounted && filteredFeatures.length === 0 && (
                        <div className="text-center py-10">
                            <BoxSelect className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 font-medium">Eşleşen modül bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* R I G H T   P A N E L  (DASHBOARD) */}
            <div className="flex-1 overflow-y-auto w-full p-4 sm:p-8 relative custom-scrollbar">
                <div className="max-w-[1200px] mx-auto space-y-8 pb-20">

                    {/* Header Info */}
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">Workspace Dashboard</h2>
                        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-2">Finansal rotanızı ve operasyon ağınızı buradan izleyin.</p>
                    </div>

                    {/* Setup Notification */}
                    {setupNeeded && !loading && mounted && (
                        <div className="bg-gradient-to-r from-blue-50/80 to-white dark:from-slate-800/80 dark:to-slate-900 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl p-6 shadow-[0_4px_24px_-8px_rgba(37,99,235,0.1)] flex items-start gap-5">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Info className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">Kurulum Bekleniyor</h3>
                                <p className="text-sm text-[#64748B] dark:text-slate-400 mb-4">Sistemin avantajlarından tam yararlanmak için öncelikli adımları tamamlayın.</p>
                                <div className="flex flex-wrap gap-3">
                                    <Link href="/settings/company" onClick={() => trackEvent("SETUP_ACTION_CLICKED", { which: 'company_profile' })} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm">
                                        Şirket Bilgileri
                                    </Link>
                                    <Link href="/seller/products" onClick={() => trackEvent("SETUP_ACTION_CLICKED", { which: 'import_products' })} className="px-5 py-2.5 bg-white border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
                                        Ürünleri Ekle
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DASHBOARD KUTULARI (PREMIUM SOFTNESS) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                        {/* 1. SİPARİŞLER KUTUSU */}
                        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.1)] transition-shadow duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                        <Send className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">Eşzamanlı Siparişler</h3>
                                </div>
                                <div className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl flex items-center gap-1">
                                    <Activity className="w-3.5 h-3.5" /> Canlı
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium whitespace-nowrap">Pazaryeri & B2B Ağ:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{loading ? "..." : (summary?.rfqActive || 0) + 14}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium whitespace-nowrap">Mağaza (POS):</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{loading ? "..." : (summary?.dailyTxCount || 0) + 42}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium whitespace-nowrap">Saha Satış / Rota:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{loading ? "..." : 8}</span>
                                </div>
                                <div className="pt-3 mt-3 border-t border-slate-100/80 dark:border-slate-800 flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Aktif Bayi Siparişi:</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">3 Adet</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. STOK DURUMU KUTUSU */}
                        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.1)] transition-shadow duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                                        <PackageSearch className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">Stok & Depo Sağlığı</h3>
                                </div>
                            </div>

                            <div className="flex items-end gap-3 mb-6">
                                <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
                                    {loading ? "..." : "84%"}
                                </h1>
                                <p className="text-sm text-slate-500 font-medium mb-1">Mevcut Doluluk</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Toplam SKU:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{loading ? "..." : "1,420"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl">
                                    <span className="font-bold">Stoğu Azalan (Riskli):</span>
                                    <span className="font-extrabold">24 Ürün</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. TAHSİLAT & FİNANS KUTUSU */}
                        <div className="relative overflow-hidden rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-white/5 p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.4)] transition-shadow duration-300 text-white">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/10 text-slate-100 rounded-xl border border-white/10">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-[15px] font-bold tracking-tight">Nakit Akışı & Ödemeler</h3>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5"><ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" /> Yaklaşan Tahsilat</p>
                                        <h4 className="text-lg font-bold text-emerald-400">{loading ? "..." : formatter.format(summary?.escrowPending || 0)}</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5 justify-end"><ArrowUpRight className="w-3.5 h-3.5 text-rose-400" /> Yaklaşan Ödeme</p>
                                        <h4 className="text-lg font-bold text-rose-400">{loading ? "..." : formatter.format((summary?.escrowPending || 0) * 0.4)}</h4>
                                    </div>
                                </div>

                                <div className="h-px bg-white/10 w-full my-4"></div>

                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm font-medium">Bugünkü Giderler:</span>
                                    <span className="text-sm font-bold opacity-90">{loading ? "..." : formatter.format(2450)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm font-medium">Toplam Kasa Durumu:</span>
                                    <span className="text-base font-bold text-white">{loading ? "..." : formatter.format((summary?.collectedThisMonth || 0) + 150000)}</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. FATURAlAR VE İRSALİYELER */}
                        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.1)] transition-shadow duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">Faturalar & İrsaliyeler</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <FileDown className="w-5 h-5 text-emerald-500 mb-2" />
                                    <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-200">28</h4>
                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Gelen (Bu Hafta)</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <FileUp className="w-5 h-5 text-indigo-500 mb-2" />
                                    <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-200">145</h4>
                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Giden (Bu Hafta)</p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl">
                                <span className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> Onay Bekleyen:</span>
                                <span className="text-base font-extrabold">12 Adet</span>
                            </div>
                        </div>

                    </div>
                    {/* DASHBOARD KUTULARI SONU */}
                </div>
            </div>
        </div>
    );
}
