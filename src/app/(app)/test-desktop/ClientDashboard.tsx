"use client";

import {
    Building2, ShoppingCart, Send, LayoutList,
    Wallet, TrendingUp, Briefcase, Users,
    PackageSearch, LineChart, HeadphonesIcon, Landmark,
    ArrowUpRight, Clock, ShieldAlert, Search,
    Activity, Percent, Info, AlertTriangle, ShieldCheck, PieChart, Banknote, Store, Receipt, MapPin, SearchCheck,
    Box, CheckSquare, BarChart3, Fingerprint, Settings, HelpCircle, FileText, FileBarChart2,
    ChevronRight, ArrowDownRight, FileDown, FileUp, BoxSelect, Bell,
    Truck, Zap, AlertCircle, Check, Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import Link from "next/link";
import { useRouter } from "next/navigation";

const formatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 });
const pFormatter = new Intl.NumberFormat('tr-TR', { style: 'percent', minimumFractionDigits: 1 });

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
    cashDetails: {
        creditCard: number;
        cash: number;
        wire: number;
    };
    stockHealth: {
        totalSku: number;
        lowStock: number;
        overStock: number;
        inShipment: number;
        noShipment: number;
    };
    invoiceStatus: {
        incoming: number;
        outgoing: number;
        pending: number;
    };
    serviceDesk: {
        enteredToday: number;
        currentlyInService: number;
    };
    pdksRules: {
        currentStaffCount: number;
        checkedInCount: number;
        notCheckedInCount: number;
        lateCount: number;
    };
    autonomous: {
        updatedProducts: number;
        avgMarginChange: number;
        riskyDeviation: number;
    };
    notificationsApp: {
        pendingApprovals: number;
        newNotifications: number;
        criticalAlerts: number;
    };
}

const ALL_MODULES = [
    { id: "terminal", title: "POS Terminal", desc: "Hızlı Perakende Satış", href: "/terminal", icon: <ShoppingCart className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER", "FINANCE"], color: "bg-orange-50 text-orange-600 border-orange-100" },
    { id: "b2b_network", title: "B2B Network", desc: "Global Ağa Bağlanın", href: "/dashboard", icon: <Building2 className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "GROWTH", "BUYER", "SELLER"], color: "bg-blue-50 text-blue-600 border-blue-100" },
    { id: "orders", title: "Siparişler", desc: "Sipariş Merkezi", href: "/network/seller/orders", icon: <Send className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER", "BUYER"], color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
    { id: "catalog", title: "Katalog", desc: "Ürün Yönetimi", href: "/seller/products", icon: <Box className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER", "BUYER"], color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { id: "finance_b2b", title: "Finans (B2B)", desc: "Ağ İçi Finans", href: "/network/finance", icon: <Banknote className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "SELLER"], color: "bg-rose-50 text-rose-600 border-rose-100" },
    { id: "growth", title: "Büyüme & Güven", desc: "Performans İzleme", href: "/network/trust-score", icon: <TrendingUp className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "GROWTH", "SELLER"], color: "bg-amber-50 text-amber-600 border-amber-100" },
    { id: "purchasing", title: "Satınalma", desc: "Tedarik ve Sözleşme", href: "/rfq", icon: <Briefcase className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "BUYER"], color: "bg-cyan-50 text-cyan-600 border-cyan-100" },
    { id: "staff", title: "Personel Paneli", desc: "Kişisel Portalınız", href: "/staff/me", icon: <Users className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "SELLER", "BUYER", "FINANCE", "GROWTH", "RISK"], color: "bg-slate-100 text-slate-800 border-slate-200" },
    { id: "accounting", title: "Mali İşler", desc: "Kasa & Banka Bütçe", href: "/accounting", icon: <Landmark className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"], color: "bg-rose-50 text-rose-600 border-rose-100" },
    { id: "sales", title: "Satış İşlemleri", desc: "Fatura ve Ciro", href: "/sales", icon: <Receipt className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "SELLER"], color: "bg-rose-50 text-rose-600 border-rose-100" },
    { id: "customers", title: "Cari Hesaplar", desc: "Bakiye Yönetimi", href: "/customers", icon: <CheckSquare className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"], color: "bg-rose-50 text-rose-600 border-rose-100" },
    { id: "suppliers", title: "Tedarikçiler", desc: "Kurumsal İlişkiler", href: "/suppliers", icon: <Building2 className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "BUYER"], color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { id: "control_tower", title: "Kontrol Kulesi", desc: "Otonom Finans", href: "/fintech/control-tower", icon: <Activity className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "RISK"], color: "bg-purple-50 text-purple-600 border-purple-100" },
    { id: "inventory", title: "Depo & Envanter", desc: "Stok Kontrolü", href: "/inventory", icon: <PackageSearch className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-sky-50 text-sky-600 border-sky-100" },
    { id: "field_sales", title: "Saha Satış", desc: "Rota & Takip", href: "/field-sales", icon: <MapPin className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100" },
    { id: "quotes", title: "Teklifler", desc: "Fiyatlamalar", href: "/quotes", icon: <FileText className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "SELLER"], color: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100" },
    { id: "service", title: "Servis Masası", desc: "Müşteri Hizmetleri", href: "/service", icon: <HeadphonesIcon className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "STAFF"], color: "bg-teal-50 text-teal-600 border-teal-100" },
    { id: "analytics", title: "İş Zekası", desc: "Analiz & Raporlar", href: "/reports/ceo", icon: <LineChart className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "GROWTH", "FINANCE"], color: "bg-slate-800 text-white border-slate-700" },
    { id: "pdks", title: "PDKS Yönetimi", desc: "Vardiya & Giriş", href: "/staff/pdks", icon: <Fingerprint className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-800 border-slate-200" },
    { id: "audit_logs", title: "Denetim Logları", desc: "Sistem İzleme", href: "/admin/audit-logs", icon: <SearchCheck className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "RISK"], color: "bg-red-50 text-red-600 border-red-100" },
    { id: "suspicious", title: "Kaçak Tespiti", desc: "Güvenlik Uyarıları", href: "/security/suspicious", icon: <ShieldAlert className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "RISK"], color: "bg-red-100 text-red-700 border-red-200" },
    { id: "support_tickets", title: "Destek Talepleri", desc: "Ticket Yönetimi", href: "/support/tickets", icon: <HelpCircle className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "SELLER", "BUYER"], color: "bg-teal-50 text-teal-600 border-teal-100" },
    { id: "advisor", title: "Mali Müşavir", desc: "E-Beyanname", href: "/advisor", icon: <Briefcase className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-800 border-slate-200" },
    { id: "settings", title: "Ayarlar", desc: "Sistem Yapılandırma", href: "/settings", icon: <Settings className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-800 border-slate-200" },
    { id: "team", title: "Ekip Yönetimi", desc: "Kullanıcı Profilleri", href: "/staff", icon: <Users className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-slate-100 text-slate-800 border-slate-200" },
    { id: "billing", title: "Abonelik", desc: "Lisans Planları", href: "/billing", icon: <PieChart className="w-6 h-6" />, roles: ["SUPER_ADMIN", "ADMIN"], color: "bg-amber-50 text-amber-600 border-amber-100" },
];

const MOCK_ANNOUNCEMENTS = [
    { id: 1, title: "Sistem Güncellemesi", msg: "Q1 finansal kapanışları için yeni ledger modülü aktif edildi.", link: "/settings/updates", tag: "DUYURU", color: "text-blue-600 bg-blue-100" },
    { id: 2, title: "Otonom Fiyatlandırma", msg: "B2B Ağında otomatik fiyatlama motoru yayına alındı. Ayarları inceleyin.", link: "/fintech/control-tower", tag: "YENİ", color: "text-emerald-600 bg-emerald-100" },
    { id: 3, title: "Bakım Çalışması", msg: "Cumartesi gece 03:00'da kısa süreli altyapı bakımı yapılacaktır.", link: "#", tag: "BAKIM", color: "text-amber-600 bg-amber-100" },
];

export default function ClientDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { setIsSidebarOpen, setIsDesktopSidebarCollapsed } = useApp();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [announcementIdx, setAnnouncementIdx] = useState(0);
    const [isHoveringAnnouncements, setIsHoveringAnnouncements] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        if (isHoveringAnnouncements) return;

        const timer = setInterval(() => {
            setAnnouncementIdx((prev) => (prev + 1) % MOCK_ANNOUNCEMENTS.length);
        }, 10000); // 10 seconds rotate
        return () => clearInterval(timer);
    }, [isHoveringAnnouncements]);

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
        setIsDesktopSidebarCollapsed(true);

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
    }, [setIsSidebarOpen, setIsDesktopSidebarCollapsed]);

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

    // Safe read helpers
    const d = summary || undefined;

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1120] font-sans">

            {/* L E F T   P A N E L  (MODÜL GRID) */}
            <div className="w-[360px] xl:w-[480px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-white/5 flex flex-col h-full z-10 shadow-[8px_0_30px_-15px_rgba(0,0,0,0.05)] hidden md:flex overflow-hidden">
                <div className="p-8 pb-6 bg-gradient-to-b from-white to-white/90 dark:from-slate-900 dark:to-slate-900/90 backdrop-blur-md z-20">
                    <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-5">Sistem Modülleri</h2>
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Arama yap..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-100/70 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/50 border border-transparent focus:border-blue-500/30 rounded-2xl text-base font-medium text-slate-800 dark:text-slate-200 transition-all focus:shadow-[0_4px_20px_-5px_rgba(37,99,235,0.15)] focus:outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Hide Scrollbar, Touch-first padding, Two-column Grid Layout */}
                <div className="flex-1 overflow-y-auto px-8 pb-12" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />
                    <div className="grid grid-cols-2 gap-4">
                        {!mounted ? (
                            Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="h-32 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                            ))
                        ) : (
                            filteredFeatures.map(feat => (
                                <button
                                    key={feat.id}
                                    onClick={() => {
                                        trackEvent("FEATURE_TILE_CLICKED", { tileKey: feat.id });
                                        router.push(feat.href);
                                    }}
                                    className="text-left flex flex-col items-start p-5 rounded-[20px] transition-transform active:scale-95 border border-slate-200/60 hover:border-slate-300 dark:border-slate-700/50 dark:hover:border-slate-600 focus:outline-none shadow-sm hover:shadow-md cursor-pointer bg-white dark:bg-slate-800 group"
                                >
                                    <div className={`p-3 rounded-2xl mb-4 shadow-sm ${feat.color.replace('border-', 'border border-')}`}>
                                        {feat.icon}
                                    </div>
                                    <h4 className="text-[15px] font-extrabold text-[#0F172A] dark:text-white tracking-tight leading-tight">{feat.title}</h4>
                                    <p className="text-[12px] font-semibold text-slate-500 mt-1 line-clamp-2 leading-snug">{feat.desc}</p>
                                </button>
                            ))
                        )}
                        {mounted && filteredFeatures.length === 0 && (
                            <div className="col-span-2 text-center py-16">
                                <BoxSelect className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                                <p className="text-base text-slate-500 font-bold">Modül bulunamadı.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* R I G H T   P A N E L  (DASHBOARD CARDS) */}
            <div
                className="flex-1 overflow-y-auto w-full p-4 sm:p-8 xl:p-12 relative"
                style={{ scrollbarWidth: 'none' }}
                onScroll={(e) => {
                    if (e.currentTarget.scrollTop > 120) {
                        if (!isScrolled) setIsScrolled(true);
                    } else {
                        if (isScrolled) setIsScrolled(false);
                    }
                }}
            >
                <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />
                <div className="max-w-[1400px] mx-auto space-y-8 pb-24">

                    {/* Header Info */}
                    <div className="mb-6 xl:mb-8">
                        <h2 className="text-[32px] sm:text-[40px] font-[700] tracking-tight text-[#0F172A] dark:text-white leading-tight mb-1">PERİODYA DASHBOARD</h2>
                        <p className="text-[14px] font-semibold text-slate-500 tracking-wide uppercase whitespace-nowrap overflow-hidden text-ellipsis w-full opacity-80">Tüm Kurumsal Ağın Gerçek Zamanlı Özeti</p>
                    </div>

                    {/* Dual Side-by-Side Signal Bar V3 (Enterprise Polish) */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-10 transition-all duration-300 relative z-40 w-full items-start">

                        {/* 1. CANLI SİSTEM AKIŞI BAR (60%) */}
                        <div
                            className={`bg-white dark:bg-[#080911] border border-[#0F172A]/[0.06] dark:border-white/5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-all duration-250 ease-in-out overflow-hidden flex flex-col justify-center relative flex-shrink-0
                                ${isScrolled
                                    ? 'h-[42px] rounded-[16px] px-5 bg-white/80 dark:bg-[#080911]/80 backdrop-blur-xl sticky top-2 z-[60] ring-1 ring-[#0F172A]/[0.04] dark:ring-white/10 shadow-lg -translate-y-4'
                                    : 'h-[72px] rounded-[22px] px-6 py-[16px] lg:w-[60%] w-full'}`}
                            style={isScrolled ? { width: '100%', maxWidth: '600px', margin: '0 auto' } : {}}
                            onMouseEnter={() => setIsHoveringAnnouncements(true)}
                            onMouseLeave={() => setIsHoveringAnnouncements(false)}
                        >
                            {!isScrolled ? (
                                <div className="flex flex-col justify-center w-full h-full">
                                    <div className="flex items-center gap-2 mb-1.2 opacity-90">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 dark:bg-slate-300 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
                                        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">CANLI SİSTEM AKIŞI</span>
                                    </div>
                                    <div className="relative w-full h-[24px]">
                                        {MOCK_ANNOUNCEMENTS.map((ann, idx) => (
                                            <div
                                                key={ann.id}
                                                className={`absolute inset-0 flex items-center justify-between transition-opacity duration-300 ease-in-out ${idx === announcementIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                                            >
                                                <div className="text-[15px] xl:text-[16px] font-[600] text-[#0F172A] dark:text-white line-clamp-1 pr-4">
                                                    {ann.title}
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700/50 hidden sm:inline-block tracking-wide">YENİ</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5 w-full h-full animate-in fade-in duration-300">
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-700 dark:bg-slate-300 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
                                    <div className="text-[13px] font-[600] text-[#0F172A] dark:text-white line-clamp-1 flex-1">
                                        <span className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-black mr-2 opacity-80">CANLI</span>
                                        {MOCK_ANNOUNCEMENTS[announcementIdx]?.title}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. STRATEJİK DUYURU BAR (40%) */}
                        <div
                            className={`bg-[#FBFCFE] dark:bg-white/[0.012] border border-[#0F172A]/[0.06] dark:border-white/5 shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition-all duration-300 ease-in-out overflow-hidden flex flex-col justify-center flex-shrink-0
                                ${isScrolled
                                    ? 'h-0 opacity-0 border-none px-0 py-0 m-0 scale-y-0 origin-top xl:w-0 w-0 hidden'
                                    : 'h-[72px] rounded-[22px] px-6 py-[16px] lg:w-[40%] w-full opacity-100 scale-y-100'}`}
                        >
                            <div className="flex flex-col justify-center w-full h-full relative">
                                <div className="flex items-center gap-2 mb-1.2 opacity-90">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">STRATEJİK</span>
                                </div>
                                <div className="flex items-center justify-between w-full h-[24px]">
                                    <div className="text-[15px] xl:text-[16px] font-[700] text-[#0F172A] dark:text-white line-clamp-1 pr-16 w-full">
                                        Otonom Fiyatlandırma Aktif
                                    </div>
                                    <div className="flex-shrink-0 absolute right-0">
                                        <Link href="#" className="text-[12px] font-bold text-slate-400 hover:text-[#0F172A] dark:text-slate-300 transition-colors">Detaylar →</Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Setup Notification (Executive Timeline) */}
                    {setupNeeded && !loading && mounted && (() => {
                        const isS1Complete = !!summary?.setup?.hasCompanyProfile;
                        const isS2Complete = !!summary?.setup?.hasAnyProduct;
                        const isS3Complete = !!summary?.setup?.hasAtLeastOneOrder;
                        const isS4Complete = false;

                        const steps = [
                            { id: 1, title: "Şirket Profili", desc: "Temel işletme bilgileri", status: isS1Complete ? 'completed' : 'active', href: "/settings/company" },
                            { id: 2, title: "Katalog Aktarımı", desc: "Ürün ve fiyat listeleri", status: isS2Complete ? 'completed' : (isS1Complete ? 'active' : 'locked'), href: "/seller/products" },
                            { id: 3, title: "İlk Sipariş", desc: "Test veya gerçek sipariş", status: isS3Complete ? 'completed' : (isS2Complete ? 'active' : 'locked'), href: "/network/seller/orders" },
                            { id: 4, title: "Otonom İşlemler", desc: "Akıllı süreç eşleşmesi", status: isS4Complete ? 'completed' : (isS3Complete ? 'active' : 'locked'), href: "/fintech/control-tower" },
                        ];
                        const completedNodesCount = steps.filter(s => s.status === 'completed').length;
                        const progressPercent = Math.round((completedNodesCount / steps.length) * 100);

                        return (
                            <div className="bg-white dark:bg-[#080911] border border-slate-100 dark:border-white/5 rounded-[24px] p-[40px] shadow-[0_15px_60px_-15px_rgba(0,0,0,0.05)] select-none w-full mb-10 min-h-[160px] flex flex-col justify-between relative overflow-hidden group">
                                {/* Header Strip */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 w-full z-10">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl hidden md:flex">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-[20px] font-extrabold text-[#0F172A] dark:text-white leading-tight">Kurulum Merkezi</h3>
                                            <p className="text-[14px] font-semibold text-slate-500 mt-1">İşletme aktivasyon sürecinizi tamamlayın</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:items-end w-full md:w-48">
                                        <div className="text-[14px] font-black text-[#0F172A] dark:text-slate-200 mb-2.5">%{progressPercent} Tamamlandı</div>
                                        <div className="w-full h-[6px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Horizontal Timeline */}
                                <div className="relative w-full z-10 mt-2">
                                    {/* Line Container (Centered between the first and last node) */}
                                    <div className="absolute top-[21px] left-[12.5%] right-[12.5%] h-[2px] bg-slate-100 dark:bg-slate-800 z-0 rounded-full">
                                        <div className="absolute top-0 left-0 h-full bg-blue-600 z-0 transition-all duration-1000 rounded-full" style={{ width: `${Math.min(100, Math.max(0, ((completedNodesCount) / (steps.length - 1)) * 100))}%` }}></div>
                                    </div>

                                    {/* Nodes Flex */}
                                    <div className="flex justify-between w-full relative z-10">
                                        {steps.map((step, idx) => (
                                            <div key={step.id}
                                                className={`flex flex-col items-center text-center w-[25%] transition-transform duration-300 ${step.status === 'active' || step.status === 'completed' ? 'cursor-pointer hover:-translate-y-1' : ''}`}
                                                onClick={() => step.status === 'active' || step.status === 'completed' ? router.push(step.href) : null}>

                                                {/* Node Circle */}
                                                <div className={`w-[44px] h-[44px] rounded-full flex items-center justify-center mb-4 transition-all duration-300 z-10 relative bg-white dark:bg-[#080911] 
                                                    ${step.status === 'completed' ? 'bg-blue-600 border-[3px] border-blue-600 text-white shadow-md'
                                                        : step.status === 'active' ? 'border-[3px] border-blue-600 text-blue-600 shadow-md ring-4 ring-blue-50 dark:ring-blue-900/20'
                                                            : 'border-[3px] border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'}`
                                                }>
                                                    {step.status === 'completed' ? <Check className="w-5 h-5 stroke-[3]" /> : <span className="text-[17px] font-black">{step.id}</span>}
                                                </div>

                                                {/* Title & Desc */}
                                                <div className="px-2 w-full flex flex-col items-center">
                                                    <h4 className={`text-[15px] max-w-[150px] font-extrabold mb-1.5 transition-colors line-clamp-1
                                                            ${step.status === 'completed' ? 'text-slate-800 dark:text-white'
                                                            : step.status === 'active' ? 'text-blue-700 dark:text-blue-400'
                                                                : 'text-slate-400 dark:text-slate-600'}`
                                                    }>
                                                        {step.title}
                                                    </h4>
                                                    <p className="text-[12px] font-semibold text-slate-500 line-clamp-1 max-w-[140px] leading-relaxed hidden sm:block">
                                                        {step.desc}
                                                    </p>
                                                </div>

                                                {/* Status Action / Badge */}
                                                <div className="mt-3.5 h-7 flex items-center justify-center">
                                                    {step.status === 'active' && (
                                                        <div className="text-[12px] font-black text-blue-600 hover:text-white hover:bg-blue-600 transition-colors bg-blue-50 dark:bg-blue-900/30 dark:hover:bg-blue-600 px-4 py-1.5 rounded-full whitespace-nowrap">
                                                            Tamamla
                                                        </div>
                                                    )}
                                                    {step.status === 'locked' && (
                                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                                                            <Lock className="w-3.5 h-3.5" /> Kilitli
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* WIDGET GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">

                        {/* 1. NAKİT AKIŞI & ÖDEMELER KARTI (LEDGER SOT) */}
                        <div className="group overflow-hidden rounded-[24px] bg-slate-900 border border-slate-800 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] transition-all flex flex-col">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 text-white rounded-2xl backdrop-blur-xl">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-[17px] font-bold text-white tracking-tight">Finans & Likidite</h3>
                                </div>
                                <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black tracking-widest uppercase rounded-lg border border-indigo-500/20">Ledger SoT</span>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8 mt-auto">
                                <div>
                                    <p className="text-[13px] text-slate-400 font-bold mb-2 flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-emerald-400" /> Yaklaşan Tahsilat</p>
                                    <h4 className="text-2xl font-black text-white">{loading ? "..." : formatter.format(d?.escrowPending || 0)}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[13px] text-slate-400 font-bold mb-2 flex items-center gap-2 justify-end"><ArrowUpRight className="w-4 h-4 text-rose-400" /> Yaklaşan Ödeme</p>
                                    <h4 className="text-2xl font-black text-rose-400">{loading ? "..." : formatter.format((d?.escrowPending || 0) * 0.4)}</h4>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                                <h5 className="text-[11px] font-black text-slate-500 tracking-widest uppercase mb-4">Kasa Durumları</h5>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-300 text-sm font-semibold">Nakit Kasa</span>
                                        <span className="text-sm font-bold text-white">{loading ? "..." : formatter.format(d?.cashDetails?.cash || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-300 text-sm font-semibold">Kredi Kartı Bekleyen</span>
                                        <span className="text-sm font-bold text-white">{loading ? "..." : formatter.format(d?.cashDetails?.creditCard || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-300 text-sm font-semibold">Havale / EFT Hesapları</span>
                                        <span className="text-sm font-bold text-white">{loading ? "..." : formatter.format(d?.cashDetails?.wire || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. STOK & DEPO SAĞLIĞI */}
                        <div className="overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-8 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_45px_-15px_rgba(0,0,0,0.12)] transition-all flex flex-col">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                        <PackageSearch className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">Depo & Stok Sağlığı</h3>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-8 mt-auto px-2">
                                <div>
                                    <p className="text-[13px] text-slate-500 font-bold mb-2 uppercase tracking-wide">Aktif SKU</p>
                                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                                        {loading ? "..." : d?.stockHealth?.totalSku || 0}
                                    </h1>
                                </div>
                                <div className="text-right">
                                    <p className="text-[13px] text-slate-500 font-bold mb-2 uppercase tracking-wide">Yoldaki Ürünler</p>
                                    <h2 className="text-2xl font-black text-indigo-600">
                                        {loading ? "..." : d?.stockHealth?.inShipment || 0}
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <span className="font-semibold text-sm text-slate-600 dark:text-slate-300">Stok Fazlası (Otonom)</span>
                                    <span className="font-bold text-sm text-slate-900">{loading ? "..." : d?.stockHealth?.overStock || 0} Adet</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 flex items-center justify-between p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100">
                                        <span className="font-bold text-sm">Kritik Stok</span>
                                        <span className="font-black text-base">{loading ? "..." : d?.stockHealth?.lowStock || 0}</span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className="font-bold text-sm text-slate-600">Sevkiyat Yok</span>
                                        <span className="font-black text-base text-slate-800">{loading ? "..." : d?.stockHealth?.noShipment || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* 4. PDKS & PERSONEL ÖZETİ */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "HR", "RISK"])) && (
                            <div className="overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-8 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Fingerprint className="w-6 h-6" /></div>
                                    <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">Vardiya & PDKS Durumu</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-auto">
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                        <h4 className="text-3xl font-black text-slate-800">{loading ? "..." : d?.pdksRules?.currentStaffCount || 0}</h4>
                                        <p className="text-sm font-bold text-slate-500 mt-1">Aktif Personel</p>
                                    </div>
                                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                        <h4 className="text-3xl font-black text-emerald-700">{loading ? "..." : d?.pdksRules?.checkedInCount || 0}</h4>
                                        <p className="text-sm font-bold text-emerald-600 mt-1">Giriş Yapan</p>
                                    </div>
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center px-6 col-span-2">
                                        <span className="font-bold text-sm text-slate-600">Henüz Gelmeyen / İzinli:</span>
                                        <span className="font-black text-base text-slate-800">{loading ? "..." : d?.pdksRules?.notCheckedInCount || 0}</span>
                                    </div>
                                    <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 flex justify-between items-center px-6 col-span-2">
                                        <span className="font-bold text-sm text-rose-700">Geç Kalan İhlali:</span>
                                        <span className="font-black text-base text-rose-700">{loading ? "..." : d?.pdksRules?.lateCount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. SERVİS MASASI */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "STAFF", "SELLER"])) && (
                            <div className="overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-8 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl"><HeadphonesIcon className="w-6 h-6" /></div>
                                    <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">Servis & Bakım Ağı</h3>
                                </div>
                                <div className="mt-auto space-y-4">
                                    <div className="relative p-6 bg-slate-900 text-white rounded-3xl overflow-hidden shadow-lg border border-slate-800 flex items-center justify-between">
                                        <div className="relative z-10">
                                            <p className="text-[13px] text-slate-400 font-bold uppercase tracking-wider mb-2">Şu an Serviste Olan</p>
                                            <h1 className="text-5xl font-black text-cyan-400">{loading ? "..." : d?.serviceDesk?.currentlyInService || 0}</h1>
                                        </div>
                                        <Activity className="absolute right-0 top-1/2 -translate-y-1/2 w-40 h-40 text-white opacity-5 pointer-events-none" />
                                    </div>
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                        <span className="font-bold text-sm text-slate-600">Bugün Yeni Giren Kayıt:</span>
                                        <span className="font-black text-lg text-slate-800">+{loading ? "..." : d?.serviceDesk?.enteredToday || 0}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6. FATURALAR VE İRSALİYELER */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "FINANCE", "RISK"])) && (
                            <div className="overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-8 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><FileText className="w-6 h-6" /></div>
                                        <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">E-Belge İşlemleri</h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-auto">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <FileDown className="w-6 h-6 text-emerald-500 mb-4" />
                                        <h4 className="text-3xl font-black text-slate-800">{loading ? "..." : d?.invoiceStatus?.incoming || 0}</h4>
                                        <p className="text-[13px] text-slate-500 mt-1 font-bold">Gelen (Bu Hafta)</p>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <FileUp className="w-6 h-6 text-indigo-500 mb-4" />
                                        <h4 className="text-3xl font-black text-slate-800">{loading ? "..." : d?.invoiceStatus?.outgoing || 0}</h4>
                                        <p className="text-[13px] text-slate-500 mt-1 font-bold">Giden (Bu Hafta)</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between px-6 py-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
                                    <span className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> Onaylanacak Belgeler:</span>
                                    <span className="text-lg font-black">{loading ? "..." : d?.invoiceStatus?.pending || 0} Adet</span>
                                </div>
                            </div>
                        )}

                        {/* 7. OTONOM FİYATLANDIRMA ÖZETİ */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "FINANCE", "RISK"])) && (
                            <div className="overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-8 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-400"></div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Activity className="w-6 h-6" /></div>
                                    <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">Otonom Fiyatlandırma</h3>
                                </div>
                                <div className="mt-auto space-y-4">
                                    <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                <LineChart className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-purple-900 text-[14px]">Otonom Güncellenen SKU</p>
                                                <p className="font-semibold text-purple-700/60 text-[11px] uppercase tracking-wide">Bugün</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-black text-purple-600">{loading ? "..." : d?.autonomous?.updatedProducts || 0}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Ort. Marj</p>
                                            <div className="text-xl font-black text-emerald-600">+{loading ? "..." : d?.autonomous?.avgMarginChange || 0}%</div>
                                        </div>
                                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[11px] font-bold text-rose-800 uppercase tracking-widest mb-1">Riskli Sapma</p>
                                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <div className="text-xl font-black text-rose-600">{loading ? "..." : d?.autonomous?.riskyDeviation || 0} <span className="text-xs font-bold text-rose-500/70">Ürün</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 8. BİLDİRİMLER VE ONAYLAR (GENİŞLETİLMİŞ) */}
                        <div className="md:col-span-full lg:col-span-2 2xl:col-span-3 overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-8 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_45px_-15px_rgba(0,0,0,0.12)] transition-all flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">Onaylar & Alarmlar</h3>
                                </div>
                                {(d?.notificationsApp?.criticalAlerts || 0) > 0 && (
                                    <div className="px-3 py-1 bg-red-500 text-white text-[11px] font-black tracking-widest uppercase rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                        <AlertTriangle className="w-3 h-3" /> Kritik Uyarı Var
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                                            <CheckSquare className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-amber-900 text-[15px]">Bekleyen Onaylar</p>
                                            <p className="font-medium text-amber-700/70 text-[12px] line-clamp-1">Fatura, Escrow ve Sözleşme</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-black text-amber-600 ml-4">{loading ? "..." : d?.notificationsApp?.pendingApprovals || 0}</div>
                                </div>

                                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                                            <MessageCircle className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-blue-900 text-[15px]">Okunmamış Bildirim</p>
                                            <p className="font-medium text-blue-700/70 text-[12px] line-clamp-1">Sistem güncelleme / Uyarı</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-black text-blue-600 ml-4">{loading ? "..." : d?.notificationsApp?.newNotifications || 0}</div>
                                </div>

                                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-rose-900 text-[15px]">Kaçak / Riskli İşlem</p>
                                            <p className="font-medium text-rose-700/70 text-[12px] line-clamp-1">Kritik güvenlik sekmesi</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-rose-600 text-2xl ml-4">{loading ? "..." : d?.notificationsApp?.criticalAlerts || 0}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple icon addition for the above code
function MessageCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
    )
}
