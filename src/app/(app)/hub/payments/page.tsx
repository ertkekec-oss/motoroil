"use client";

import { useState, useEffect } from "react";
import FinanceStatusBanner from "@/components/FinanceStatusBanner";

export default function PaymentsPage() {
    const [bankStatements, setBankStatements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/hub/payments')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.bankStatements) {
                    setBankStatements(data.bankStatements);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Calculate totals loosely (since this is a demo/hub overview)
    const inTotal = bankStatements.reduce((acc, curr) => acc + Number(curr.credit || 0), 0);
    const outTotal = bankStatements.reduce((acc, curr) => acc + Number(curr.debit || 0), 0);

    return (
        <div className="bg-slate-50 min-h-screen  pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-slate-900  tracking-tight mb-2">📊 Ödemeler & Tahsilat (B2B Banka Entegrasyonu)</h1>
                    <p className="text-sm text-slate-600 ">Gelen B2B ödemeler, fon transferleri ve açık banka hareketleri.</p>
                </div>

                <div className="mb-8">
                    <FinanceStatusBanner />
                </div>

                {loading ? (
                    <div className="bg-white  p-12 rounded-2xl border border-slate-200  shadow-sm flex flex-col justify-center items-center">
                        <div className="w-8 h-8 border-4 border-slate-200  border-t-slate-900 rounded-full animate-spin mb-4"></div>
                        <span className="text-sm font-medium text-slate-500  uppercase tracking-widest">Banka verileri yükleniyor...</span>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white  border border-emerald-100  p-6 rounded-2xl shadow-sm">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Aylık Tahsilat Toplamı</h3>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(inTotal)}
                                </p>
                            </div>
                            <div className="bg-white  border border-red-100  p-6 rounded-2xl shadow-sm">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Açık/Giden Ödemeler</h3>
                                <p className="text-2xl font-bold text-red-600">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(outTotal)}
                                </p>
                            </div>
                            <div className="bg-white  border border-blue-100  p-6 rounded-2xl shadow-sm">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Net Bakiye Hareketi</h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(inTotal - outTotal)}
                                </p>
                            </div>
                            <div className="bg-white  border border-slate-200  p-6 rounded-2xl shadow-sm flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Banka Entegrasyon</h3>
                                    <p className="text-[13px] font-bold text-emerald-600 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Senkronize
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white  rounded-2xl border border-slate-200  shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100  bg-slate-50 ">
                                <h3 className="text-base font-semibold text-slate-900 ">Son Banka Hareketleri</h3>
                            </div>

                            <div className="p-0">
                                {bankStatements.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <span className="text-4xl text-slate-400">🏦</span>
                                        <h3 className="font-semibold text-slate-900  mt-4">Henüz Banka Hareketi Yok</h3>
                                        <p className="text-slate-500 text-sm mt-2">Banka entegrasyonundan herhangi bir hareket çekilmedi.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-600 ">
                                            <thead className="bg-slate-50  text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 ">
                                                <tr>
                                                    <th className="px-6 py-4">Tarih</th>
                                                    <th className="px-6 py-4">Referans (Banka Kodu)</th>
                                                    <th className="px-6 py-4">Açıklama</th>
                                                    <th className="px-6 py-4 text-right">Giriş (Alacak)</th>
                                                    <th className="px-6 py-4 text-right">Çıkış (Borç)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 ">
                                                {bankStatements.map(b => (
                                                    <tr key={b.id} className="hover:bg-slate-50 :bg-slate-800/20 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-slate-900 ">
                                                            {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(b.statementDate))}
                                                        </td>
                                                        <td className="px-6 py-4">{b.referenceNo || b.bankAccountCode}</td>
                                                        <td className="px-6 py-4">{b.description}</td>
                                                        <td className="px-6 py-4 font-bold text-emerald-600 text-right">
                                                            {Number(b.credit || 0) > 0 ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(b.credit)) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-red-600 text-right">
                                                            {Number(b.debit || 0) > 0 ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(b.debit)) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
