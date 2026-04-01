"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    IconWrench,
    IconSearch,
    IconCheck,
    IconUsers
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

    const formatCurrency = (amount: any) => {
        return Number(amount || 0).toLocaleString('tr-TR');
    };

    const activeCount = orders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS').length;
    const waitingCount = orders.filter(o => o.status === 'WAITING_APPROVAL').length;
    const completedCount = orders.filter(o => o.status === 'READY').length;

    return (
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-500">
                
                {/* TOP HEADER: Clean Title & Action */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <IconWrench className="w-7 h-7 text-indigo-600" />
                            Servis Yönetimi V2
                        </h1>
                        <p className="text-sm font-bold text-slate-500 mt-1">Siparişler, karneler ve bakım süreçleri.</p>
                    </div>
                    <button onClick={() => router.push('/service/new')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2">
                        + YENİ SERVİS KABUL
                    </button>
                </div>

                {/* METRICS ROW (Clean Pill Cards) */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white rounded-[1.5rem] p-5 shadow-sm ring-1 ring-slate-100 flex items-center gap-4 min-w-[240px]">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <IconWrench className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Aktif / İşlemde</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{activeCount}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[1.5rem] p-5 shadow-sm ring-1 ring-slate-100 flex items-center gap-4 min-w-[240px]">
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 animate-pulse">
                            <IconAlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Müşteri Onayı Bekliyor</p>
                            <p className="text-xl font-black text-amber-600 leading-none">{waitingCount}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[1.5rem] p-5 shadow-sm ring-1 ring-slate-100 flex items-center gap-4 min-w-[240px]">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <IconCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Tamamlandı / Faturalanacak</p>
                            <p className="text-xl font-black text-emerald-600 leading-none">{completedCount}</p>
                        </div>
                    </div>
                </div>

                {/* HORIZONTAL TABS */}
                <div className="flex items-center gap-2 bg-white rounded-full p-1.5 shadow-sm ring-1 ring-slate-100 w-full md:w-auto md:inline-flex overflow-x-auto">
                    <button onClick={() => setActiveTab('active')} className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'active' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                        Aktif İş Emirleri ({activeCount})
                    </button>
                    <button onClick={() => setActiveTab('waiting')} className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'waiting' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                        Onay Bekleyenler ({waitingCount})
                    </button>
                    <button onClick={() => setActiveTab('completed')} className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'completed' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                        Faturalanacaklar ({completedCount})
                    </button>
                </div>

                {/* SEARCH BAR & HARDENED LIST */}
                <div className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col min-h-[500px]">
                    <div className="border-b border-slate-100 p-4 md:p-6 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Referans, Plaka/Seri No veya Müşteri Ara..." 
                                className="w-full bg-white border-none ring-1 ring-slate-200 rounded-full pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 bg-white ring-1 ring-slate-200 shadow-sm px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all w-full md:w-auto justify-center">
                            <IconFilter className="w-3.5 h-3.5" /> Gelişmiş Filtre
                        </button>
                    </div>

                    <div className="flex-1 overflow-x-auto p-4 md:p-6 custom-scroll">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yükleniyor...</div>
                            </div>
                        ) : getFilteredOrders().length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 text-center">
                                <IconSearch className="w-12 h-12 text-slate-200 mb-4" />
                                <h3 className="text-sm font-bold text-slate-600">Arama sonucunda kayıt bulunamadı.</h3>
                                <p className="text-[11px] font-bold text-slate-400 mt-2">Başka bir sekme seçmeyi veya arama kelimesini değiştirmeyi deneyin.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b-2 border-slate-100 text-[10px] items-center uppercase font-black tracking-widest text-slate-400">
                                        <th className="pb-4 px-4 pl-0">İş Emri & Cihaz</th>
                                        <th className="pb-4 px-4">Müşteri</th>
                                        <th className="pb-4 px-4">Talep Zamanı</th>
                                        <th className="pb-4 px-4 text-center">Durum</th>
                                        <th className="pb-4 px-4 pr-0"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50/80">
                                    {getFilteredOrders().map(order => (
                                        <tr key={order.id} onClick={() => router.push(`/service/${order.id}`)} className="group hover:bg-slate-50/80 transition-all cursor-pointer">
                                            <td className="py-5 px-4 pl-0">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-[14px] bg-slate-100 text-indigo-600 flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                                                        <IconWrench className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1.5">{order.asset?.primaryIdentifier || 'Bilinmiyor'}</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white ring-1 ring-slate-200 px-1.5 py-0.5 rounded-md inline-block">#{order.id.slice(0,8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 w-1/4">
                                                <div className="flex items-center gap-2">
                                                    <IconUsers className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-700">{order.customer?.name}</span>
                                                </div>
                                                {order.customer?.phone && <span className="text-[10px] font-bold text-slate-400 ml-6 tracking-widest block mt-1">{order.customer.phone}</span>}
                                            </td>
                                            <td className="py-5 px-4">
                                                <span className="text-xs font-bold text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-bold text-slate-400 block tracking-widest uppercase mt-1">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                {order.status === 'PENDING' && <span className="inline-flex py-1.5 px-3 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ring-1 ring-slate-200/50">🔧 Beklemede</span>}
                                                {order.status === 'IN_PROGRESS' && <span className="inline-flex py-1.5 px-3 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ring-1 ring-indigo-200/50">⚙️ Liftte/İşlemde</span>}
                                                {order.status === 'WAITING_APPROVAL' && <span className="inline-flex py-1.5 px-3 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ring-1 ring-amber-200/50">⏳ Onay Bekliyor</span>}
                                                {order.status === 'READY' && <span className="inline-flex py-1.5 px-3 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ring-1 ring-emerald-200/50">✅ İşlem Tamam</span>}
                                            </td>
                                            <td className="py-5 px-4 pr-0 text-right">
                                                <button className="px-4 py-2 bg-white text-indigo-600 border-none ring-1 ring-slate-200 shadow-sm rounded-xl text-[10px] font-black tracking-widest uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    Görüntüle →
                                                </button>
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
    );
}

function IconAlertCircle(props: any) {
    return (
        <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx={12} cy={12} r={10} />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    )
}

function IconFilter(props: any) {
    return (
        <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    )
}
