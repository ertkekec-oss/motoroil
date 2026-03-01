"use client";

import { useState, useEffect } from 'react';

interface AccountData {
    code: string;
    name: string;
    balance: number;
    balanceDirection: string;
}

export default function VatSimulationContent() {
    const [loading, setLoading] = useState(true);
    const [kdvData, setKdvData] = useState<any>({
        devreden: 0, // 190
        indirilecek: 0, // 191
        hesaplanan: 0, // 391
        odenecek: 0,
        sonrakiDevreden: 0
    });

    useEffect(() => {
        calculateVat();
    }, []);

    const calculateVat = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/financials/reports/trial-balance');
            const json = await res.json();

            if (json.success) {
                const report: AccountData[] = json.report;

                // 1. DEVREDEN KDV (190) - Only if it has Debit Balance
                const acc190 = report.find(r => r.code.startsWith('190'));
                const devreden = acc190 && acc190.balanceDirection === 'Borç' ? acc190.balance : 0;

                // 2. İNDİRİLECEK KDV (191) - Only if it has Debit Balance
                const acc191 = report.find(r => r.code.startsWith('191'));
                const indirilecek = acc191 && acc191.balanceDirection === 'Borç' ? acc191.balance : 0;

                // 3. HESAPLANAN KDV (391) - Only if it has Credit Balance
                const acc391 = report.find(r => r.code.startsWith('391'));
                const hesaplanan = acc391 && acc391.balanceDirection === 'Alacak' ? acc391.balance : 0;

                // Calculation
                const totalReceivable = devreden + indirilecek;
                const totalPayable = hesaplanan;

                let odenecek = 0;
                let sonrakiDevreden = 0;

                if (totalPayable > totalReceivable) {
                    odenecek = totalPayable - totalReceivable;
                    sonrakiDevreden = 0;
                } else {
                    odenecek = 0;
                    sonrakiDevreden = totalReceivable - totalPayable;
                }

                setKdvData({
                    devreden,
                    indirilecek,
                    hesaplanan,
                    odenecek,
                    sonrakiDevreden
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val: number) => val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

    return (
        <div className="animate-in fade-in duration-500">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm mb-6">
                <div>
                    <h2 className="text-[24px] font-bold text-slate-900 dark:text-white  ">
                        🧾 KDV Tahakkuk Simülasyonu
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Ay sonu KDV durumunuzu anlık olarak simüle edin.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SOL TARAFI: GİRİŞLER */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm-plus p-6 space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">KDV Alacakları (+)</h3>

                    <div className="flex justify-between items-center group">
                        <div>
                            <div className="font-mono text-xl text-blue-600 dark:text-blue-400 font-bold">190</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Önceki Dönemden Devreden KDV</div>
                        </div>
                        <div className="text-2xl font-mono">{formatMoney(kdvData.devreden)}</div>
                    </div>

                    <div className="flex justify-between items-center group">
                        <div>
                            <div className="font-mono text-xl text-blue-600 dark:text-blue-400 font-bold">191</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Bu Dönem İndirilecek KDV</div>
                        </div>
                        <div className="text-2xl font-mono">{formatMoney(kdvData.indirilecek)}</div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">TOPLAM İNDİRİM TOPLAMI</div>
                        <div className="text-xl font-bold font-mono text-blue-400">{formatMoney(kdvData.devreden + kdvData.indirilecek)}</div>
                    </div>
                </div>

                {/* SAĞ TARAFI: ÇIKIŞLAR */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm-plus p-6 space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">KDV Borçları (-)</h3>

                    <div className="flex justify-between items-center group">
                        <div>
                            <div className="font-mono text-xl text-rose-600 dark:text-rose-400 font-bold">391</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Bu Dönem Hesaplanan KDV</div>
                        </div>
                        <div className="text-2xl font-mono">{formatMoney(kdvData.hesaplanan)}</div>
                    </div>

                    <div className="flex justify-between items-center opacity-50">
                        <div>
                            <div className="font-mono text-xl text-rose-600 dark:text-rose-400 font-bold">360</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Diğer Vergi Kesintileri (Dahil Değil)</div>
                        </div>
                        <div className="text-2xl font-mono">0,00 ₺</div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">TOPLAM HESAPLANAN</div>
                        <div className="text-xl font-bold font-mono text-rose-400">{formatMoney(kdvData.hesaplanan)}</div>
                    </div>
                </div>
            </div>

            {/* SONUÇ KARTI */}
            <div className="mt-8 relative">
                {kdvData.odenecek > 0 ? (
                    <div className="bg-rose-50 border border-rose-200 dark:bg-rose-900/10 dark:border-rose-500/30 rounded-[20px] border border-rose-500/30 p-8 text-center animate-pulse">
                        <div className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2">BU AY ÖDENECEK KDV VAR</div>
                        <div className="text-6xl font-black text-rose-700 dark:text-rose-100 font-mono drop-shadow-xl">{formatMoney(kdvData.odenecek)}</div>
                        <p className="mt-4 text-rose-600 dark:text-rose-400 text-sm">Dikkat: Bu tutar tahmini olup, resmi beyanname ile kesinleşecektir.</p>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-500/30 rounded-[20px] border border-emerald-500/30 p-8 text-center">
                        <div className="text-sm font-bold text-emerald-300 uppercase tracking-widest mb-2">SONRAKİ AYA DEVREDEN KDV</div>
                        <div className="text-6xl font-black text-emerald-700 dark:text-emerald-100 font-mono drop-shadow-xl">{formatMoney(kdvData.sonrakiDevreden)}</div>
                        <p className="mt-4 text-emerald-300 text-sm">Bu ay KDV ödemesi çıkmıyor. Aradaki fark 190 hesabına devredilecek.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
