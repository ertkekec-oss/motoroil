"use client";

import { useState, useEffect } from 'react';
import {
    IconTrendingUp,
    IconAlert,
    IconPackage,
    IconZap,
    IconActivity
} from '@/components/icons/PremiumIcons';

// Simple Arrow/Utility components
const Filter = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const ChevronRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const Layers = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const AlertCircle = ({ className }: any) => <IconAlert className={className} />;
const TrendingDown = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;

export default function ProfitabilityHeatmap() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                const res = await fetch('/api/fintech/dashboard/heatmap');
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHeatmap();
    }, []);

    const filteredData = data.filter(item =>
        item.productName.toLowerCase().includes(filter.toLowerCase()) ||
        item.productCode.toLowerCase().includes(filter.toLowerCase())
    );

    const getMarginColor = (margin: number) => {
        if (margin >= 20) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (margin >= 5) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        if (margin > 0) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    };

    const getStatusText = (margin: number) => {
        if (margin >= 20) return 'ALTIN ÜRÜN';
        if (margin >= 5) return 'MAKUL';
        if (margin > 0) return 'KRİTİK';
        return 'ZARAR EDİYOR';
    };

    if (loading) return (
        <div className="p-12 space-y-8 animate-pulse">
            <div className="h-12 bg-white/5 rounded-2xl w-1/3" />
            <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-2xl" />
                ))}
            </div>
        </div>
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                        MARKETPLACE PROFITABILITY HEATMAP
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wider flex items-center gap-2">
                        <IconTrendingUp className="w-4 h-4 text-emerald-500" /> Real-time FIFO Cost & Net Margin Analysis
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="SKU veya Ürün adı ile ara..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-emerald-500/50 transition-all w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredData.map((item) => (
                    <div key={item.id} className="card glass p-4 group hover:scale-[1.005] transition-all duration-300 relative border-l-4 border-l-transparent hover:border-l-emerald-500">
                        <div className="grid grid-cols-12 gap-6 items-center">

                            {/* Product Info */}
                            <div className="col-span-3 space-y-1">
                                <div className="flex items-center gap-2">
                                    <IconPackage className="w-4 h-4 text-gray-500" />
                                    <span className="text-[10px] font-bold text-gray-500 tracking-widest">{item.marketplace.toUpperCase()}</span>
                                </div>
                                <h3 className="text-sm font-black text-white truncate">{item.productName}</h3>
                                <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{item.productCode} • {item.category || 'GENEL'}</p>
                            </div>

                            {/* Revenue & Margin Heat Area */}
                            <div className="col-span-4 grid grid-cols-3 gap-4 border-x border-white/5 px-6">
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Gross Revenue</p>
                                    <p className="text-sm font-black text-white">{item.grossRevenue.toLocaleString('tr-TR')} ₺</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Net Profit</p>
                                    <p className={`text-sm font-black ${item.netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {item.netProfit.toLocaleString('tr-TR')} ₺
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Net Margin</p>
                                    <div className={`text-xs font-black px-2 py-1 rounded-lg border ${getMarginColor(item.margin)}`}>
                                        {item.margin.toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="col-span-3 flex items-center justify-around gap-2 text-center border-r border-white/5 pr-6">
                                <div>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                                        <Layers className="w-3 h-3" /> FIFO Cost
                                    </p>
                                    <p className="text-xs font-bold text-gray-300">{item.fifoCost.toLocaleString('tr-TR')} ₺</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Fees</p>
                                    <p className="text-xs font-bold text-gray-400">{(item.commission + item.shipping + item.otherFees).toLocaleString('tr-TR')} ₺</p>
                                </div>
                            </div>

                            {/* Status & Action */}
                            <div className="col-span-2 flex items-center justify-between pl-4">
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Health Signal</p>
                                    <p className={`text-[10px] font-black tracking-tight ${getMarginColor(item.margin).split(' ')[0]}`}>
                                        {getStatusText(item.margin)}
                                    </p>
                                </div>
                                <button className="p-2 bg-white/5 hover:bg-emerald-500/20 rounded-xl transition-all text-gray-500 hover:text-emerald-400">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                        </div>
                    </div>
                ))}

                {filteredData.length === 0 && (
                    <div className="p-12 card glass text-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto" />
                        <h3 className="text-xl font-bold text-gray-400">P&L Verisi Bulunamadı</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto">
                            Henüz bu kriterlere uygun satış veya hakediş kaydı işlenmemiş.
                            Satışlar yapıldıkça heatmap incremental olarak dolacaktır.
                        </p>
                    </div>
                )}
            </div>

            {/* Legend / Tooltip */}
            <div className="flex items-center gap-6 pt-8 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Golden ({'>'}20%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Healthy ({'>'}5%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Critical ({'>'}0%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Loss View</span>
                </div>
            </div>
        </div>
    );
}
