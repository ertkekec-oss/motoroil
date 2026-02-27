"use client";

import { useState, useEffect } from "react";
import FinanceStatusBanner from "@/components/FinanceStatusBanner";

export default function PayoutsPage() {
    const [destinations, setDestinations] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [balances, setBalances] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch("/api/network/payouts/summary").then(r => r.ok ? r.json() : {} as any),
            fetch("/api/network/payouts/destinations").then(r => r.ok ? r.json() : []),
            fetch("/api/network/payouts/requests").then(r => r.ok ? r.json() : { items: [] })
        ])
            .then(([summaryData, destinationsData, requestsData]) => {
                if (summaryData.balances) setBalances(summaryData.balances);
                if (Array.isArray(destinationsData)) setDestinations(destinationsData);
                if (requestsData.items) setRequests(requestsData.items);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);


    const formatMoney = (amount: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
    const formatDate = (dateString: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(dateString));

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "PROCESSING": return "bg-blue-100 text-blue-800 border-blue-200";
            case "PAID": return "bg-green-100 text-green-800 border-green-200";
            case "REJECTED": case "FAILED": return "bg-red-100 text-red-800 border-red-200";
            default: return "bg-slate-100 text-slate-800 border-slate-200";
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">💳 Para Çekme (Payouts)</h1>
            <FinanceStatusBanner />

            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm shadow-blue-50">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Çekilebilir Bakiye (Available)</p>
                    <p className="text-3xl font-bold text-blue-700">{formatMoney(balances?.availableBalance || 0)}</p>
                    <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Para Çek Talebi Oluştur</button>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm opacity-80">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Bekleyen Kazanç (Pending)</p>
                    <p className="text-2xl font-bold text-slate-700">{formatMoney(balances?.pendingBalance || 0)}</p>
                    <div className="text-xs text-orange-600 mt-2 font-medium bg-orange-50 inline-block px-2 py-1 rounded">Müşteri onayında / Escrow'da</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm opacity-80">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Rezerve Edilmiş (Reserved)</p>
                    <p className="text-2xl font-bold text-slate-700">{formatMoney(balances?.reservedBalance || 0)}</p>
                    <div className="text-xs text-slate-500 mt-2 font-medium bg-slate-100 inline-block px-2 py-1 rounded">İhtilaf / İade teminatı</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Destinations */}
                <div className="lg:col-span-1 border border-slate-200 bg-slate-50 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800">Banka Hesaplarım</h2>
                        <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">+ Yeni Ekle</button>
                    </div>
                    {loading ? (
                        <p className="text-sm text-slate-500">Yükleniyor...</p>
                    ) : (
                        <div className="space-y-3">
                            {destinations.map(d => (
                                <div key={d.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col group hover:border-blue-300 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-slate-800 text-sm">Banka Hesabı</span>
                                        {d.status === "ACTIVE" ?
                                            <span className="h-2 w-2 rounded-full bg-green-500 mt-1.5" title="Aktif"></span> :
                                            <span className="h-2 w-2 rounded-full bg-slate-300 mt-1.5" title="Pasif"></span>
                                        }
                                    </div>
                                    <span className="font-mono text-xs text-slate-500 tracking-wider bg-slate-100 p-1.5 rounded">{d.ibanMasked}</span>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-xs text-slate-400 font-medium uppercase">{d.holderNameMasked}</span>
                                        {d.status === "ACTIVE" && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">Varsayılan Yap</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Requests */}
                <div className="lg:col-span-2 border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-800">Çekim Taleplerim</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-white text-slate-400 border-b border-slate-100 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Tarih</th>
                                    <th className="px-6 py-4 font-semibold">Tutar</th>
                                    <th className="px-6 py-4 font-semibold">Hesap</th>
                                    <th className="px-6 py-4 font-semibold">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Veriler yükleniyor...</td></tr>
                                ) : requests.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Henüz para çekme talebiniz bulunmuyor.</td></tr>
                                ) : (
                                    requests.map(req => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(req.createdAt)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{formatMoney(req.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">{req.destination}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wide ${getStatusStyle(req.status)}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
