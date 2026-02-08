
"use client";

import { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Legend, Line
} from 'recharts';

export default function CashflowForecastChart() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/financials/forecast');
                const json = await res.json();
                if (json.forecast) {
                    setData(json);
                }
            } catch (error) {
                console.error("Forecast fetch error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="card glass p-8 animate-pulse flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-gray-400">Yapay Zeka Nakit Akışını Hesaplıyor...</div>
            </div>
        );
    }

    if (!data) return null;

    const { forecast, analysis, currentBalance, dailyBurnRate } = data;

    // Format data numbers
    const formattedData = forecast.map((d: any) => ({
        ...d,
        dateFormatted: new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        Balance: Number(Number(d.balance).toFixed(0)),
        Income: Number(Number(d.dayIncome).toFixed(0)),
        Expense: Number(Number(d.dayExpense).toFixed(0)),
        Burn: Number(Number(d.operationalExpense).toFixed(0))
    }));

    return (
        <div className="card glass p-6 relative overflow-hidden group">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 z-10 relative">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl animate-pulse">🔮</span>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            AI Nakit Akışı Tahmini (60 Gün)
                        </h2>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                        Sözleşmeli tahsilatlar, vadesi gelen faturalar ve geçmiş harcama alışkanlıklarına göre tahmindir.
                    </p>
                </div>

                <div className="flex gap-4 mt-4 md:mt-0 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                    <div className="text-right px-2">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Anlık Nakit</div>
                        <div className="font-mono text-lg font-bold text-white">
                            {Number(currentBalance).toLocaleString('tr-TR')} ₺
                        </div>
                    </div>
                    <div className="w-px bg-white/10"></div>
                    <div className="text-right px-2">
                        <div className="text-[10px] text-gray-500 uppercase font-bold text-pink-300/70">Tahmini Günlük Gider</div>
                        <div className="font-mono text-lg font-bold text-pink-400">
                            -{Number(dailyBurnRate).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Banner */}
            {analysis.riskDays.length > 0 ? (
                <div className="mb-6 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 flex items-center gap-3 animate-pulse">
                    <span className="text-xl">⚠️</span>
                    <span className="text-sm font-bold">DİKKAT: {analysis.message}</span>
                </div>
            ) : (
                <div className="mb-6 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    <span className="text-sm font-bold">Nakit akışı pozitif görünüyor.</span>
                </div>
            )}

            {/* Chart */}
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />

                        <XAxis
                            dataKey="dateFormatted"
                            stroke="#6b7280"
                            fontSize={10}
                            tickMargin={10}
                            interval={6}
                        />

                        <YAxis
                            stroke="#6b7280"
                            fontSize={10}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                            formatter={(value: any, name: string) => [Number(value).toLocaleString('tr-TR') + ' ₺', name === 'Balance' ? 'Tahmini Bakiye' : name]}
                            labelStyle={{ color: '#9ca3af', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}
                        />

                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />

                        {/* Balance Area */}
                        <Area
                            type="monotone"
                            dataKey="Balance"
                            name="Balance"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fill="url(#colorBalance)"
                            animationDuration={1500}
                        />

                        {/* We could add hidden lines/areas for Income/Expense just to show them in tooltip? */}
                        <Area type="monotone" dataKey="Income" name="Giriş" stroke="none" fill="none" />
                        <Area type="monotone" dataKey="Expense" name="Çıkış" stroke="none" fill="none" />

                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-2xl" />
        </div>
    );
}
