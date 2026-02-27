"use client";

import {
    Building2, ShoppingCart, Send, LayoutList,
    Wallet, TrendingUp, Briefcase, Users,
    PackageSearch, LineChart, HeadphonesIcon, Landmark,
    ArrowUpRight, ArrowDownRight, Activity, Percent, ArrowRightLeft, ClockAlert
} from "lucide-react";

export default function ClientDashboard() {
    const kpis = [
        { title: "Toplam GMV", value: "₺ 1.450.000", trend: "+12.4%", up: true },
        { title: "Aktif RFQ", value: "42", trend: "+8.1%", up: true },
        { title: "Escrow'da Bekleyen", value: "₺ 280.000", trend: "-2.3%", up: false },
        { title: "Tahsil Edilen (Bu Ay)", value: "₺ 950.000", trend: "+15.2%", up: true },
    ];

    const features = [
        { title: "POS Terminal", icon: <ShoppingCart className="w-6 h-6" /> },
        { title: "B2B Ağı", icon: <Building2 className="w-6 h-6" /> },
        { title: "Siparişler", icon: <Send className="w-6 h-6" /> },
        { title: "Katalog", icon: <LayoutList className="w-6 h-6" /> },
        { title: "Finans (B2B)", icon: <Wallet className="w-6 h-6" /> },
        { title: "Büyüme (Satıcı)", icon: <TrendingUp className="w-6 h-6" /> },
        { title: "Satın Alma (Alıcı)", icon: <Briefcase className="w-6 h-6" /> },
        { title: "Personel Paneli", icon: <Users className="w-6 h-6" /> },
        { title: "Envanter & Depo", icon: <PackageSearch className="w-6 h-6" /> },
        { title: "İş Zekası & Analiz", icon: <LineChart className="w-6 h-6" /> },
        { title: "Servis Masası", icon: <HeadphonesIcon className="w-6 h-6" /> },
        { title: "Finansal Kontrol Kulesi", icon: <Landmark className="w-6 h-6" /> },
    ];

    return (
        <div className="min-h-screen p-6 font-sans text-slate-900 dark:text-gray-100 dark:bg-[#0f172a] bg-[#F1F5F9] rounded-tl-xl">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">Test Desktop Page</h1>
                        <p className="text-[#64748B] dark:text-gray-400 mt-1">Sistemin genel sağlığını ve temel metriklerini takip edin.</p>
                    </div>
                    <span className="px-3 py-1 bg-[#2563EB] bg-opacity-10 text-[#2563EB] text-xs font-semibold rounded-full border border-[#2563EB] border-opacity-20 uppercase tracking-widest hidden sm:inline-block">Demo Mode</span>
                </div>

                {/* 1. Üst Bölüm – KPI Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpis.map((kpi, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <span className="text-[#64748B] dark:text-slate-400 text-sm font-medium">{kpi.title}</span>
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${kpi.up ? 'bg-emerald-50 text-[#10B981]' : 'bg-rose-50 text-[#EF4444]'}`}>
                                    {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {kpi.trend}
                                </div>
                            </div>
                            <div className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                                {kpi.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. Orta Bölüm – Feature Button Grid */}
                <div>
                    <h2 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4">Hızlı Erişim (Power User Actions)</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {features.map((feat, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => console.log(`${feat.title} modülüne git`)}
                                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] dark:hover:border-[#2563EB] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] cursor-pointer focus:outline-none"
                            >
                                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#F1F5F9] dark:bg-slate-700 text-[#2563EB] dark:text-blue-400 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300 shadow-sm">
                                    {feat.icon}
                                </div>
                                <span className="mt-3 font-semibold text-sm text-[#0F172A] dark:text-slate-300 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                                    {feat.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Alt Bölüm – Analitik Widget Alanı */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">

                    {/* Sol Kolon */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-[#2563EB]" />
                                    <h3 className="font-bold text-[#0F172A] dark:text-white">RFQ Aktivite Trendi</h3>
                                </div>
                                <span className="text-xs text-[#64748B]">Son 7 Gün</span>
                            </div>
                            <div className="h-32 w-full flex items-end gap-2 px-2">
                                {/* Fake Bar Chart */}
                                {[30, 45, 25, 60, 80, 55, 90].map((h, i) => (
                                    <div key={i} className="flex-1 bg-gradient-to-t from-[#2563EB] to-blue-300 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Percent className="w-5 h-5 text-[#10B981]" />
                                <h3 className="font-bold text-[#0F172A] dark:text-white">Boost Performansı</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-[#64748B] font-medium">B2B Görünürlük Skoru</span>
                                        <span className="text-[#0F172A] dark:text-white font-bold">85/100</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                        <div className="bg-[#10B981] h-2 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-[#64748B] font-medium">Tıklama/Dönüşüm</span>
                                        <span className="text-[#0F172A] dark:text-white font-bold">12.4%</span>
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
                                {/* Fake Donut SVG Placeholder */}
                                <div className="relative w-40 h-40">
                                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                        <circle className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="6" fill="transparent" r="15.9155" cx="18" cy="18" />
                                        {/* Segment 1 (Mutabık) */}
                                        <circle className="stroke-[#10B981] transition-all duration-700" strokeWidth="6" strokeDasharray="65, 100" fill="transparent" r="15.9155" cx="18" cy="18" />
                                        {/* Segment 2 (Bekleyen) */}
                                        <circle className="stroke-[#F59E0B] transition-all duration-700 delay-100" strokeWidth="6" strokeDasharray="20, 100" strokeDashoffset="-65" fill="transparent" r="15.9155" cx="18" cy="18" />
                                        {/* Segment 3 (İhtilaflı) */}
                                        <circle className="stroke-[#EF4444] transition-all duration-700 delay-200" strokeWidth="6" strokeDasharray="15, 100" strokeDashoffset="-85" fill="transparent" r="15.9155" cx="18" cy="18" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-[#0F172A] dark:text-white">65%</span>
                                        <span className="text-xs text-[#64748B]">Mutabık</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center gap-6 text-sm font-medium">
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10B981]"></span> Mutabık</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span> Bekleyen</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#EF4444]"></span> İhtilaflı</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                                <ClockAlert className="w-5 h-5 text-[#8B5CF6]" />
                                <h3 className="font-bold text-[#0F172A] dark:text-white">Günlük İşlem (Bugün)</h3>
                            </div>
                            <div className="flex items-end gap-4 mt-2">
                                <span className="text-5xl font-black text-[#0F172A] dark:text-white tracking-tight">1,284</span>
                                <span className="text-[#10B981] font-bold text-lg mb-1 flex items-center"><ArrowUpRight className="w-5 h-5 font-bold" /> +8%</span>
                            </div>
                            <p className="text-[#64748B] text-sm mt-4 leading-relaxed">Düne göre büyük bir artış var. Özellikle <span className="font-semibold text-slate-700 dark:text-slate-300">Sipariş Operasyonları</span> ve <span className="font-semibold text-slate-700 dark:text-slate-300">Finans Mutabakatlarında</span> yoğunluk gözlemleniyor.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
