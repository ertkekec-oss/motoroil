"use client";

import { useState, useEffect } from 'react';
import { Calculator, PlusCircle, MinusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

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
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm p-6 overflow-hidden flex flex-col">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            KDV Tahakkuk Simülasyonu
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                            Ay sonu KDV durumunuzu anlık olarak simüle edin.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SOL TARAFI: GİRİŞLER */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm p-6 space-y-6 flex flex-col">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-4">
                        <PlusCircle className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight">KDV Alacakları (+)</h3>
                    </div>

                    <div className="flex justify-between items-center group bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <div>
                            <div className="font-mono text-lg text-indigo-600 dark:text-indigo-400 font-bold">190</div>
                            <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-1">Önceki Dönemden Devreden KDV</div>
                        </div>
                        <div className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300">{formatMoney(kdvData.devreden)}</div>
                    </div>

                    <div className="flex justify-between items-center group bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <div>
                            <div className="font-mono text-lg text-indigo-600 dark:text-indigo-400 font-bold">191</div>
                            <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-1">Bu Dönem İndirilecek KDV</div>
                        </div>
                        <div className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300">{formatMoney(kdvData.indirilecek)}</div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/10 pt-4 flex justify-between items-center px-4">
                        <div className="text-[13px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">TOPLAM ALACAK</div>
                        <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{formatMoney(kdvData.devreden + kdvData.indirilecek)}</div>
                    </div>
                </div>

                {/* SAĞ TARAFI: ÇIKIŞLAR */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm p-6 space-y-6 flex flex-col">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-4">
                        <MinusCircle className="w-5 h-5 text-rose-500" />
                        <h3 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight">KDV Borçları (-)</h3>
                    </div>

                    <div className="flex justify-between items-center group bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <div>
                            <div className="font-mono text-lg text-rose-600 dark:text-rose-400 font-bold">391</div>
                            <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-1">Bu Dönem Hesaplanan KDV</div>
                        </div>
                        <div className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300">{formatMoney(kdvData.hesaplanan)}</div>
                    </div>

                    <div className="flex justify-between items-center opacity-50 bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <div>
                            <div className="font-mono text-lg text-slate-500 dark:text-slate-500 font-bold">360</div>
                            <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-500 mt-1">Diğer Vergi (Dahil Değil)</div>
                        </div>
                        <div className="text-xl font-mono font-bold text-slate-400 dark:text-slate-500">0,00 ₺</div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/10 pt-4 flex justify-between items-center px-4">
                        <div className="text-[13px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">TOPLAM BORÇ</div>
                        <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">{formatMoney(kdvData.hesaplanan)}</div>
                    </div>
                </div>
            </div>

            {/* SONUÇ KARTI */}
            <div className="mt-8 relative animate-in slide-in-from-bottom-4 duration-700">
                {kdvData.odenecek > 0 ? (
                    <div className="bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 rounded-[32px] p-8 md:p-12 text-center relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-6 opacity-80 animate-pulse" />
                        <div className="text-[13px] font-black text-rose-600/80 dark:text-rose-400/80 uppercase tracking-[0.2em] mb-4">BU AY ÖDENECEK KDV VAR</div>
                        <div className="text-5xl md:text-7xl font-black text-rose-700 dark:text-rose-300 font-mono tracking-tight">{formatMoney(kdvData.odenecek)}</div>
                        <p className="mt-6 text-rose-600/80 dark:text-rose-400/80 text-[15px] font-medium max-w-lg mx-auto">Dikkat: Bu tutar tahmini olup, resmi beyanname ile kesinleşecektir.</p>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 rounded-[32px] p-8 md:p-12 text-center relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-6 opacity-80" />
                        <div className="text-[13px] font-black text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-[0.2em] mb-4">SONRAKİ AYA DEVREDEN KDV</div>
                        <div className="text-5xl md:text-7xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-tight">{formatMoney(kdvData.sonrakiDevreden)}</div>
                        <p className="mt-6 text-emerald-600/80 dark:text-emerald-400/80 text-[15px] font-medium max-w-lg mx-auto">Bu ay KDV ödemesi çıkmıyor. Aradaki fark 190 hesabına devredilecek.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
