"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    IconWrench,
    IconSearch,
    IconCheck,
    IconUsers,
    IconClock
} from "@/components/icons/PremiumIcons";

export default function ServiceDashboardLevel10() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('active'); // active, waiting, completed
    const [searchTerm, setSearchTerm] = useState('');
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/service-v2');
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (e) {}
        setIsLoading(false);
    };

    const getFilteredOrders = () => {
        return orders.filter(o => 
            (o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
             o.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             o.asset?.primaryIdentifier?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (
                (activeTab === 'active' && (o.status === 'PENDING' || o.status === 'IN_PROGRESS')) ||
                (activeTab === 'waiting' && o.status === 'WAITING_APPROVAL') ||
                (activeTab === 'completed' && o.status === 'READY')
            )
        );
    };

    const activeCount = orders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS').length;
    const waitingCount = orders.filter(o => o.status === 'WAITING_APPROVAL').length;
    const completedCount = orders.filter(o => o.status === 'READY').length;

    return (
        <div className="bg-[#F8FAFC] min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1400px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-500">
                
                {/* TOP HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200/60 mb-6 font-sans">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                            <IconSettings className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                Servis Operasyon Merkezi
                            </h1>
                            <p className="text-[14px] font-medium text-slate-500 mt-1">İş emirleri, teknik süreçler ve müşteri onay adımları.</p>
                        </div>
                    </div>
                    <button onClick={() => router.push('/service/new')} className="bg-slate-900 hover:bg-slate-800 text-white px-6 h-12 rounded-2xl text-[13px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 shadow-xl shadow-slate-900/20 hover:-translate-y-0.5">
                        <span className="text-lg">+</span> YENİ SERVİS KABULÜ
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* YANDAN SEÇMELİ (LEFT SIDEBAR) TABS */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* Navigasyon Kartı */}
                        <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
                            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-4">Görünümler & Filtreler</h2>
                            <div className="flex flex-col space-y-2 relative">
                                <div className="absolute left-4 top-4 bottom-4 w-[2px] bg-slate-100 z-0"></div>
                                <button 
                                    onClick={() => setActiveTab('active')} 
                                    className={`relative z-10 flex items-center justify-between px-4 py-3.5 text-[13px] rounded-2xl transition-all ${activeTab === 'active' ? 'bg-white text-indigo-700 font-bold border border-indigo-200 shadow-sm ring-4 ring-indigo-50/50 scale-105' : 'text-slate-600 font-bold hover:bg-slate-50 border border-transparent'}`}
                                >
                                    <span className="flex items-center gap-3"><IconWrench className={`w-5 h-5 ${activeTab === 'active' ? 'text-indigo-600' : 'text-slate-400'}`} /> Aktif İş Emirleri</span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wider ${activeTab === 'active' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>{activeCount}</span>
                                </button>
                                
                                <button 
                                    onClick={() => setActiveTab('waiting')} 
                                    className={`relative z-10 flex items-center justify-between px-4 py-3.5 text-[13px] rounded-2xl transition-all ${activeTab === 'waiting' ? 'bg-white text-sky-700 font-bold border border-sky-200 shadow-sm ring-4 ring-sky-50/50 scale-105' : 'text-slate-600 font-bold hover:bg-slate-50 border border-transparent'}`}
                                >
                                    <span className="flex items-center gap-3"><IconClock className={`w-5 h-5 ${activeTab === 'waiting' ? 'text-sky-600' : 'text-slate-400'}`} /> Onay Bekleyenler</span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wider ${activeTab === 'waiting' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-500'}`}>{waitingCount}</span>
                                </button>
                                
                                <button 
                                    onClick={() => setActiveTab('completed')} 
                                    className={`relative z-10 flex items-center justify-between px-4 py-3.5 text-[13px] rounded-2xl transition-all ${activeTab === 'completed' ? 'bg-white text-emerald-700 font-bold border border-emerald-200 shadow-sm ring-4 ring-emerald-50/50 scale-105' : 'text-slate-600 font-bold hover:bg-slate-50 border border-transparent'}`}
                                >
                                    <span className="flex items-center gap-3"><IconCheck className={`w-5 h-5 ${activeTab === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`} strokeWidth={3} /> Faturalanacaklar</span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wider ${activeTab === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{completedCount}</span>
                                </button>
                            </div>
                        </div>

                        {/* Özet Metrik Kartı */}
                        <div className="bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/10 p-6 text-white relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-slate-800 rounded-full opacity-50"></div>
                            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 relative z-10">Süreç Özeti</h2>
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-[12px] text-slate-400 font-bold mb-1 uppercase tracking-wider">İşlemde / Bekleyen</p>
                                    <p className="text-[32px] font-black leading-none">{activeCount + waitingCount}</p>
                                </div>
                                <div className="h-px bg-slate-800 w-full" />
                                <div>
                                    <p className="text-[12px] text-emerald-400 font-bold mb-1 uppercase tracking-wider">Teslime Hazır</p>
                                    <p className="text-[28px] font-black leading-none text-emerald-400">{completedCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ İÇERİK (RIGHT CONTENT) TABLE CARD */}
                    <div className="lg:col-span-9">
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                            
                            {/* Arama BAR'ı */}
                            <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-5 items-center justify-between">
                                <div className="relative w-full md:w-[400px]">
                                    <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Referans, Plaka/Seri No veya Müşteri Ara..." 
                                        className="w-full bg-slate-50 border border-transparent hover:border-slate-200 rounded-2xl pl-12 pr-4 h-12 text-[14px] font-bold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="text-[12px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl">
                                    {getFilteredOrders().length} Kayıt Listeleniyor
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto p-4 custom-scrollbar">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-[13px] font-black uppercase tracking-widest animate-pulse">
                                        Yükleniyor...
                                    </div>
                                ) : getFilteredOrders().length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                            <IconSearch className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-[14px] font-black text-slate-600">Bu görünümde kayıt bulunamadı.</h3>
                                        <p className="text-[13px] text-slate-400 mt-2">Arama kriterlerinizi değiştirin veya sekme değiştirin.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left bg-white min-w-[800px]">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[11px] uppercase font-black text-slate-400 tracking-widest">
                                                <th className="p-4 pl-6 opacity-70">İş Emri & Cihaz</th>
                                                <th className="p-4 opacity-70">Müşteri</th>
                                                <th className="p-4 text-center opacity-70">Talep Zamanı</th>
                                                <th className="p-4 text-center opacity-70">Durum</th>
                                                <th className="p-4 pr-6"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {getFilteredOrders().map(order => (
                                                <tr key={order.id} onClick={() => router.push(`/service/${order.id}`)} className="hover:bg-slate-50/80 cursor-pointer transition-all group">
                                                    <td className="p-4 pl-6 w-1/4 relative">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-indigo-500 transition-colors"></div>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="font-black text-[14px] text-slate-800 group-hover:text-indigo-600 transition-colors">{order.asset?.primaryIdentifier || 'Bilinmiyor'}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{order.id.slice(0,8)}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 w-1/3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                                <IconUsers className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-[13px] text-slate-800">{order.customer?.name}</span>
                                                                {order.customer?.phone ? <span className="text-[11px] font-medium text-slate-500 mt-0.5">{order.customer.phone}</span> : null}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center w-1/6">
                                                        <span className="font-bold text-[13px] text-slate-700 block">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                                                        <span className="text-[11px] font-bold text-slate-400 block tracking-widest mt-0.5">{new Date(order.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                                                    </td>
                                                    <td className="p-4 text-center w-32">
                                                        {order.status === 'PENDING' && <span className="inline-flex items-center justify-center py-1.5 px-3 rounded-md bg-slate-100 border border-slate-200/60 text-slate-700 text-[10px] font-black uppercase tracking-widest w-full">Kabul (Bekliyor)</span>}
                                                        {order.status === 'IN_PROGRESS' && <span className="inline-flex items-center justify-center py-1.5 px-3 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest w-full">Liftte (İşlemde)</span>}
                                                        {order.status === 'WAITING_APPROVAL' && <span className="inline-flex items-center justify-center py-1.5 px-3 rounded-md bg-sky-50 border border-sky-100 text-sky-700 text-[10px] font-black uppercase tracking-widest w-full shadow-sm shadow-sky-100">Onay Bekliyor</span>}
                                                        {order.status === 'READY' && <span className="inline-flex items-center justify-center py-1.5 px-3 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest w-full shadow-sm shadow-emerald-100">Tamamlandı</span>}
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-white ml-auto relative group-hover:-translate-x-1 hover:!bg-indigo-600 hover:!text-white hover:!border-indigo-600 text-slate-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function IconSettings(props: any) {
    return (
        <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx={12} cy={12} r={3} />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    )
}
