"use client";

import React, { useState, useEffect } from "react";
import { 
    EnterpriseSectionHeader, 
    EnterpriseButton, 
    EnterpriseCard, 
    EnterpriseInput 
} from "@/components/ui/enterprise";
import { 
    IconActivity, 
    IconWrench, 
    IconPlus, 
    IconSearch, 
    IconCalendar, 
    IconUsers,
    IconCheck
} from "@/components/icons/PremiumIcons";
import { useRouter } from "next/navigation";

// --- KANBAN CONFIG ---
const WORKFLOW_STAGES = [
    { id: 'PENDING', label: 'Randevu / Beklemede', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', border: 'border-slate-200' },
    { id: 'IN_PROGRESS', label: 'Liftte / İşlemde', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400', border: 'border-indigo-200' },
    { id: 'WAITING_APPROVAL', label: 'Onay Bekliyor', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', border: 'border-amber-200' },
    { id: 'WAITING_PART', label: 'Parça/Fason', color: 'bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', border: 'border-purple-200' },
    { id: 'READY', label: 'Hazır / Faturalanacak', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', border: 'border-emerald-200' }
];

export default function ServiceV2Dashboard() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Mock Fetching for UI scaffolding
    useEffect(() => {
        setTimeout(() => {
            setOrders([
                { id: 'SRO-1001', asset: { primaryIdentifier: '34ABC123', brand: 'BMW', model: 'M3' }, customer: { name: 'Ahmet Yılmaz' }, status: 'IN_PROGRESS', technician: 'Yalçın Usta', complaint: 'Yağ Kaçağı Var', totalAmount: '0.00' },
                { id: 'SRO-1002', asset: { primaryIdentifier: '06XYZ99', brand: 'Honda', model: 'Civic' }, customer: { name: 'Veli Demir' }, status: 'WAITING_APPROVAL', technician: 'Ahmet Usta', complaint: 'Şanzıman Vuruyor', totalAmount: '14500.00' },
                { id: 'SRO-1003', asset: { primaryIdentifier: 'ABC-MAC-BOOK', brand: 'Apple', model: 'MacBook Pro' }, customer: { name: 'Ayşe Kaya' }, status: 'PENDING', technician: 'Bekliyor', complaint: 'Ekran Çizildi', totalAmount: '0.00' },
                { id: 'SRO-1004', asset: { primaryIdentifier: '34DEF456', brand: 'Yamaha', model: 'MT-07' }, customer: { name: 'Mehmet Han' }, status: 'READY', technician: 'Yalçın Usta', complaint: 'Periyodik Bakım', totalAmount: '3500.00' },
            ]);
            setIsLoading(false);
        }, 800);
    }, []);

    const groupedOrders = WORKFLOW_STAGES.map(stage => ({
        ...stage,
        items: orders.filter(o => o.status === stage.id)
    }));

    return (
        <div className="max-w-[1700px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700 pb-40">
            <EnterpriseSectionHeader 
                title="SERVİS HİZMETLERİ V2" 
                subtitle="Otonom Cihaz Karnesi • Kanban İş Akışı • Envanter Otomasyonu"
                icon={<IconWrench />}
                rightElement={
                    <div className="flex gap-3 relative z-20">
                        <div className="flex bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-1 overflow-hidden shrink-0">
                            <button onClick={() => setViewMode('KANBAN')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'KANBAN' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>KANBAN PANO</button>
                            <button onClick={() => setViewMode('LIST')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'LIST' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>LİSTE GÖRÜNÜMÜ</button>
                        </div>
                        <EnterpriseButton variant="primary" className="flex items-center gap-2 bg-slate-900 border-none rounded-xl" onClick={() => router.push('/service/new')}>
                            <IconPlus className="w-4 h-4" /> YENİ SERVİS KABUL
                        </EnterpriseButton>
                    </div>
                } 
            />

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <EnterpriseCard className="p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Atölye Doluluğu</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">12</h3>
                        <span className="text-sm font-bold text-gray-400">/ 15 Kapasite</span>
                    </div>
                </EnterpriseCard>
                <EnterpriseCard className="p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform border-l-4 border-amber-400">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Onay Bekleyen Maliyet</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-black text-amber-600">14.500<span className="text-sm">₺</span></h3>
                    </div>
                </EnterpriseCard>
                <EnterpriseCard className="p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform border-l-4 border-emerald-400">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Faturaya Hazır</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-black text-emerald-600">3.500<span className="text-sm">₺</span></h3>
                    </div>
                </EnterpriseCard>
                <EnterpriseCard className="p-6 relative overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 !border-indigo-200">
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Aktif Teknisyenler</p>
                    <div className="flex -space-x-3 mt-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm ring-2 ring-white z-20">AU</div>
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-white z-10">YU</div>
                        <div className="w-10 h-10 rounded-full border border-dashed border-indigo-300 flex items-center justify-center text-indigo-400 text-xs font-bold">+2</div>
                    </div>
                </EnterpriseCard>
            </div>

            {/* Main Area */}
            {isLoading ? (
                <div className="h-64 flex items-center justify-center text-gray-400 font-bold uppercase text-xs animate-pulse">
                    Veriler Yükleniyor...
                </div>
            ) : viewMode === 'KANBAN' ? (
                <div className="flex gap-4 overflow-x-auto pb-8 custom-scroll snap-x">
                    {groupedOrders.map(stage => (
                        <div key={stage.id} className="min-w-[320px] max-w-[320px] shrink-0 flex flex-col snap-start">
                            <div className={`px-4 py-3 rounded-t-2xl font-black text-xs uppercase tracking-wider flex justify-between items-center ${stage.color}`}>
                                {stage.label}
                                <span className="px-2 py-0.5 rounded bg-white/50 text-slate-800 text-[10px]">{stage.items.length}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-[#1e293b]/50 p-3 rounded-b-2xl border-x border-b border-slate-200 dark:border-white/5 min-h-[400px] flex flex-col gap-3">
                                {stage.items.length === 0 ? (
                                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400">BOŞ</div>
                                ) : (
                                    stage.items.map(order => (
                                        <div key={order.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => router.push(`/service/${order.id}`)}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 rounded">{order.id}</span>
                                                <span className="text-[10px] font-black text-slate-900">{order.asset.brand} {order.asset.model}</span>
                                            </div>
                                            <h4 className="font-black text-xl text-indigo-600 dark:text-indigo-400 mb-0.5 tracking-tight group-hover:text-indigo-700">{order.asset.primaryIdentifier}</h4>
                                            <p className="text-xs text-slate-600 font-medium mb-4 max-w-full truncate">{order.customer.name}</p>
                                            
                                            <div className="bg-slate-50 p-2 rounded-lg text-xs font-medium text-slate-600 line-clamp-2 mb-3 h-10">
                                                {order.complaint}
                                            </div>

                                            <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                                                    <IconActivity className="w-3 h-3 text-slate-400" />
                                                    {order.technician}
                                                </div>
                                                {Number(order.totalAmount) > 0 && (
                                                    <div className="text-sm font-black text-emerald-600">{Number(order.totalAmount).toLocaleString('tr-TR')} ₺</div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EnterpriseCard className="p-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 flex gap-4">
                        <EnterpriseInput
                            placeholder="Plaka, Müşteri veya İş Emri No..."
                            icon={<IconSearch />}
                            className="max-w-md bg-white"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] uppercase font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">
                                    <th className="py-4 px-6">İş Emri</th>
                                    <th className="py-4 px-6">Cihaz / Araç</th>
                                    <th className="py-4 px-6">Müşteri</th>
                                    <th className="py-4 px-6">Teknisyen</th>
                                    <th className="py-4 px-6">Durum</th>
                                    <th className="py-4 px-6 text-right">Tutar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/service/${order.id}`)}>
                                        <td className="py-4 px-6 text-xs font-bold text-slate-600">{order.id}</td>
                                        <td className="py-4 px-6">
                                            <div className="font-black text-indigo-600 text-sm tracking-wide">{order.asset.primaryIdentifier}</div>
                                            <div className="text-[10px] font-medium text-slate-500 uppercase">{order.asset.brand} {order.asset.model}</div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium text-slate-700">{order.customer.name}</td>
                                        <td className="py-4 px-6 text-xs text-slate-500 font-bold">{order.technician}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${WORKFLOW_STAGES.find(s => s.id === order.status)?.color}`}>
                                                {WORKFLOW_STAGES.find(s => s.id === order.status)?.label}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right font-black text-slate-900">{Number(order.totalAmount).toLocaleString('tr-TR')} ₺</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </EnterpriseCard>
            )}
        </div>
    );
}
