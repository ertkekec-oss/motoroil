
"use client";

import { useState } from 'react';

export default function AdminTransactions() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">SaaS Ödemeleri & Abonelik Gelirleri</h1>
                <p className="text-slate-500 text-sm">Tüm müşterilerden gelen ödemeleri ve fatura geçmişini inceleyin.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Son İşlemler</h3>
                            <div className="flex gap-2">
                                <span className="bg-blue-50 text-blue-700 font-bold text-[10px] px-2 py-1 rounded">IYZICO</span>
                                <span className="bg-slate-50 text-slate-500 font-bold text-[10px] px-2 py-1 rounded">BANKA</span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">TN</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Müşteri #{i} Ödemesi</p>
                                            <p className="text-xs text-slate-500">Kredi Kartı • {new Date().toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900">₺1.250,00</p>
                                        <p className="text-[10px] uppercase font-bold text-emerald-600">Başarılı</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-black">€</div>
                        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Toplam MRR</p>
                        <h4 className="text-4xl font-black mt-2">₺184.200</h4>
                        <div className="mt-8 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <p className="text-emerald-400 text-xs font-bold">Önceki aya göre %12 büyüme</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h4 className="text-slate-900 font-bold mb-4">Ödeme Yöntemi Dağılımı</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Kredi Kartı (Iyzico)</span>
                                <span className="text-xs font-bold text-slate-900">82%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1 rounded-full">
                                <div className="bg-blue-600 h-1 rounded-full w-[82%]"></div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-slate-500">EFT/Havale</span>
                                <span className="text-xs font-bold text-slate-900">18%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1 rounded-full">
                                <div className="bg-indigo-400 h-1 rounded-full w-[18%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
