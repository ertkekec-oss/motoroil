"use client";

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CalendarDays, LineChart } from 'lucide-react';

export default function IncomeStatementContent() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [period, setPeriod] = useState('this_year'); // this_month, this_year, all

    useEffect(() => {
        fetchReport();
    }, [period]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = '/api/financials/reports/income-statement';

            const now = new Date();
            let startDate = null;
            let endDate = null;

            if (period === 'this_month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
            } else if (period === 'this_year') {
                startDate = new Date(now.getFullYear(), 0, 1).toISOString();
                endDate = new Date(now.getFullYear(), 11, 31).toISOString();
            }

            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            }

            const res = await fetch(url);
            const json = await res.json();
            if (json.success) {
                setData(json.report);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val: number) => {
        return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
    };

    const SectionRow = ({ title, amount, isTotal = false, isSubTotal = false, color = 'text-slate-900 dark:text-white' }: any) => (
        <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t-2 border-white/20 mt-2 pt-2 font-black text-lg' : isSubTotal ? 'border-t border-slate-200 dark:border-slate-800 font-bold' : 'text-sm text-slate-500 dark:text-slate-400'}`}>
            <span className={`${isTotal ? '' : 'pl-4'}`}>{title}</span>
            <span className={`font-mono ${color}`}>{formatMoney(amount)}</span>
        </div>
    );

    const DetailRows = ({ section }: { section: string }) => {
        if (!data || !data.details) return null;
        const items = data.details.filter((d: any) => d.section === section);
        if (items.length === 0) return null;

        return (
            <div className="pl-8 text-xs text-slate-500 dark:text-slate-400 mb-2">
                {items?.map((item: any) => (
                    <div key={item.code} className="flex justify-between py-0.5 hover:text-slate-900 dark:text-white transition-colors">
                        <span>{item.code} - {item.name}</span>
                        <span>{formatMoney(item.balance)}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                Gelir Tablosu
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                                İşletme karlılık analizi ve performans raporu.
                            </p>
                        </div>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 gap-1 border border-slate-200 dark:border-white/5">
                        <button onClick={() => setPeriod('this_month')} className={`px-4 h-9 rounded-lg text-[13px] font-bold transition-all ${period === 'this_month' ? 'bg-white dark:bg-[#1e293b] text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Bu Ay</button>
                        <button onClick={() => setPeriod('this_year')} className={`px-4 h-9 rounded-lg text-[13px] font-bold transition-all ${period === 'this_year' ? 'bg-white dark:bg-[#1e293b] text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Bu Yıl</button>
                        <button onClick={() => setPeriod('all')} className={`px-4 h-9 rounded-lg text-[13px] font-bold transition-all ${period === 'all' ? 'bg-white dark:bg-[#1e293b] text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Tümü</button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-20 text-[13px] font-semibold text-slate-400 animate-pulse flex flex-col items-center gap-3">
                    <LineChart className="w-8 h-8 opacity-50" />
                    <span>Gelir tablosu hesaplanıyor...</span>
                </div>
            ) : data ? (
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-8 font-sans mt-0">
                    {/* A. BRÜT SATIŞLAR */}
                    <SectionRow title="A. BRÜT SATIŞLAR" amount={data.grossSales} isSubTotal color="text-slate-900 dark:text-white font-bold" />
                    <DetailRows section="grossSales" />

                    {/* B. SATIŞ İNDİRİMLERİ (-) */}
                    {data.discounts > 0 && (
                        <>
                            <SectionRow title="B. SATIŞ İNDİRİMLERİ (-)" amount={-data.discounts} isSubTotal color="text-rose-600 dark:text-rose-400 font-bold" />
                            <DetailRows section="discounts" />
                        </>
                    )}

                    {/* NET SATIŞLAR */}
                    <SectionRow title="C. NET SATIŞLAR" amount={data.netSales} isTotal color="text-slate-900 dark:text-white font-bold" />

                    {/* D. SATIŞLARIN MALİYETİ (-) */}
                    <div className="mt-4">
                        <SectionRow title="D. SATIŞLARIN MALİYETİ (-)" amount={-data.costOfSales} isSubTotal color="text-rose-600 dark:text-rose-400 font-bold" />
                        <DetailRows section="costOfSales" />
                    </div>

                    {/* BRÜT SATIŞ KARI */}
                    <div className="bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-white/5 p-5 rounded-2xl mt-4 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-500 rounded-l-2xl"></div>
                        <div className="flex justify-between items-center ml-2">
                            <span className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight">BRÜT SATIŞ KARI / ZARARI</span>
                            <span className={`text-[20px] font-black font-mono ${data.grossProfit >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatMoney(data.grossProfit)}
                            </span>
                        </div>
                    </div>

                    {/* E. FAALİYET GİDERLERİ (-) */}
                    <SectionRow title="E. FAALİYET GİDERLERİ (-)" amount={-data.operatingExp} isSubTotal color="text-slate-900 dark:text-white font-bold" />
                    <DetailRows section="operatingExp" />

                    {/* FAALİYET KARI */}
                    <SectionRow title="FAALİYET KARI / ZARARI" amount={data.operatingProfit} isTotal color={data.operatingProfit >= 0 ? 'text-slate-900 dark:text-white font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'} />

                    {/* F. DİĞER FAAL. OLAĞAN GELİR VE KARLAR */}
                    {data.otherIncome > 0 && (
                        <div className="mt-4">
                            <SectionRow title="F. DİĞER OLAĞAN GELİR VE KARLAR" amount={data.otherIncome} isSubTotal color="text-slate-900 dark:text-white font-bold" />
                            <DetailRows section="otherIncome" />
                        </div>
                    )}

                    {/* G. DİĞER FAAL. OLAĞAN GİDER VE ZARARLAR (-) */}
                    {data.otherExpense > 0 && (
                        <div className="mt-2">
                            <SectionRow title="G. DİĞER OLAĞAN GİDER VE ZARARLAR (-)" amount={-data.otherExpense} isSubTotal color="text-rose-600 dark:text-rose-400 font-bold" />
                            <DetailRows section="otherExpense" />
                        </div>
                    )}

                    {/* H. FİNANSMAN GİDERLERİ (-) */}
                    {data.financeExp > 0 && (
                        <div className="mt-2">
                            <SectionRow title="H. FİNANSMAN GİDERLERİ (-)" amount={-data.financeExp} isSubTotal color="text-rose-600 dark:text-rose-400 font-bold" />
                            <DetailRows section="financeExp" />
                        </div>
                    )}

                    {/* DÖNEM NET KARI */}
                    <div className={`mt-8 p-6 rounded-2xl border relative overflow-hidden ${data.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20'}`}>
                        <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${data.netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
                            <div>
                                <h3 className={`text-2xl font-black tracking-tight ${data.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                    {data.netProfit >= 0 ? 'DÖNEM NET KARI' : 'DÖNEM NET ZARARI'}
                                </h3>
                                <p className={`text-sm font-medium mt-1 ${data.netProfit >= 0 ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-rose-600/70 dark:text-rose-400/70'}`}>
                                    Vergi öncesi net finansal sonuç
                                </p>
                            </div>
                            <div className={`text-3xl md:text-4xl font-black font-mono tracking-tight ${data.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                {formatMoney(data.netProfit)}
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="text-center p-20 text-rose-600 dark:text-rose-400 font-bold text-[13px]">Veri alınamadı.</div>
            )}
        </div>
    );
}
