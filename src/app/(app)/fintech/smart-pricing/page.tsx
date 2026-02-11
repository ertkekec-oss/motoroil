"use client";

import { useState, useEffect } from 'react';
import {
    IconZap,
    IconRefresh,
    IconTrendingUp,
    IconAlert,
    IconShield,
    IconActivity,
    IconPackage,
    IconCheck
} from '@/components/icons/PremiumIcons';

// UI Helpers
const ChevronRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const ArrowUpRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19L19 5M19 5H10M19 5V14" /></svg>;
const ArrowDownRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19l-7-7 7-7" /></svg>;

export default function SmartPricingDashboard() {
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isAutoPilot, setIsAutoPilot] = useState(false);

    useEffect(() => {
        // Simulation Data
        const mockData = [
            {
                productId: '1', productName: 'Castrol Edge 5W-30 4L', marketplace: 'Trendyol',
                currentPrice: 1250.00, recommendedPrice: 1340.50, change: 7.2,
                targetMargin: 15, currentMargin: 8.4, reason: 'Commission Spike', status: 'CRITICAL'
            },
            {
                productId: '2', productName: 'Mobil 1 ESP 5W-30 5L', marketplace: 'Hepsiburada',
                currentPrice: 1850.00, recommendedPrice: 1920.00, change: 3.8,
                targetMargin: 12, currentMargin: 10.1, reason: 'FIFO Cost Increase', status: 'WARNING'
            },
            {
                productId: '3', productName: 'Shell Helix Ultra 0W-40', marketplace: 'Trendyol',
                currentPrice: 1450.00, recommendedPrice: 1410.00, change: -2.7,
                targetMargin: 18, currentMargin: 21.5, reason: 'Market Optimization', status: 'STABLE'
            }
        ];
        setTimeout(() => {
            setRecommendations(mockData);
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) return <div className="p-12 animate-pulse h-screen bg-black/20" />;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-600">
                        SMART PRICING ENGINE
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wider flex items-center gap-2">
                        <IconZap className="w-4 h-4 text-orange-500" /> Autonomous Margin Protection & Price Optimization
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                    <div className="flex flex-col items-end px-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Engine Status</span>
                        <span className={`text-[11px] font-black ${isAutoPilot ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {isAutoPilot ? 'AUTOPILOT: ON' : 'MANUAL REVIEW'}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsAutoPilot(!isAutoPilot)}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${isAutoPilot ? 'bg-emerald-500' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${isAutoPilot ? 'left-8' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            {/* Strategy Insight */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card glass p-6 border-orange-500/20">
                    <IconActivity className="w-6 h-6 text-orange-500 mb-4" />
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Rules</h4>
                    <p className="text-2xl font-black text-white">42</p>
                    <p className="text-[10px] text-gray-500 mt-2">Across 3 Marketplaces</p>
                </div>
                <div className="card glass p-6 border-emerald-500/20">
                    <IconShield className="w-6 h-6 text-emerald-500 mb-4" />
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Margin Protected</h4>
                    <p className="text-2xl font-black text-white">12,450 ₺</p>
                    <p className="text-[10px] text-emerald-500 mt-2">+4.2% since yesterday</p>
                </div>
                <div className="card glass p-6 border-rose-500/20">
                    <IconAlert className="w-6 h-6 text-rose-500 mb-4" />
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loss Prevention</h4>
                    <p className="text-2xl font-black text-rose-400">8 Critical</p>
                    <p className="text-[10px] text-gray-500 mt-2">Prices below cost!</p>
                </div>
                <div className="card glass p-6 bg-gradient-to-br from-orange-900/10 to-transparent">
                    <IconRefresh className="w-6 h-6 text-orange-400 mb-4 animate-spin-slow" />
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Re-calc</h4>
                    <p className="text-2xl font-black text-white">14:02</p>
                    <p className="text-[10px] text-gray-500 mt-2">Every 15 minutes</p>
                </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                    <IconTrendingUp className="w-4 h-4 text-emerald-500" /> Pending Price Actions
                </h3>

                <div className="grid grid-cols-1 gap-4">
                    {recommendations.map(rec => (
                        <div key={rec.productId} className="card glass p-6 hover:border-orange-500/30 transition-all group overflow-hidden relative">
                            {/* Heat Overlay based on change % */}
                            <div className={`absolute top-0 right-0 w-32 h-full opacity-5 bg-gradient-to-l ${rec.change > 5 ? 'from-rose-500' : 'from-orange-500'}`} />

                            <div className="grid grid-cols-12 gap-8 items-center relative">
                                <div className="col-span-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <IconPackage className="w-3 h-3 text-gray-500" />
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase">{rec.marketplace}</span>
                                    </div>
                                    <h4 className="text-sm font-black text-white truncate">{rec.productName}</h4>
                                    <p className={`text-[10px] font-bold mt-1 ${rec.status === 'CRITICAL' ? 'text-rose-400' : 'text-orange-400'}`}>
                                        Reason: {rec.reason}
                                    </p>
                                </div>

                                <div className="col-span-3 flex items-center justify-between border-x border-white/5 px-8">
                                    <div className="text-center">
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Current</p>
                                        <p className="text-xs font-bold text-gray-400">{rec.currentPrice.toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                    <ArrowUpRight className={`w-4 h-4 ${rec.change > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                                    <div className="text-center">
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">New Sync</p>
                                        <p className="text-sm font-black text-white">{rec.recommendedPrice.toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                </div>

                                <div className="col-span-4 grid grid-cols-2 gap-4 text-center border-r border-white/5 pr-8">
                                    <div>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Net Margin At Current</p>
                                        <p className="text-xs font-black text-rose-400">{rec.currentMargin}%</p>
                                    </div>
                                    <div className="bg-emerald-500/5 rounded-xl p-2 border border-emerald-500/10">
                                        <p className="text-[9px] text-emerald-500/70 font-bold uppercase mb-1">Target Margin</p>
                                        <p className="text-sm font-black text-emerald-400">{rec.targetMargin}%</p>
                                    </div>
                                </div>

                                <div className="col-span-2 flex justify-end gap-3">
                                    <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-[10px] font-black text-white transition-all uppercase tracking-widest">
                                        Apply
                                    </button>
                                    <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Auto-Pilot Signal */}
            {isAutoPilot && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                        Engine is running otonom. Critical margin adjustments will be synced in 4:22 mins.
                    </p>
                </div>
            )}
        </div>
    );
}

function ArrowRight({ className }: any) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" /></svg>;
}
