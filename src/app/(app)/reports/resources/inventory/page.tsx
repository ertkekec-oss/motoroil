"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Package, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

const INVENTORY_DATA = [
    { id: '1', sku: 'PTR-8090', name: 'Z-X Sentetik Yağ 5W-30', stock: 450, turnoverRate: 12.4, idleDays: 2, value: 54000, status: 'FAST_MOVING' },
    { id: '2', sku: 'FLT-1102', name: 'Polen Filtresi (Standart)', stock: 120, turnoverRate: 8.1, idleDays: 14, value: 8500, status: 'NORMAL' },
    { id: '3', sku: 'KMP-9901', name: 'Kışlık Kampanya Kiti SET-1', stock: 85, turnoverRate: 0.5, idleDays: 140, value: 125000, status: 'IDLE' },
    { id: '4', sku: 'AKU-4500', name: 'Heavy Duty Ticari Akü', stock: 30, turnoverRate: 1.2, idleDays: 95, value: 45000, status: 'WARNING' },
];

export default function InventoryTurnoverReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'INVENTORY_TURNOVER',
                    name: 'Stok Devir Hızı ve Atıl Envanter Raporu',
                    filters: {}
                })
            });
            alert('Rapor arka planda hazırlanıyor (BullMQ). Tamamlanınca size bildirim gelecek ve Rapor Arşivi modülünden indirebileceksiniz.');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const totalValue = INVENTORY_DATA.reduce((acc, i) => acc + i.value, 0);
    const idleValue = INVENTORY_DATA.filter(i => i.status === 'IDLE' || i.status === 'WARNING').reduce((acc, i) => acc + i.value, 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            
            {/* 1. Universal Enterprise Filter Header */}
            <GlobalReportHeader 
                title="Stok Devir Hızı & Atıl Envanter" 
                description="Depo ve stok devir süreleri, satılmayan ürünlere bağlanan capital yükü." 
            />

            {/* 2. Executive Summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                        <Package className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest">TOPLAM STOK DEĞERİ</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">₺{(totalValue / 1000).toFixed(1)}k</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Sistemde kayıtlı toplam</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    
                    <div className="flex items-center gap-3 text-red-500 mb-3">
                        <DollarSign className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">ATIL SERMAYE YÜKÜ</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">₺{(idleValue / 1000).toFixed(1)}k</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2">Satılmayan ürünlere bağlı bütçe</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-blue-500 mb-3">
                        <TrendingDown className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ORT. DEVİR HIZI</div>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">4.2</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">1 ay içindeki genel hız</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <AlertCircle className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">KRİTİK UYARILAR</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">12 Ürün</div>
                    <div className="text-xs font-semibold text-amber-500 mt-2 block">100 Gündür hiç hareket görmedi!</div>
                </div>
            </div>

            {/* 3. The Enterprise Data Grid Array */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Envanter Hareketliliği Listesi</h3>
                    
                    <button 
                        onClick={handleRequestExport}
                        disabled={isGeneratingExcel}
                        className="px-4 py-2 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        {isGeneratingExcel ? 'Analiz Çıkarılıyor...' : 'Raporu Dışa Aktar (BullMQ)'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <th className="p-5 whitespace-nowrap">Stok Kodu / Ürün Adı</th>
                                <th className="p-5 whitespace-nowrap text-right">Depodaki Stok</th>
                                <th className="p-5 whitespace-nowrap text-center">Devir Hızı</th>
                                <th className="p-5 whitespace-nowrap text-center">Hareketsiz Gün</th>
                                <th className="p-5 whitespace-nowrap text-right">Bağlı Değer</th>
                                <th className="p-5 whitespace-nowrap text-center">Risk Statüsü</th>
                            </tr>
                        </thead>
                        <tbody>
                            {INVENTORY_DATA.map((row) => {
                                let statusBadge;
                                if (row.status === 'IDLE') statusBadge = <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase rounded border border-red-200 dark:border-slate-200">ATIL (RİSKLİ)</span>;
                                else if (row.status === 'WARNING') statusBadge = <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase rounded border border-amber-200 dark:border-slate-200">DİKKAT EDİLMELİ</span>;
                                else if (row.status === 'FAST_MOVING') statusBadge = <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-200 dark:border-slate-200">HIZLI (YILDIZ)</span>;
                                else statusBadge = <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase rounded border border-slate-200 dark:border-white/5">NORMAL</span>;

                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{row.name}</div>
                                            <div className="text-xs font-black text-slate-400 dark:text-slate-500 mt-0.5">{row.sku}</div>
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-slate-900 dark:text-white">{row.stock} Adet</td>
                                        <td className="p-5 text-center text-sm font-bold text-blue-600 dark:text-blue-400">{row.turnoverRate}x</td>
                                        <td className="p-5 text-center">
                                            <span className={`text-xs font-black ${row.idleDays > 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {row.idleDays} Gün
                                            </span>
                                        </td>
                                        <td className="p-5 text-right text-sm font-bold text-red-600/70 dark:text-red-400/70">
                                            ₺{row.value.toLocaleString()}
                                        </td>
                                        <td className="p-5 text-center">
                                            {statusBadge}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
