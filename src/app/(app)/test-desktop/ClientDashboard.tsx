"use client";

import {
    Building2, ShoppingCart, Send, LayoutList,
    Wallet, TrendingUp, Briefcase, Users,
    PackageSearch, LineChart, HeadphonesIcon, Landmark,
    ArrowUpRight, Clock, ShieldAlert, Search,
    Activity, Percent, Info, AlertTriangle, ShieldCheck, PieChart, Banknote, Store, Receipt, MapPin, SearchCheck,
    Box, CheckSquare, BarChart3, Fingerprint, Settings, HelpCircle, FileText, FileBarChart2,
    ChevronRight, ArrowDownRight, FileDown, FileUp, BoxSelect, Bell,
    Truck, Zap, AlertCircle, Check, Lock, ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import "./density-80.css";
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
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const [completionPhase, setCompletionPhase] = useState<'none' | 'micro' | 'executive' | 'completed'>('none');
    const [isFullyDismissed, setIsFullyDismissed] = useState(false);

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
        <div className={`flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1120] font-sans`}>

            {/* L E F T   P A N E L  (MODÜL GRID - 10% Scaled Up) */}
            <div className="w-[310px] xl:w-[400px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-white/5 flex flex-col h-full z-10 shadow-[8px_0_30px_-15px_rgba(0,0,0,0.05)] hidden md:flex overflow-hidden">
                <div className="p-7 pb-5 bg-gradient-to-b from-white to-white/90 dark:from-slate-900 dark:to-slate-900/90 backdrop-blur-md z-20">
                    <h2 className="text-[22px] font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-4">Sistem Modülleri</h2>
                    <div className="relative">
                        <Search className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Arama yap..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-100/70 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/50 border border-transparent focus:border-blue-500/30 rounded-xl text-[15px] font-medium text-slate-800 dark:text-slate-200 transition-all focus:shadow-[0_4px_20px_-5px_rgba(37,99,235,0.15)] focus:outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Hide Scrollbar, Touch-first padding, Two-column Grid Layout */}
                <div className="flex-1 overflow-y-auto px-7 pb-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />
                    <div className="grid grid-cols-2 gap-4 pdy-grid-tight">
                        {!mounted ? (
                            Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="h-[105px] bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                            ))
                        ) : (
                            filteredFeatures.map(feat => (
                                <button
                                    key={feat.id}
                                    onClick={() => {
                                        trackEvent("FEATURE_TILE_CLICKED", { tileKey: feat.id });
                                        router.push(feat.href);
                                    }}
                                    className="text-left flex flex-col items-start p-5 rounded-[18px] transition-transform active:scale-95 border border-slate-200/60 hover:border-slate-300 dark:border-slate-700/50 dark:hover:border-slate-600 focus:outline-none shadow-sm hover:shadow-md cursor-pointer bg-white dark:bg-slate-800 group"
                                >
                                    <div className={`p-3 rounded-xl mb-3.5 shadow-sm ${feat.color.replace('border-', 'border border-')}`}>
                                        <div className="scale-90 origin-top-left -mx-0.5 -my-0.5">
                                            {feat.icon}
                                        </div>
                                    </div>
                                    <h4 className="text-[14.5px] font-extrabold text-[#0F172A] dark:text-white tracking-tight leading-tight">{feat.title}</h4>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-2 leading-snug">{feat.desc}</p>
                                </button>
                            ))
                        )}
                        {mounted && filteredFeatures.length === 0 && (
                            <div className="col-span-2 text-center py-10">
                                <BoxSelect className="w-9 h-9 text-slate-300 mx-auto mb-3" />
                                <p className="text-[15px] text-slate-500 font-bold">Modül bulunamadı.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* R I G H T   P A N E L  (DASHBOARD CARDS 80% SCALED TOKENS) */}
            <div
                className={`flex-1 overflow-y-auto w-full p-3.5 sm:p-3.5 xl:p-10 relative pdy-section pdy-density-80`}
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
                <div className="pdy-content-container max-w-[1400px] mx-auto space-y-8 pb-24 pdy-stack">

                    {/* Header Info */}
                    <div className="mb-5 xl:mb-5 pdy-title">
                        <h2 className="text-[25px] sm:text-[36px] font-[700] tracking-tight text-[#0F172A] dark:text-white leading-tight mb-1">PERİODYA DASHBOARD</h2>
                        <p className="text-[12.5px] font-semibold text-slate-500 tracking-wide uppercase whitespace-nowrap overflow-hidden text-ellipsis w-full opacity-80">Tüm Kurumsal Ağın Gerçek Zamanlı Özeti</p>
                    </div>

                    {/* EXECUTIVE BROADCAST LAYER (CONDITIONAL) */}
                    {MOCK_ANNOUNCEMENTS.length > 0 && (
                        <div
                            className={`w-full border-b border-[#0F172A]/[0.08] dark:border-white/[0.08] bg-[#F8FAFC] dark:bg-[#0f111a] flex items-center transition-all duration-300 z-50 mb-5 overflow-hidden
                                ${isScrolled
                                    ? 'h-[46px] sticky top-0 px-3.5 sm:px-5 xl:px-10 -mx-4 sm:-mx-8 xl:-mx-12 shadow-sm'
                                    : 'h-[64px]'}`}
                            onMouseEnter={() => setIsHoveringAnnouncements(true)}
                            onMouseLeave={() => setIsHoveringAnnouncements(false)}
                        >
                            {/* 1. DUYURU TÜRÜ (15%) */}
                            <div className="flex-[0.15] min-w-[120px] flex items-center gap-2 pr-4">
                                <span className={`font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 transition-all ${isScrolled ? 'text-[9px]' : 'text-[9px]'}`}>
                                    {MOCK_ANNOUNCEMENTS[announcementIdx]?.tag === "BAKIM" ? "DUYURU" : MOCK_ANNOUNCEMENTS[announcementIdx]?.tag || "CANLI"}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-800 dark:bg-slate-300 flex-shrink-0"></div>
                            </div>

                            {/* 2. ANA MESAJ (70%) */}
                            <div className="flex-[0.7] relative h-[24px] overflow-hidden">
                                {MOCK_ANNOUNCEMENTS.map((ann, idx) => (
                                    <div
                                        key={ann.id}
                                        className={`absolute inset-0 flex items-center transition-opacity duration-250 ease-in-out ${idx === announcementIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                                    >
                                        <div className={`font-[600] text-[#0F172A] dark:text-white truncate transition-all ${isScrolled ? 'text-[12.5px]' : 'text-[13.5px] lg:text-[14.5px]'}`}>
                                            {ann.title} — <span className="font-medium text-slate-600 dark:text-slate-400">{ann.msg}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 3. AKSİYON (15%) */}
                            <div className="flex-[0.15] min-w-[100px] flex items-center justify-end pl-4 gap-3.5">
                                <Link
                                    href={MOCK_ANNOUNCEMENTS[announcementIdx]?.link || "#"}
                                    className={`font-semibold text-slate-500 hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-white transition-colors ${isScrolled ? 'text-[9px]' : 'text-[11.5px]'}`}
                                >
                                    Detaylar →
                                </Link>
                                <button className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Compact Onboarding Strip (Premium & Minimal) */}
                    {setupNeeded && !loading && mounted && !isFullyDismissed && (() => {
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

                        // If simulated completion phase is active, we force progress to 100
                        const displayPercent = (completionPhase === 'micro' || completionPhase === 'executive') ? 100 : progressPercent;

                        return (
                            <>
                                {/* Floating Modal */}
                                {showOnboardingModal && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3.5">
                                        <div
                                            className="absolute inset-0 bg-[#0F172A]/[0.35] backdrop-blur-[6px] transition-opacity duration-200"
                                            style={{ opacity: showOnboardingModal ? 1 : 0 }}
                                            onClick={() => completionPhase === 'none' && setShowOnboardingModal(false)}
                                        ></div>

                                        <div
                                            className={`relative bg-white dark:bg-[#080911] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[24px] p-[32px] w-full max-w-[760px] flex flex-col items-center justify-center transition-all duration-300 transform ${showOnboardingModal ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0'} ${completionPhase === 'micro' ? 'scale-[1.03]' : completionPhase === 'executive' ? 'scale-100' : ''}`}
                                        >
                                            {completionPhase === 'none' && (
                                                <button
                                                    className="absolute top-3.5 right-6 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                                                    onClick={() => setShowOnboardingModal(false)}
                                                >
                                                    <span className="sr-only">Kapat</span>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            )}

                                            {/* Normal Timeline Content */}
                                            {completionPhase === 'none' || completionPhase === 'micro' ? (
                                                <div className="w-full">
                                                    <div className="text-center mb-5">
                                                        <h3 className="text-[22px] font-bold text-[#0F172A] dark:text-white leading-tight mb-2">Kurulum Merkezi</h3>
                                                        <p className="text-[12.5px] font-medium text-slate-500">İşletme aktivasyon sürecinizi tamamlayın</p>
                                                    </div>

                                                    <div className="space-y-4 pdy-stack w-full">
                                                        {steps.map((step, idx) => (
                                                            <div key={step.id} className={`flex items-center p-3.5 rounded-2xl border transition-all ${step.status === 'completed' ? 'bg-slate-50 dark:bg-white/[0.02] border-transparent' : step.status === 'active' ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 shadow-sm' : 'bg-white dark:bg-[#080911] border-slate-100 dark:border-slate-800/60 opacity-60'}`}>
                                                                <div className={`w-[32px] h-[32px] rounded-full flex flex-shrink-0 items-center justify-center font-bold text-[11.5px] mr-4 
                                                                    ${step.status === 'completed' ? 'bg-emerald-500 text-white shadow-sm' : step.status === 'active' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                                    {step.status === 'completed' ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className={`font-bold text-[13.5px] ${step.status === 'completed' ? 'text-[#0F172A] dark:text-white line-through opacity-70' : step.status === 'active' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}>
                                                                        {step.title}
                                                                    </div>
                                                                    <div className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                                                                        {step.desc}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-shrink-0 ml-4">
                                                                    {step.status === 'active' && (
                                                                        <button
                                                                            onClick={() => {
                                                                                router.push(step.href);
                                                                                setShowOnboardingModal(false);
                                                                            }}
                                                                            className="px-3.5 py-2 bg-[#0F172A] hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white text-[11.5px] font-bold rounded-xl transition-all shadow-sm active:scale-95"
                                                                        >
                                                                            Adımı Tamamla
                                                                        </button>
                                                                    )}
                                                                    {step.status === 'completed' && <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">TAMAMLANDI</span>}
                                                                    {step.status === 'locked' && <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest"><Lock className="w-3.5 h-3.5" /> Kilitli</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Demo Button to trigger completion manually (Remove in prod) */}
                                                    <div className="mt-8 flex justify-center">
                                                        <button
                                                            className="text-[9px] font-bold text-slate-300 hover:text-slate-400 transition-colors"
                                                            onClick={() => {
                                                                setCompletionPhase('micro');
                                                                setTimeout(() => setCompletionPhase('executive'), 800);
                                                            }}
                                                        >
                                                            [Simulate Completion]
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Executive Success State */
                                                <div className="w-full flex flex-col items-center text-center py-3.5 animate-in fade-in zoom-in-95 duration-500 relative">
                                                    <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-[80px] -z-10"></div>

                                                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-5 ring-8 ring-emerald-50/50 dark:ring-emerald-500/5 animate-in slide-in-from-bottom-4 duration-700">
                                                        <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                                                    </div>

                                                    <h2 className="text-[25px] font-extrabold text-[#0F172A] dark:text-white tracking-tight leading-tight mb-3 animate-in slide-in-from-bottom-2 duration-700 delay-100">Kurulum Tamamlandı</h2>
                                                    <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400 mb-5 max-w-[320px] animate-in slide-in-from-bottom-2 duration-700 delay-200">Sisteminiz artık tam kapasiteyle çalışmaya hazır.</p>

                                                    <button
                                                        className="px-5 py-3.5 bg-[#0F172A] hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white text-[13.5px] font-bold rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 animate-in slide-in-from-bottom-2 duration-700 delay-300"
                                                        onClick={() => {
                                                            setShowOnboardingModal(false);
                                                            setTimeout(() => {
                                                                setIsFullyDismissed(true);
                                                                setCompletionPhase('completed');
                                                            }, 300);
                                                        }}
                                                    >
                                                        Dashboard'a Geç
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Compact Strip */}
                                <div
                                    className={`mb-5 w-full h-[54px] rounded-[20px] px-5 bg-white dark:bg-[#080911] border border-[#0F172A]/[0.06] dark:border-white/5 shadow-[0_4px_14px_rgba(15,23,42,0.04)] flex items-center cursor-pointer transition-all duration-300 hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] group ${showOnboardingModal ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
                                    onClick={() => setShowOnboardingModal(true)}
                                >
                                    {/* Left */}
                                    <div className="flex items-center gap-3 flex-shrink-0 w-[180px]">
                                        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <div className="flex flex-col">
                                            <span className="text-[11.5px] font-bold text-[#0F172A] dark:text-white">Kurulum Merkezi</span>
                                            <span className="text-[9px] font-semibold text-slate-500 tracking-wide uppercase">%{displayPercent} Tamamlandı</span>
                                        </div>
                                    </div>

                                    {/* Center Progress */}
                                    <div className="flex-1 mx-8 flex items-center justify-center">
                                        <div className="w-full max-w-[300px] h-[4px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${displayPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Right */}
                                    <div className="flex items-center flex-shrink-0 w-[120px] justify-end">
                                        <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-[#0F172A] dark:group-hover:text-white transition-colors flex items-center gap-1">
                                            Devam Et <ArrowRight className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}

                    {/* WIDGET GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3.5 pdy-grid">

                        {/* 1. NAKİT AKIŞI & ÖDEMELER KARTI (LEDGER SOT) */}
                        <div className="group overflow-hidden rounded-[24px] bg-slate-900 border border-slate-800 p-3.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] transition-all flex flex-col pdy-card">
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-white/10 text-white rounded-2xl backdrop-blur-xl">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-[13.5px] font-bold text-white tracking-tight">Finans & Likidite</h3>
                                </div>
                                <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-black tracking-widest uppercase rounded-lg border border-indigo-500/20">Ledger SoT</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5 pdy-grid-tight mb-5 mt-auto">
                                <div>
                                    <p className="text-[11.5px] text-slate-400 font-bold mb-2 flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-emerald-400" /> Yaklaşan Tahsilat</p>
                                    <h4 className="text-lg font-black text-white pdy-kpi">{loading ? "..." : formatter.format(d?.escrowPending || 0)}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11.5px] text-slate-400 font-bold mb-2 flex items-center gap-2 justify-end"><ArrowUpRight className="w-4 h-4 text-rose-400" /> Yaklaşan Ödeme</p>
                                    <h4 className="text-lg font-black text-rose-400 pdy-kpi">{loading ? "..." : formatter.format((d?.escrowPending || 0) * 0.4)}</h4>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 rounded-2xl p-3.5 border border-slate-700/50">
                                <h5 className="text-[9px] font-black text-slate-500 tracking-widest uppercase mb-4">Kasa Durumları</h5>
                                <div className="space-y-3 pdy-stack">
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
                        <div className="overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-3.5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_45px_-15px_rgba(0,0,0,0.12)] transition-all flex flex-col pdy-card">
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                        <PackageSearch className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white tracking-tight">Depo & Stok Sağlığı</h3>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-5 mt-auto px-2">
                                <div>
                                    <p className="text-[11.5px] text-slate-500 font-bold mb-2 uppercase tracking-wide">Aktif SKU</p>
                                    <h1 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white pdy-kpi">
                                        {loading ? "..." : d?.stockHealth?.totalSku || 0}
                                    </h1>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11.5px] text-slate-500 font-bold mb-2 uppercase tracking-wide">Yoldaki Ürünler</p>
                                    <h2 className="text-lg font-black text-indigo-600 pdy-kpi">
                                        {loading ? "..." : d?.stockHealth?.inShipment || 0}
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-4 pdy-stack">
                                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <span className="font-semibold text-sm text-slate-600 dark:text-slate-300">Stok Fazlası (Otonom)</span>
                                    <span className="font-bold text-sm text-slate-900">{loading ? "..." : d?.stockHealth?.overStock || 0} Adet</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 flex items-center justify-between p-3.5 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100">
                                        <span className="font-bold text-sm">Kritik Stok</span>
                                        <span className="font-black text-base">{loading ? "..." : d?.stockHealth?.lowStock || 0}</span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className="font-bold text-sm text-slate-600">Sevkiyat Yok</span>
                                        <span className="font-black text-base text-slate-800">{loading ? "..." : d?.stockHealth?.noShipment || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* 4. PDKS & PERSONEL ÖZETİ */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "HR", "RISK"])) && (
                            <div className="overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-3.5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col pdy-card">
                                <div className="flex items-center gap-3.5 mb-5">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Fingerprint className="w-5 h-5" /></div>
                                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white tracking-tight">Vardiya & PDKS Durumu</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3.5 pdy-grid-tight mt-auto">
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                        <h4 className="text-lg font-black text-slate-800 pdy-kpi">{loading ? "..." : d?.pdksRules?.currentStaffCount || 0}</h4>
                                        <p className="text-sm font-bold text-slate-500 mt-1">Aktif Personel</p>
                                    </div>
                                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                        <h4 className="text-lg font-black text-emerald-700 pdy-kpi">{loading ? "..." : d?.pdksRules?.checkedInCount || 0}</h4>
                                        <p className="text-sm font-bold text-emerald-600 mt-1">Giriş Yapan</p>
                                    </div>
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center px-5 col-span-2">
                                        <span className="font-bold text-sm text-slate-600">Henüz Gelmeyen / İzinli:</span>
                                        <span className="font-black text-base text-slate-800">{loading ? "..." : d?.pdksRules?.notCheckedInCount || 0}</span>
                                    </div>
                                    <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 flex justify-between items-center px-5 col-span-2">
                                        <span className="font-bold text-sm text-rose-700">Geç Kalan İhlali:</span>
                                        <span className="font-black text-base text-rose-700">{loading ? "..." : d?.pdksRules?.lateCount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. SERVİS MASASI */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "STAFF", "SELLER"])) && (
                            <div className="overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-3.5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col pdy-card">
                                <div className="flex items-center gap-3.5 mb-5">
                                    <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl"><HeadphonesIcon className="w-5 h-5" /></div>
                                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white tracking-tight">Servis & Bakım Ağı</h3>
                                </div>
                                <div className="mt-auto space-y-4 pdy-stack">
                                    <div className="relative p-3.5 bg-slate-900 text-white rounded-3xl overflow-hidden shadow-lg border border-slate-800 flex items-center justify-between">
                                        <div className="relative z-10">
                                            <p className="text-[11.5px] text-slate-400 font-bold uppercase tracking-wider mb-2">Şu an Serviste Olan</p>
                                            <h1 className="text-5xl font-black text-cyan-400 pdy-kpi">{loading ? "..." : d?.serviceDesk?.currentlyInService || 0}</h1>
                                        </div>
                                        <Activity className="absolute right-0 top-1/2 -translate-y-1/2 w-40 h-40 text-white opacity-5 pointer-events-none" />
                                    </div>
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                        <span className="font-bold text-sm text-slate-600">Bugün Yeni Giren Kayıt:</span>
                                        <span className="font-black text-lg text-slate-800">+{loading ? "..." : d?.serviceDesk?.enteredToday || 0}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6. FATURALAR VE İRSALİYELER */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "FINANCE", "RISK"])) && (
                            <div className="overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-3.5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col pdy-card">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><FileText className="w-5 h-5" /></div>
                                        <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white tracking-tight">E-Belge İşlemleri</h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3.5 pdy-grid-tight mt-auto">
                                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                        <FileDown className="w-5 h-5 text-emerald-500 mb-4" />
                                        <h4 className="text-lg font-black text-slate-800 pdy-kpi">{loading ? "..." : d?.invoiceStatus?.incoming || 0}</h4>
                                        <p className="text-[11.5px] text-slate-500 mt-1 font-bold">Gelen (Bu Hafta)</p>
                                    </div>
                                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                        <FileUp className="w-5 h-5 text-indigo-500 mb-4" />
                                        <h4 className="text-lg font-black text-slate-800 pdy-kpi">{loading ? "..." : d?.invoiceStatus?.outgoing || 0}</h4>
                                        <p className="text-[11.5px] text-slate-500 mt-1 font-bold">Giden (Bu Hafta)</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between px-5 py-3.5 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
                                    <span className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> Onaylanacak Belgeler:</span>
                                    <span className="text-lg font-black">{loading ? "..." : d?.invoiceStatus?.pending || 0} Adet</span>
                                </div>
                            </div>
                        )}

                        {/* 7. OTONOM FİYATLANDIRMA ÖZETİ */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "FINANCE", "RISK"])) && (
                            <div className="overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-3.5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col relative pdy-card">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-400"></div>
                                <div className="flex items-center gap-3.5 mb-5">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Activity className="w-5 h-5" /></div>
                                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white tracking-tight">Otonom Fiyatlandırma</h3>
                                </div>
                                <div className="mt-auto space-y-4 pdy-stack">
                                    <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                <LineChart className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-purple-900 text-[12.5px]">Otonom Güncellenen SKU</p>
                                                <p className="font-semibold text-purple-700/60 text-[9px] uppercase tracking-wide">Bugün</p>
                                            </div>
                                        </div>
                                        <div className="text-lg font-black text-purple-600 pdy-kpi">{loading ? "..." : d?.autonomous?.updatedProducts || 0}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                            <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Ort. Marj</p>
                                            <div className="text-lg font-black text-emerald-600">+{loading ? "..." : d?.autonomous?.avgMarginChange || 0}%</div>
                                        </div>
                                        <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[9px] font-bold text-rose-800 uppercase tracking-widest mb-1">Riskli Sapma</p>
                                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <div className="text-lg font-black text-rose-600">{loading ? "..." : d?.autonomous?.riskyDeviation || 0} <span className="text-xs font-bold text-rose-500/70">Ürün</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 8. BİLDİRİMLER VE ONAYLAR (GENİŞLETİLMİŞ) */}
                        <div className="md:col-span-full lg:col-span-2 2xl:col-span-3 overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-3.5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_45px_-15px_rgba(0,0,0,0.12)] transition-all flex flex-col pdy-card">
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white tracking-tight">Onaylar & Alarmlar</h3>
                                </div>
                                {(d?.notificationsApp?.criticalAlerts || 0) > 0 && (
                                    <div className="px-3 py-1 bg-red-500 text-white text-[9px] font-black tracking-widest uppercase rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                        <AlertTriangle className="w-3 h-3" /> Kritik Uyarı Var
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pdy-grid">
                                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                                            <CheckSquare className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-amber-900 text-[13.5px]">Bekleyen Onaylar</p>
                                            <p className="font-medium text-amber-700/70 text-[9px] line-clamp-1">Fatura, Escrow ve Sözleşme</p>
                                        </div>
                                    </div>
                                    <div className="text-lg font-black text-amber-600 ml-4 pdy-kpi">{loading ? "..." : d?.notificationsApp?.pendingApprovals || 0}</div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                                            <MessageCircle className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-blue-900 text-[13.5px]">Okunmamış Bildirim</p>
                                            <p className="font-medium text-blue-700/70 text-[9px] line-clamp-1">Sistem güncelleme / Uyarı</p>
                                        </div>
                                    </div>
                                    <div className="text-lg font-black text-blue-600 ml-4 pdy-kpi">{loading ? "..." : d?.notificationsApp?.newNotifications || 0}</div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-rose-900 text-[13.5px]">Kaçak / Riskli İşlem</p>
                                            <p className="font-medium text-rose-700/70 text-[9px] line-clamp-1">Kritik güvenlik sekmesi</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-rose-600 text-lg ml-4">{loading ? "..." : d?.notificationsApp?.criticalAlerts || 0}</span>
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
