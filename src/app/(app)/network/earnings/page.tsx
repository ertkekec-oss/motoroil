"use client";

import { useState, useEffect } from "react";
import FinanceStatusBanner from "@/components/FinanceStatusBanner";
import { useApp } from "@/contexts/AppContext";

export default function NetworkEarningsPage() {
    const { currentUser } = useApp();
    const [activeTab, setActiveTab] = useState("pending");
    const [earnings, setEarnings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock initial fetch
    useEffect(() => {
        setLoading(true);
        // Fallback mock data
        fetch("/api/network/earnings")
            .then(res => res.json())
            .then(data => {
                if (data.earnings) setEarnings(data.earnings);
                else throw new Error("No data");
            })
            .catch(() => {
                // Mock data if no endpoint
                setEarnings([
                    { id: "e1", createdAt: "2026-02-25T10:00:00Z", refId: "SHP-109041", gross: 12500, commission: 250, net: 12250, status: "PENDING", expectedClearDate: "2026-03-10T10:00:00Z" },
                    { id: "e2", createdAt: "2026-02-24T14:30:00Z", refId: "SHP-108992", gross: 8400, commission: 168, net: 8232, status: "CLEARED", expectedClearDate: "2026-02-28T14:30:00Z" },
                    { id: "e3", createdAt: "2026-02-20T09:15:00Z", refId: "SHP-107551", gross: 45000, commission: 900, net: 44100, status: "RELEASED", expectedClearDate: "2026-02-25T09:15:00Z" },
                    { id: "e4", createdAt: "2026-02-15T16:45:00Z", refId: "SHP-105122", gross: 3200, commission: 64, net: 3136, status: "REFUNDED", expectedClearDate: null }
                ]);
            })
            .finally(() => setLoading(false));
    }, []);

    const filteredEarnings = earnings.filter(e => {
        if (activeTab === "pending") return ["PENDING", "CLEARED"].includes(e.status);
        if (activeTab === "released") return e.status === "RELEASED";
        if (activeTab === "refunds") return ["REFUNDED", "CHARGEBACK"].includes(e.status);
        return true;
    });

    const formatMoney = (amount: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
    const formatDate = (dateString: string | null) => dateString ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(dateString)) : "-";

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-orange-100 text-orange-800 border-orange-200";
            case "CLEARED": return "bg-blue-100 text-blue-800 border-blue-200";
            case "RELEASED": return "bg-green-100 text-green-800 border-green-200";
            case "REFUNDED": case "CHARGEBACK": return "bg-red-100 text-red-800 border-red-200";
            default: return "bg-slate-100 text-slate-800";
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">💵 Ağ Kazançları</h1>
            <FinanceStatusBanner />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Toplam Bekleyen Kazanç</p>
                    <p className="text-2xl font-bold text-slate-900">{formatMoney(20482)}</p>
                    <div className="text-xs text-orange-600 mt-2 font-medium bg-orange-50 inline-block px-2 py-1 rounded">PENDING & CLEARED</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Serbest Bırakılacak (7 Gün)</p>
                    <p className="text-2xl font-bold text-slate-900">{formatMoney(8232)}</p>
                    <div className="text-xs text-blue-600 mt-2 font-medium bg-blue-50 inline-block px-2 py-1 rounded">KESİNLEŞTİ</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Serbest Bırakılan (30 Gün)</p>
                    <p className="text-2xl font-bold text-slate-900">{formatMoney(124500)}</p>
                    <div className="text-xs text-green-600 mt-2 font-medium bg-green-50 inline-block px-2 py-1 rounded">ÖDENDİ</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Ortalama Release Süresi</p>
                    <p className="text-2xl font-bold text-slate-900">14.2 Gün</p>
                    <div className="text-xs text-slate-600 mt-2 font-medium bg-slate-100 inline-block px-2 py-1 rounded">Sektör Ort.: 15.0 Gün</div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex space-x-6">
                        <button onClick={() => setActiveTab("pending")} className={`text-sm font-semibold pb-4 -mb-4 border-b-2 transition-colors ${activeTab === "pending" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Bekleyen ({earnings.filter(e => ["PENDING", "CLEARED"].includes(e.status)).length})</button>
                        <button onClick={() => setActiveTab("released")} className={`text-sm font-semibold pb-4 -mb-4 border-b-2 transition-colors ${activeTab === "released" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Serbest Bırakılan</button>
                        <button onClick={() => setActiveTab("refunds")} className={`text-sm font-semibold pb-4 -mb-4 border-b-2 transition-colors ${activeTab === "refunds" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>İadeler / Chargeback</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Tarih</th>
                                <th className="px-6 py-3 font-semibold">Shipment Ref</th>
                                <th className="px-6 py-3 font-semibold text-right">Brüt Tutar</th>
                                <th className="px-6 py-3 font-semibold text-right text-red-500">Komisyon</th>
                                <th className="px-6 py-3 font-semibold text-right text-green-700">Net Hakediş</th>
                                <th className="px-6 py-3 font-semibold text-center">Durum</th>
                                <th className="px-6 py-3 font-semibold text-right">Serbest Bırakılma</th>
                                <th className="px-6 py-3 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">Veriler yükleniyor...</td>
                                </tr>
                            ) : filteredEarnings.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">Bu sekmede kayıt bulunmuyor.</td>
                                </tr>
                            ) : (
                                filteredEarnings.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{item.refId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">{formatMoney(item.gross)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">-{formatMoney(item.commission)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-green-700">{formatMoney(item.net)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusStyle(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-slate-500">{formatDate(item.expectedClearDate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">Detay</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
