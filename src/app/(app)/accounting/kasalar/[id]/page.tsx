"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFinancials } from "@/contexts/FinancialContext";
import { useTheme } from "@/contexts/ThemeContext";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Wallet, Landmark, Building2, CreditCard } from "lucide-react";

export default function KasaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { kasalar, transactions, isInitialLoading } = useFinancials();
    const { theme } = useTheme();

    const kasaId = params.id as string;
    const kasa = kasalar.find(k => String(k.id) === kasaId);

    const kasaTransactions = useMemo(() => {
        if (!kasaId) return [];
        return transactions.filter(t => String(t.kasaId) === kasaId || String(t.targetKasaId) === kasaId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, kasaId]);

    if (isInitialLoading) {
        return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;
    }

    if (!kasa) {
        return (
            <div className={`p-8 min-h-screen ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900'} text-center`}>
                <h2 className="text-xl font-bold mt-10">Kasa veya Banka hesabı bulunamadı.</h2>
                <button onClick={() => router.back()} className="mt-4 text-blue-500 hover:underline">Geri Dön</button>
            </div>
        );
    }

    const lightGradient = "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.85))";
    const darkGradient = "linear-gradient(180deg, rgba(15,23,42,0.75), rgba(15,23,42,0.55))";
    const glassStyle = theme === 'light' ? { background: lightGradient, border: '1px solid rgba(15,23,42,0.06)' } : { background: darkGradient, border: '1px solid rgba(96,165,250,0.15)' };

    const getIcon = () => {
        if (kasa.type === 'Banka' || kasa.type === 'bank') return <Building2 size={32} className={theme === 'light' ? 'text-blue-600' : 'text-blue-400'} />;
        if (kasa.type.toLowerCase().includes('pos') || kasa.type === 'Kredi Kartı') return <CreditCard size={32} className={theme === 'light' ? 'text-purple-600' : 'text-purple-400'} />;
        if (kasa.type === 'Emanet') return <Landmark size={32} className={theme === 'light' ? 'text-amber-600' : 'text-amber-400'} />;
        return <Wallet size={32} className={theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'} />;
    };

    return (
        <div data-pos-theme={theme} className="w-full min-h-[100vh] px-8 py-8 space-y-8 font-sans">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/accounting?tab=banks')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${theme === 'light' ? 'bg-white hover:bg-slate-100 text-slate-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'} shadow-sm`}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className={`text-[22px] font-semibold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Hesap Detayı
                </h1>
            </div>

            <div style={glassStyle} className="rounded-[24px] p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${theme === 'light' ? 'bg-white shadow-sm border border-slate-100' : 'bg-slate-800 border border-slate-700'}`}>
                        {getIcon()}
                    </div>
                    <div>
                        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1">
                            {kasa.type === 'bank' ? 'Banka Hesabı' : kasa.type}
                        </div>
                        <h2 className={`text-2xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{kasa.name}</h2>
                        {kasa.iban && <div className="text-sm text-slate-500 mt-1 tracking-widest font-mono">{kasa.iban}</div>}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-2">Güncel Bakiye</div>
                    <div className={`text-[42px] font-black tracking-tight ${kasa.balance >= 0 ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : 'text-red-500'}`}>
                        {formatCurrency(kasa.balance)}
                    </div>
                    <div className="text-sm font-semibold opacity-70 mt-1">{kasa.currency || 'TL'}</div>
                </div>
            </div>

            <div style={glassStyle} className="rounded-[24px] p-6 shadow-sm overflow-hidden">
                <h3 className={`text-[18px] font-semibold mb-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Hesap Hareketleri
                </h3>
                {kasaTransactions.length === 0 ? (
                    <div className="text-center py-10 opacity-50">Henüz hiçbir hareket bulunmuyor.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 bg-transparent">
                                <tr className={`border-b ${theme === 'light' ? 'border-slate-200' : 'border-[rgba(96,165,250,0.15)]'}`}>
                                    <th className="h-[56px] px-4 text-left text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 align-middle">Tarih</th>
                                    <th className="h-[56px] px-4 text-left text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 align-middle">İşlem Tipi</th>
                                    <th className="h-[56px] px-4 text-left text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 align-middle">Açıklama</th>
                                    <th className="h-[56px] px-4 text-right text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 align-middle">Giriş (Alacak)</th>
                                    <th className="h-[56px] px-4 text-right text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 align-middle">Çıkış (Borç)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgba(15,23,42,0.04)] dark:divide-[rgba(96,165,250,0.05)]">
                                {kasaTransactions.map((tx, i) => {
                                    // Identify if it's IN or OUT for this specific kasa
                                    let isIncome = false;
                                    
                                    if (tx.type === 'Transfer') {
                                        if (String(tx.targetKasaId) === kasaId) isIncome = true; // Received transfer
                                        if (String(tx.kasaId) === kasaId) isIncome = false; // Sent transfer
                                    } else {
                                        isIncome = ['Sales', 'Collection', 'Income'].includes(tx.type);
                                        // Wait, if it's an Out check or Expense it's OUT
                                    }

                                    return (
                                        <tr key={i} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                            <td className="px-4 text-sm font-medium">{new Date(tx.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</td>
                                            <td className="px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.05em] ${tx.type === 'Transfer' ? 'bg-indigo-500/10 text-indigo-500' : isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {tx.type === 'Transfer' ? (isIncome ? 'Gelen Transfer' : 'Giden Transfer') : (isIncome ? 'Giriş' : 'Çıkış')}
                                                </span>
                                            </td>
                                            <td className="px-4 text-sm opacity-80">{tx.description || tx.type}</td>
                                            <td className="px-4 text-right font-bold text-emerald-500">{isIncome ? formatCurrency(tx.amount) : '-'}</td>
                                            <td className="px-4 text-right font-bold text-red-500">{!isIncome ? formatCurrency(tx.amount) : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
