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
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1400px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* TOP HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <IconSettings className="w-5 h-5 text-slate-600" />
                            Servis Operasyon Merkezi
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">İş emirleri, teknik süreçler ve müşteri onay adımları.</p>
                    </div>
                    <button onClick={() => router.push('/service/new')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                        + Yeni Servis Kabulü
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* YANDAN SEÇMELİ (LEFT SIDEBAR) TABS */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* Navigasyon Kartı */}
                        <div className="bg-white rounded border border-slate-200 p-3 shadow-sm">
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-3 mt-1">Görünümler & Filtreler</h2>
                            <div className="flex flex-col space-y-1">
                                <button 
                                    onClick={() => setActiveTab('active')} 
                                    className={`flex items-center justify-between px-3 py-2.5 text-sm rounded transition-colors ${activeTab === 'active' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm' : 'text-slate-600 font-medium hover:bg-slate-50 border border-transparent'}`}
                                >
                                    <span className="flex items-center gap-2"><IconWrench className="w-4 h-4 opacity-70" /> Aktif İş Emirleri</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${activeTab === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>{activeCount}</span>
                                </button>
                                
                                <button 
                                    onClick={() => setActiveTab('waiting')} 
                                    className={`flex items-center justify-between px-3 py-2.5 text-sm rounded transition-colors ${activeTab === 'waiting' ? 'bg-orange-50 text-orange-700 font-bold border border-orange-100 shadow-sm' : 'text-slate-600 font-medium hover:bg-slate-50 border border-transparent'}`}
                                >
                                    <span className="flex items-center gap-2"><IconClock className="w-4 h-4 opacity-70" /> Onay Bekleyenler</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${activeTab === 'waiting' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'}`}>{waitingCount}</span>
                                </button>
                                
                                <button 
                                    onClick={() => setActiveTab('completed')} 
                                    className={`flex items-center justify-between px-3 py-2.5 text-sm rounded transition-colors ${activeTab === 'completed' ? 'bg-green-50 text-green-700 font-bold border border-green-100 shadow-sm' : 'text-slate-600 font-medium hover:bg-slate-50 border border-transparent'}`}
                                >
                                    <span className="flex items-center gap-2"><IconCheck className="w-4 h-4 opacity-70" /> Faturalanacaklar</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${activeTab === 'completed' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>{completedCount}</span>
                                </button>
                            </div>
                        </div>

                        {/* Özet Metrik Kartı Yana Alındı */}
                        <div className="bg-white rounded border border-slate-200 p-4 shadow-sm">
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Süreç Özeti</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium mb-1">Toplam İşlemde / Bekleyen</p>
                                    <p className="text-2xl font-black text-slate-800">{activeCount + waitingCount}</p>
                                </div>
                                <div className="h-px bg-slate-100 w-full" />
                                <div>
                                    <p className="text-xs text-slate-500 font-medium mb-1">Teslime Hazır</p>
                                    <p className="text-xl font-bold text-green-600">{completedCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ İÇERİK (RIGHT CONTENT) TABLE CARD */}
                    <div className="lg:col-span-9">
                        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                            
                            {/* Arama BAR'ı */}
                            <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative w-full md:w-96">
                                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Referans, Plaka/Seri No veya Müşteri Ara..." 
                                        className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="text-sm font-semibold text-slate-500">
                                    {getFilteredOrders().length} Kayıt Listeleniyor
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto p-0">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-sm font-medium">
                                        Yükleniyor...
                                    </div>
                                ) : getFilteredOrders().length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-20 text-center">
                                        <IconSearch className="w-10 h-10 text-slate-300 mb-2" />
                                        <h3 className="text-sm font-semibold text-slate-600">Bu görünümde kayıt bulunamadı.</h3>
                                    </div>
                                ) : (
                                    <table className="w-full text-left bg-white text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                                                <th className="p-4 pl-6 font-semibold">İş Emri & Cihaz</th>
                                                <th className="p-4 font-semibold">Müşteri</th>
                                                <th className="p-4 font-semibold text-center">Talep Zamanı</th>
                                                <th className="p-4 font-semibold text-center">Durum</th>
                                                <th className="p-4 pr-6"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {getFilteredOrders().map(order => (
                                                <tr key={order.id} onClick={() => router.push(`/service/${order.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                                                    <td className="p-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <p className="font-bold text-blue-800 hover:text-blue-600">{order.asset?.primaryIdentifier || 'Bilinmiyor'}</p>
                                                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">#{order.id.slice(0,8)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <IconUsers className="w-4 h-4 text-slate-400" />
                                                            <span className="font-semibold text-slate-700">{order.customer?.name}</span>
                                                        </div>
                                                        {order.customer?.phone && <span className="text-[11px] text-slate-500 ml-6 mt-0.5 block">{order.customer.phone}</span>}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="font-medium text-slate-700">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                                                        <span className="text-xs text-slate-500 block">{new Date(order.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {order.status === 'PENDING' && <span className="inline-flex py-1 px-2.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">Kabul (Bekliyor)</span>}
                                                        {order.status === 'IN_PROGRESS' && <span className="inline-flex py-1 px-2.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">Liftte (İşlemde)</span>}
                                                        {order.status === 'WAITING_APPROVAL' && <span className="inline-flex py-1 px-2.5 rounded bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">Onay Bekliyor</span>}
                                                        {order.status === 'READY' && <span className="inline-flex py-1 px-2.5 rounded bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">Tamamlandı</span>}
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <span className="text-xs font-bold text-slate-400 hover:text-blue-600">Detay Göster →</span>
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
