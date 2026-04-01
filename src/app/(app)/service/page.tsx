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

    const activeCount = orders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS').length;
    const waitingCount = orders.filter(o => o.status === 'WAITING_APPROVAL').length;
    const completedCount = orders.filter(o => o.status === 'READY').length;

    return (
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1400px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* TOP HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <IconSettings className="w-5 h-5 text-blue-600" />
                            Servis Yönetimi V2
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Siparişler, karneler ve bakım süreçleri.</p>
                    </div>
                    <button onClick={() => router.push('/service/new')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                        + YENİ SERVİS KABUL
                    </button>
                </div>

                {/* KPI METRICS (Reference match) */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 min-w-[240px] shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                            <IconSettings className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-0.5">Aktif / İşlemde</p>
                            <p className="text-xl font-bold text-slate-800 leading-none">{activeCount}</p>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 min-w-[240px] shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                            <IconAlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-0.5">Müşteri Onayı Bekliyor</p>
                            <p className="text-xl font-bold text-slate-800 leading-none">{waitingCount}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 min-w-[240px] shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
                            <IconCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-0.5">Tamamlandı / Faturalanacak</p>
                            <p className="text-xl font-bold text-slate-800 leading-none">{completedCount}</p>
                        </div>
                    </div>
                </div>

                {/* HORIZONTAL TABS (Left-aligned, serious design) */}
                <div className="flex items-center gap-1 border-b border-slate-200 pb-3 pt-4 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('active')} 
                        className={`px-5 py-2 text-sm transition-colors whitespace-nowrap rounded-full ${activeTab === 'active' ? 'bg-white border border-slate-300 text-slate-800 font-semibold shadow-sm' : 'text-slate-500 font-medium hover:text-slate-800'}`}
                    >
                        Aktif İş Emirleri ({activeCount})
                    </button>
                    <button 
                        onClick={() => setActiveTab('waiting')} 
                        className={`px-5 py-2 text-sm transition-colors whitespace-nowrap rounded-full ${activeTab === 'waiting' ? 'bg-white border border-slate-300 text-slate-800 font-semibold shadow-sm' : 'text-slate-500 font-medium hover:text-slate-800'}`}
                    >
                        Onay Bekleyenler ({waitingCount})
                    </button>
                    <button 
                        onClick={() => setActiveTab('completed')} 
                        className={`px-5 py-2 text-sm transition-colors whitespace-nowrap rounded-full ${activeTab === 'completed' ? 'bg-white border border-slate-300 text-slate-800 font-semibold shadow-sm' : 'text-slate-500 font-medium hover:text-slate-800'}`}
                    >
                        Faturalanacaklar ({completedCount})
                    </button>
                </div>

                {/* TABLE CARD */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Referans, Plaka/Seri No veya Müşteri Ara..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors w-full md:w-auto justify-center">
                            Gelişmiş Filtre
                        </button>
                    </div>

                    <div className="flex-1 overflow-x-auto p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-sm font-medium">
                                Yükleniyor...
                            </div>
                        ) : getFilteredOrders().length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 text-center">
                                <IconSearch className="w-10 h-10 text-slate-300 mb-2" />
                                <h3 className="text-sm font-semibold text-slate-600">Kayıt Bulunamadı</h3>
                            </div>
                        ) : (
                            <table className="w-full text-left bg-white text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                                        <th className="p-4 pl-6 font-semibold">İş Emri & Cihaz</th>
                                        <th className="p-4 font-semibold">Müşteri</th>
                                        <th className="p-4 font-semibold">Talep Zamanı</th>
                                        <th className="p-4 font-semibold text-center">Durum</th>
                                        <th className="p-4 pr-6"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {getFilteredOrders().map(order => (
                                        <tr key={order.id} onClick={() => router.push(`/service/${order.id}`)} className="hover:bg-slate-50 cursor-pointer">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded border border-slate-200 bg-slate-50 text-slate-400 flex items-center justify-center">
                                                        <IconWrench className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{order.asset?.primaryIdentifier || 'Bilinmiyor'}</p>
                                                        <p className="text-xs text-slate-500">#{order.id.slice(0,8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <IconUsers className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium text-slate-700">{order.customer?.name}</span>
                                                </div>
                                                {order.customer?.phone && <span className="text-xs text-slate-500 ml-6 mt-0.5 block">{order.customer.phone}</span>}
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-slate-700">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                                                <span className="text-xs text-slate-500 block">{new Date(order.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {order.status === 'PENDING' && <span className="inline-flex py-1 px-2.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">Beklemede</span>}
                                                {order.status === 'IN_PROGRESS' && <span className="inline-flex py-1 px-2.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">İşlemde</span>}
                                                {order.status === 'WAITING_APPROVAL' && <span className="inline-flex py-1 px-2.5 rounded bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">Onay Bekliyor</span>}
                                                {order.status === 'READY' && <span className="inline-flex py-1 px-2.5 rounded bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">Tamamlandı</span>}
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <button className="px-3 py-1.5 bg-white text-blue-600 border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50 transition-colors">
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

function IconSettings(props: any) {
    return (
        <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx={12} cy={12} r={3} />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    )
}
