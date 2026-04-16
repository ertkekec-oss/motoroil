"use client";

import React, { useState } from 'react';
import { Map, Users, Bike, Package, CheckCircle2, Clock, Phone, AlertCircle, Navigation } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CourierDispatchWorkspace() {
    const { showConfirm, showSuccess } = useModal();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'DISPATCH' | 'MAP'>('DISPATCH');

    // Mock data for the Courier Dispatch system
    const waitingOrders = [
        { id: '#ONL-9842', time: '5 dk önce', cust: 'Ertuğrul K.', address: 'Kozyatağı, Bayar Cd. No:3', total: '450 ₺', status: 'HAZIR', type: 'YEMEKSEPETI' },
        { id: '#ONL-9843', time: '12 dk önce', cust: 'Ayşe Y.', address: 'Ataşehir Merkez, 1. Cd', total: '280 ₺', status: 'HAZIR', type: 'D2C_MENU' },
        { id: '#ONL-9844', time: '20 dk önce', cust: 'Cem D.', address: 'Suadiye, Bağdat Cd.', total: '710 ₺', status: 'GECİKTİ', type: 'GETIR' }
    ];

    const activeCouriers = [
        { id: 'C-1', name: 'Ahmet Yılmaz', vehicle: 'Motosiklet (34 ABC 12)', status: 'YOLDA', currentOrder: '#ONL-9840', eta: '10 Dk' },
        { id: 'C-2', name: 'Can Özkan', vehicle: 'Elektrikli Bisiklet', status: 'MÜSAİT', currentOrder: null, eta: '-' },
        { id: 'C-3', name: 'Volkan K.', vehicle: 'Motosiklet (34 XYZ 99)', status: 'DÖNÜŞTE', currentOrder: null, eta: '5 Dk' }
    ];

    const handleAssign = (orderId: string, courierName: string) => {
        showConfirm(
            t('courier.confirmTitle'),
            `\$\{orderId\} ${t('courier.confirmMsgPart1')} \$\{courierName\} ${t('courier.confirmMsgPart2')}`,
            () => {
                showSuccess(t('courier.successTitle'), `${t('courier.successMsgPart1')} \$\{courierName\} ${t('courier.successMsgPart2')}`);
            }
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1220] p-4 lg:p-6 space-y-6">
            {/* HER YERDE GEÇERLİ EN ÜST STRATEJİ / BAŞLIK BANDI */}
            <div className="flex-shrink-0 bg-transparent z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-400 font-bold border border-indigo-500/10 shadow-sm shrink-0">
                        <Bike className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none truncate">
                            {t('courier.title')}
                        </h1>
                        <span className="text-[12px] font-bold tracking-widest uppercase text-slate-500 mt-1.5 block">
                            {t('courier.subtitle')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-[#1e293b] p-1.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('DISPATCH')} 
                        className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors ${activeTab === 'DISPATCH' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        Zimmet (Kanban)
                    </button>
                    <button 
                        onClick={() => setActiveTab('MAP')} 
                        className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors ${activeTab === 'MAP' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center gap-2' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-2'}`}
                    >
                        <Map size={14}/> Canlı Harita
                    </button>
                </div>
            </div>

            {activeTab === 'DISPATCH' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                    {/* SOL: Bekleyen Siparişler */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-180px)]">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Package className="text-orange-500" size={20}/>
                                Teslimat Bekleyen Siparişler
                            </h3>
                            <span className="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 font-bold px-2.5 py-1 rounded-full text-xs">{waitingOrders.length} {t('courier.package')}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
                            {waitingOrders.map((order, idx) => (
                                <div key={idx} className={`p-4 border rounded-xl flex flex-col gap-3 transition-all ${order.status === 'GECİKTİ' ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/20' : 'bg-white border-slate-100 dark:bg-slate-900/50 dark:border-white/5'}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2 items-center">
                                            <span className="font-black text-sm text-slate-800 dark:text-white">{order.id}</span>
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded uppercase tracking-widest">{order.type}</span>
                                        </div>
                                        <span className={`text-[10px] uppercase font-black tracking-widest ${order.status === 'GECİKTİ' ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>{order.time}</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-[13px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Users size={14}/> {order.cust}</div>
                                        <div className="text-[12px] font-medium text-slate-500 mt-1 pl-5">{order.address}</div>
                                    </div>
                                    <div className="flex pt-3 mt-1 border-t border-slate-100 dark:border-white/5 items-center justify-between">
                                        <span className="font-black text-slate-900 dark:text-white">{order.total}</span>
                                        <div className="flex items-center gap-2">
                                            <select className="text-xs font-bold bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                                                <option value="">{t('courier.selectCourier')}</option>
                                                <option value="C-2">Can Özkan (Müsait)</option>
                                                <option value="C-3">Volkan K. (Dönüşte)</option>
                                            </select>
                                            <button onClick={() => handleAssign(order.id, 'Can Özkan')} className="bg-indigo-600 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors tracking-widest">
                                                ATA
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SAĞ: Kurye Durumları */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-180px)]">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Bike className="text-blue-500" size={20}/>
                                Aktif Kurye Filosu
                            </h3>
                            <button className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"><Navigation size={14}/> {t('courier.allOnMap')}</button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scroll p-4 grid grid-cols-1 gap-4">
                            {activeCouriers.map((c, i) => (
                                <div key={i} className="p-4 border border-slate-100 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-slate-500 shadow-sm">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</div>
                                            <div className="text-[11px] text-slate-500 font-medium">{c.vehicle}</div>
                                            <div className="mt-1.5 flex gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-widest ${c.status === 'YOLDA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : c.status === 'MÜSAİT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                                    {c.status}
                                                </span>
                                                {c.currentOrder && <span className="text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">{c.currentOrder}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('courier.eta')}</div>
                                        <div className="text-lg font-black text-slate-700 dark:text-slate-300">{c.eta}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'MAP' && (
                <div className="bg-white dark:bg-[#1e293b] rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden relative items-center justify-center">
                    {/* Placeholder for Leaflet (reusing logic from FieldPlanner) */}
                    <div className="absolute inset-0 bg-[#e2e8f0] dark:bg-[#0f172a] opacity-50 z-0"></div>
                    <div className="z-10 flex flex-col items-center p-8 text-center max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10">
                        <Map size={64} className="text-blue-500 mb-6"/>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">{t('courier.mapActive')}</h2>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">{t('courier.mapDesc')}</p>
                        <button onClick={() => setActiveTab('DISPATCH')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md">
                            Zimmet Panosuna Dön
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
