
"use client";

import { useState } from 'react';

export default function AdminPlans() {
    const [plans, setPlans] = useState([
        { id: '1', name: 'Ücretsiz Deneme (Trial)', price: 0, period: '14 Gün', status: 'Active', members: 0 },
        { id: '2', name: 'Standart Paket', price: 950, period: 'Aylık', status: 'Active', members: 12 },
        { id: '3', name: 'Premium Paket', price: 1850, period: 'Aylık', status: 'Active', members: 45 },
        { id: '4', name: 'Kurumsal (Enterprise)', price: 0, period: 'Özel', status: 'Active', members: 8 }
    ]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Paketler & Fiyatlandırma</h1>
                    <p className="text-slate-500 text-sm">Abonelik planlarını ve fiyatlarını yönetin.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    + Yeni Paket Ekle
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Adı</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fiyat</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periyot</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aktif Üye</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Durum</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {plans.map((plan) => (
                            <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-900">{plan.name}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    {plan.price === 0 ? 'Ücretsiz / Özel' : `₺${plan.price.toLocaleString()}`}
                                </td>
                                <td className="px-6 py-4 text-slate-500">{plan.period}</td>
                                <td className="px-6 py-4 text-slate-500">{plan.members}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-green-100">AKTİF</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-blue-600 transition-colors mr-3">Düzenle</button>
                                    <button className="text-slate-400 hover:text-red-600 transition-colors">Sil</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-blue-100 text-sm font-medium">Ortalama ARPU</p>
                    <h4 className="text-3xl font-bold mt-2">₺1.420</h4>
                    <p className="text-blue-100 text-xs mt-4">Kullanıcı başına ortalama gelir geçen aya göre %5 arttı.</p>
                </div>
            </div>
        </div>
    );
}
