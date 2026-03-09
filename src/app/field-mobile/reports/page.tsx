
"use client";

import { useEffect, useState } from 'react';

export default function MobileReportsPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/staff/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
            const data = await res.json();

            if (res.ok) {
                setReport(data);
            } else {
                setReport({ error: data.error || 'Bilinmeyen bir hata oluştu.' });
            }
        } catch (err: any) {
            console.error(err);
            setReport({ error: err.message || 'Bağlantı hatası' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [dateRange]);

    return (
        <div className="flex flex-col min-h-full bg-[#0f111a] p-6">
            <h1 className="text-2xl font-black mb-6">Performans Raporu</h1>

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Başlangıç</label>
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="w-full bg-[#161b22] border border-white/5 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Bitiş</label>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="w-full bg-[#161b22] border border-white/5 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 opacity-50">Hesaplanıyor...</div>
            ) : report?.error ? (
                <div className="text-center py-12 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="text-red-400 font-bold mb-2">Hata Oluştu</div>
                    <div className="text-sm opacity-80 text-red-300">{report.error === 'Staff not found' ? 'Personel hesabınız bulunamadı.' : report.error}</div>
                </div>
            ) : report?.summary ? (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/20 p-6 rounded-[2rem]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-lg">💰</span>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Toplam Satış</span>
                            </div>
                            <div className="text-3xl font-black">₺{report.summary.totalSales.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500 font-bold mt-1">{report.summary.salesCount} Sipariş</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-600/20 to-transparent border border-green-500/20 p-6 rounded-[2rem]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-lg">💳</span>
                                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Toplam Tahsilat</span>
                            </div>
                            <div className="text-3xl font-black">₺{report.summary.totalCollections.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500 font-bold mt-1">{report.summary.collectionsCount} İşlem</div>
                        </div>

                        <div className="bg-[#161b22] border border-white/5 p-6 rounded-[2rem]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-lg">📍</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Müşteri Ziyareti</span>
                            </div>
                            <div className="text-3xl font-black">{report.summary.totalVisits}</div>
                            <div className="text-[10px] text-gray-500 font-bold mt-1">Tamamlanan Görüşme</div>
                        </div>
                    </div>

                    {/* Detailed List (Optional) */}
                    {/* ... could add lists of sales/visits here ... */}
                </div>
            ) : null}
        </div>
    );
}
