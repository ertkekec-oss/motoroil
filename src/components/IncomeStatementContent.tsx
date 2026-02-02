"use client";

import { useState, useEffect } from 'react';

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

    const SectionRow = ({ title, amount, isTotal = false, isSubTotal = false, color = 'text-white' }: any) => (
        <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t-2 border-white/20 mt-2 pt-2 font-black text-lg' : isSubTotal ? 'border-t border-white/10 font-bold' : 'text-sm text-gray-400'}`}>
            <span className={`${isTotal ? '' : 'pl-4'}`}>{title}</span>
            <span className={`font-mono ${color}`}>{formatMoney(amount)}</span>
        </div>
    );

    const DetailRows = ({ section }: { section: string }) => {
        if (!data || !data.details) return null;
        const items = data.details.filter((d: any) => d.section === section);
        if (items.length === 0) return null;

        return (
            <div className="pl-8 text-xs text-gray-500 mb-2">
                {items.map((item: any) => (
                    <div key={item.code} className="flex justify-between py-0.5 hover:text-gray-300 transition-colors">
                        <span>{item.code} - {item.name}</span>
                        <span>{formatMoney(item.balance)}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="animate-fade-in-up max-w-4xl mx-auto">
            <div className="card glass mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                            📊 Gelir Tablosu
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">İşletme karlılık analizi ve performans raporu.</p>
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                        <button onClick={() => setPeriod('this_month')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${period === 'this_month' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Bu Ay</button>
                        <button onClick={() => setPeriod('this_year')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${period === 'this_year' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Bu Yıl</button>
                        <button onClick={() => setPeriod('all')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${period === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Tümü</button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-20 text-gray-500">Hesaplanıyor...</div>
            ) : data ? (
                <div className="card glass-plus p-8 font-sans">
                    {/* A. BRÜT SATIŞLAR */}
                    <SectionRow title="A. BRÜT SATIŞLAR" amount={data.grossSales} isSubTotal color="text-emerald-400" />
                    <DetailRows section="grossSales" />

                    {/* B. SATIŞ İNDİRİMLERİ (-) */}
                    {data.discounts > 0 && (
                        <>
                            <SectionRow title="B. SATIŞ İNDİRİMLERİ (-)" amount={-data.discounts} isSubTotal color="text-rose-400" />
                            <DetailRows section="discounts" />
                        </>
                    )}

                    {/* NET SATIŞLAR */}
                    <SectionRow title="C. NET SATIŞLAR" amount={data.netSales} isTotal color="text-emerald-300" />

                    {/* D. SATIŞLARIN MALİYETİ (-) */}
                    <div className="mt-4">
                        <SectionRow title="D. SATIŞLARIN MALİYETİ (-)" amount={-data.costOfSales} isSubTotal color="text-rose-400" />
                        <DetailRows section="costOfSales" />
                    </div>

                    {/* BRÜT SATIŞ KARI */}
                    <div className="bg-white/5 p-4 rounded-xl mt-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-black text-gray-200">BRÜT SATIŞ KARI / ZARARI</span>
                            <span className={`text-2xl font-black font-mono ${data.grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                {formatMoney(data.grossProfit)}
                            </span>
                        </div>
                    </div>

                    {/* E. FAALİYET GİDERLERİ (-) */}
                    <SectionRow title="E. FAALİYET GİDERLERİ (-)" amount={-data.operatingExp} isSubTotal color="text-orange-400" />
                    <DetailRows section="operatingExp" />

                    {/* FAALİYET KARI */}
                    <SectionRow title="FAALİYET KARI / ZARARI" amount={data.operatingProfit} isTotal color={data.operatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'} />

                    {/* F. DİĞER FAAL. OLAĞAN GELİR VE KARLAR */}
                    {data.otherIncome > 0 && (
                        <div className="mt-4">
                            <SectionRow title="F. DİĞER OLAĞAN GELİR VE KARLAR" amount={data.otherIncome} isSubTotal color="text-emerald-400" />
                            <DetailRows section="otherIncome" />
                        </div>
                    )}

                    {/* G. DİĞER FAAL. OLAĞAN GİDER VE ZARARLAR (-) */}
                    {data.otherExpense > 0 && (
                        <div className="mt-2">
                            <SectionRow title="G. DİĞER OLAĞAN GİDER VE ZARARLAR (-)" amount={-data.otherExpense} isSubTotal color="text-rose-400" />
                            <DetailRows section="otherExpense" />
                        </div>
                    )}

                    {/* H. FİNANSMAN GİDERLERİ (-) */}
                    {data.financeExp > 0 && (
                        <div className="mt-2">
                            <SectionRow title="H. FİNANSMAN GİDERLERİ (-)" amount={-data.financeExp} isSubTotal color="text-rose-400" />
                            <DetailRows section="financeExp" />
                        </div>
                    )}

                    {/* DÖNEM NET KARI */}
                    <div className={`mt-8 p-6 rounded-2xl border ${data.netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className={`text-3xl font-black ${data.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                    {data.netProfit >= 0 ? 'DÖNEM NET KARI' : 'DÖNEM NET ZARARI'}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">Vergi öncesi net finansal sonuç</p>
                            </div>
                            <div className={`text-4xl font-black font-mono tracking-tight ${data.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                {formatMoney(data.netProfit)}
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="text-center p-20 text-red-400">Veri alınamadı.</div>
            )}
        </div>
    );
}
