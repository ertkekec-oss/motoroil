"use client";

import { useState, useEffect } from "react";
import FinanceStatusBanner from "@/components/FinanceStatusBanner";

export default function BoostInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingHealth, setBillingHealth] = useState<"CURRENT" | "GRACE" | "OVERDUE">("CURRENT");
    const [graceDaysRemaining, setGraceDaysRemaining] = useState<number>(0);

    useEffect(() => {
        setLoading(true);
        // Mock API load
        setTimeout(() => {
            setBillingHealth("GRACE");
            setGraceDaysRemaining(3);
            setInvoices([
                { id: "inv-002", period: "2026-02", amount: 1500, status: "GRACE", dueAt: "2026-02-25T23:59:59Z", paidAt: null, groupId: "lg_5932a" },
                { id: "inv-001", period: "2026-01", amount: 1250, status: "PAID", dueAt: "2026-01-25T23:59:59Z", paidAt: "2026-01-24T14:15:00Z", groupId: "lg_1234b" }
            ]);
            setLoading(false);
        }, 600);
    }, []);

    const formatMoney = (amount: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
    const formatDate = (dateString: string | null) => dateString ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(dateString)) : "-";

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "PAID": return "bg-green-100 text-green-800 border-green-200";
            case "ISSUED": return "bg-blue-100 text-blue-800 border-blue-200";
            case "GRACE": return "bg-amber-100 text-amber-800 border-amber-200";
            case "OVERDUE": return "bg-red-100 text-red-800 border-red-200 box-shadow-red animate-pulse";
            default: return "bg-slate-100 text-slate-800 border-slate-200";
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">🧾 Boost Faturaları & Tahsilat</h1>
            <FinanceStatusBanner />

            {/* Health Banner */}
            {!loading && billingHealth === "GRACE" && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <h3 className="text-amber-800 font-bold text-lg">Ödeme İçin Ek Süreniz (Grace Period) Devam Ediyor</h3>
                        <p className="text-amber-700 text-sm mt-1">Boost üyeliğinizin askıya alınmaması için <strong className="font-extrabold">{graceDaysRemaining} gün</strong> içerisinde ödemenizi tamamlayınız.</p>
                    </div>
                    <button className="mt-4 md:mt-0 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-lg transition-transform transform active:scale-95 shadow-md">
                        Hemen Öde
                    </button>
                </div>
            )}

            {!loading && billingHealth === "OVERDUE" && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <h3 className="text-red-800 font-bold text-lg flex items-center gap-2">⚠️ Aboneliğiniz Askıya Alındı (Overdue)</h3>
                        <p className="text-red-700 text-sm mt-1">Gecikmiş faturalarınızdan dolayı hesap görünürlüğünüz düşürüldü. Aktifleştirmek için lütfen ödeme yapınız.</p>
                    </div>
                    <button className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-transform transform active:scale-95 shadow-md">
                        Gecikmiş Faturayı Öde
                    </button>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Geçmiş Faturalarınız</h2>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Abonelik AR Tahakkukları</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-white text-slate-400 border-b border-slate-100 text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Dönem</th>
                                <th className="px-6 py-4 font-semibold">Tutar</th>
                                <th className="px-6 py-4 font-semibold">Son Ödeme (Due)</th>
                                <th className="px-6 py-4 font-semibold">Ödenme (Paid)</th>
                                <th className="px-6 py-4 font-semibold">Durum</th>
                                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Veriler yükleniyor...</td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Henüz faturanız bulunmuyor.</td></tr>
                            ) : (
                                invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{inv.period}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{formatMoney(inv.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatDate(inv.dueAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatDate(inv.paidAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusStyle(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex gap-3 justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-slate-400 hover:text-slate-800 font-medium text-xs">PDF</button>
                                                <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Detay</button>
                                            </div>
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
