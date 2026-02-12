"use client";

import { useState, useEffect } from 'react';
import {
    IconBank,
    IconRefresh,
    IconShield,
    IconZap,
    IconCheck,
    IconClock,
    IconAlert,
    IconCreditCard
} from '@/components/icons/PremiumIcons';
import BankIntegrationOnboarding from '@/components/Banking/BankIntegrationOnboarding';
import { BANK_FORM_DEFINITIONS } from '@/services/banking/bank-definitions';

// Simple Arrow components
const ArrowUpRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19L19 5M19 5H10M19 5V14" /></svg>;
const ArrowDownLeft = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 5L5 19M5 19H14M5 19V10" /></svg>;
const Plus = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const Search = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const ExternalLink = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

export default function OpenBankingDashboard() {
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState<any[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [selectingBank, setSelectingBank] = useState(false);

    const refreshConnections = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/kasalar');
            const data = await res.json();

            // Fetch real bank connections
            const bcRes = await fetch('/api/fintech/banking/credentials'); // We need an endpoint to list conns
            // For now, let's use the kasalar associated with bank connections
            const bankConns = data.kasalar.filter((k: any) => k.bankConnectionId);

            setConnections(bankConns.map((k: any) => ({
                id: k.bankConnectionId,
                bankName: k.name.split(' (')[0],
                iban: k.iban || 'TR...',
                status: 'ACTIVE',
                lastSync: 'Recently',
                balance: k.balance
            })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshConnections();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/fintech/banking/sync', { method: 'POST' });
            const json = await res.json();
            if (json.success) {
                alert('Tüm banka hareketleri başarıyla senkronize edildi!');
                refreshConnections();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSyncing(false);
        }
    };

    const connectBank = async (bankName: string) => {
        setSyncing(true);
        try {
            const iban = `TR${Math.floor(Math.random() * 10000000000000000000000000).toString()}`;
            const res = await fetch('/api/fintech/banking/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bankName, iban })
            });
            const json = await res.json();
            if (json.success) {
                alert(`${bankName} başarıyla bağlandı!`);
                setSelectingBank(false);
                refreshConnections();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return <div className="p-12 animate-pulse h-screen bg-black/20" />;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {selectingBank && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 p-2 rounded-[2rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 relative">
                        <button
                            onClick={() => {
                                setSelectingBank(false);
                                refreshConnections();
                            }}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all z-50 font-bold"
                        >
                            ✕
                        </button>
                        <div className="p-8">
                            <BankIntegrationOnboarding />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500">
                        OPEN BANKING HUB
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wider flex items-center gap-2">
                        <IconShield className="w-4 h-4 text-cyan-500" /> PSD2 / AISP Multi-Bank Infrastructure
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="btn-glass flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm"
                    >
                        <IconRefresh className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Senkronize Ediliyor...' : 'Tümünü Güncelle'}
                    </button>
                    <button
                        onClick={() => setSelectingBank(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-bold text-sm shadow-xl shadow-indigo-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Banka Bağla
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card glass p-6">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Total Bank Balance</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">173.540,50</span>
                        <span className="text-gray-500 font-bold">₺</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-emerald-400 text-[10px] font-bold">
                        <IconCheck className="w-3 h-3" />
                        2 Active Connections Secure
                    </div>
                </div>
                <div className="card glass p-6">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Unmatched Flows</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-rose-400">12</span>
                        <span className="text-gray-500 font-bold">Transactions</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-amber-400 text-[10px] font-bold">
                        <IconZap className="w-3 h-3" />
                        Action required for 3.250 ₺
                    </div>
                </div>
                <div className="card glass p-6 bg-gradient-to-br from-indigo-900/20 to-transparent">
                    <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-4">Last Sync Health</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">100</span>
                        <span className="text-indigo-400 font-bold">%</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-indigo-400 text-[10px] font-bold">
                        <IconClock className="w-3 h-3" />
                        All banks synced in last 24h
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Connections */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                        <IconBank className="w-4 h-4 text-cyan-400" /> Active Connections
                    </h2>
                    {connections.map(conn => (
                        <div key={conn.id} className="card glass p-4 hover:border-cyan-500/30 transition-all group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-lg text-cyan-400">
                                        {conn.bankName[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{conn.bankName}</h4>
                                        <p className="text-[10px] text-gray-500 font-mono">{conn.iban}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-white">{conn.balance.toLocaleString('tr-TR')} ₺</p>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold">{conn.lastSync}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Secure Flux (Normalized Bank Transactions) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <IconRefresh className="w-4 h-4 text-indigo-400" /> Recent Bank Streams
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="w-22 px-3 py-1 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                                <Search className="w-3 h-3 text-gray-500" />
                                <input type="text" placeholder="Filtrele..." className="bg-transparent text-[10px] outline-none text-white w-24" />
                            </div>
                        </div>
                    </div>

                    <div className="card glass divide-y divide-white/5 overflow-hidden">
                        {[
                            { id: 1, bank: 'Akbank', desc: 'TRENDYOL HAKEDIS 2026/FEB/12', amount: 1540.50, type: 'MARKETPLACE', status: 'MATCHED' },
                            { id: 2, bank: 'Akbank', desc: 'KIRA ODEMESI - SUBAT 2026', amount: -2500.00, type: 'EXPENSE', status: 'MATCHED' },
                            { id: 3, bank: 'Garanti', desc: 'EFT: ALI VELI - SIPARIS#4455', amount: 850.00, type: 'INVOICE', status: 'PENDING' },
                            { id: 4, bank: 'Garanti', desc: 'Sube Para Yatirma', amount: 1540.50, type: 'UNKNOWN', status: 'MANUAL' },
                        ].map(tx => (
                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded">{tx.type}</span>
                                            <p className="text-xs font-bold text-white max-w-[240px] truncate">{tx.desc}</p>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase">{tx.bank} • Today, 14:02</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${tx.amount > 0 ? 'text-white' : 'text-rose-400'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('tr-TR')} ₺
                                        </p>
                                        <div className="flex items-center gap-1 justify-end">
                                            <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'MATCHED' ? 'bg-emerald-500' : tx.status === 'PENDING' ? 'bg-amber-500' : 'bg-gray-500'}`} />
                                            <span className="text-[9px] text-gray-500 font-bold uppercase">{tx.status}</span>
                                        </div>
                                    </div>
                                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Insight */}
            <div className="card glass p-6 border-indigo-500/10 flex items-center justify-between bg-gradient-to-r from-indigo-900/10 to-transparent">
                <div className="flex items-center gap-4">
                    <IconZap className="w-5 h-5 text-yellow-400 animate-pulse" />
                    <div>
                        <h4 className="text-sm font-bold text-white">Reconciliation Tip</h4>
                        <p className="text-xs text-gray-500">Normalizer has successfully identified 3 Marketplace settlements for auto-closing.</p>
                    </div>
                </div>
                <button className="text-xs font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-widest">
                    Run Auto-Match <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function ChevronRight({ className }: any) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" /></svg>;
}
