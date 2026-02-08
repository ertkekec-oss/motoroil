"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancials } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/utils";

export default function AccountingPage() {
    const { user } = useAuth();
    const {
        stats,
        transactions,
        refreshData,
        isLoading
    } = useFinancials();

    const [activeTab, setActiveTab] = useState("receivables");

    // Vercel'deki tasarıma uygun renkler ve ikonlar
    const cards = [
        {
            title: "TOPLAM ALACAKLAR",
            value: stats?.totalReceivables || 0,
            desc: "Seçili dönemdeki taksit ve çekler",
            icon: "🗓️",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            title: "TOPLAM ÖDEMELER",
            value: stats?.totalPayables || 0,
            desc: "Seçili dönemdeki borç ve çekler",
            icon: "💸",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            title: "TOPLAM GİDERLER",
            value: stats?.totalExpenses || 0,
            desc: "Kasa ve bankadan çıkan giderler",
            icon: "📉",
            color: "text-rose-400",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20"
        },
        {
            title: "NET KASA DURUMU",
            value: stats?.netCash || 0,
            desc: "Anlık kasa ve banka toplamları",
            icon: "💰",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
        }
    ];

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Muhasebe & Finans</h1>
                    <p className="text-white/60">Nakit akışı, alacak/borç ve kasa yönetimi</p>
                </div>
                <button
                    onClick={() => refreshData()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all active:scale-95"
                >
                    {isLoading ? "🔄 Yenileniyor..." : "🔄 Verileri Yenile"}
                </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className={`p-6 rounded-2xl border ${card.border} ${card.bg} backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold tracking-wider text-white/40">{card.title}</span>
                            <span className="text-2xl opacity-80 group-hover:scale-110 transition-transform">{card.icon}</span>
                        </div>
                        <div className={`text-3xl font-black mb-2 ${card.color}`}>
                            {formatCurrency(card.value)}
                        </div>
                        <p className="text-xs text-white/40">{card.desc}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                {['TÜMÜ', 'BUGÜN', 'BU HAFTA', 'BU AY', 'ÖZEL TARİH'].map((filter) => (
                    <button
                        key={filter}
                        className="px-4 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Main Content Tabs */}
            <div className="flex flex-wrap gap-4 border-b border-white/10 pb-1">
                {[
                    { id: 'receivables', label: 'Alacaklar', color: 'bg-orange-600' },
                    { id: 'payables', label: 'Borçlar', color: 'bg-white/10' },
                    { id: 'checks', label: 'Çek & Senet', color: 'bg-white/10' },
                    { id: 'banks', label: 'Banka & Kasa', color: 'bg-white/10' },
                    { id: 'expenses', label: 'Giderler', color: 'bg-white/10' },
                    { id: 'transactions', label: 'Finansal Hareketler', color: 'bg-white/10' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20 scale-105'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 min-h-[400px]">
                {activeTab === 'receivables' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Tahsil Edilecekler</h3>
                            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-orange-900/20">
                                + Tahsilat Ekle
                            </button>
                        </div>

                        {/* Empty State / Placeholder */}
                        <div className="flex flex-col items-center justify-center py-20 text-white/20">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-2xl">
                                📋
                            </div>
                            <p>Planlı alacak bulunmuyor.</p>
                        </div>

                        {/* List Header */}
                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-white/30 uppercase tracking-wider px-4 border-b border-white/5 pb-2">
                            <div className="col-span-4">Cari Bilgisi</div>
                            <div className="col-span-2 text-center">Vade</div>
                            <div className="col-span-3 text-right">Kalan Tutar</div>
                            <div className="col-span-3 text-center">Durum</div>
                        </div>
                    </div>
                )}

                {activeTab !== 'receivables' && (
                    <div className="flex flex-col items-center justify-center h-64 text-white/30">
                        <p>Bu modül geliştirme aşamasındadır.</p>
                    </div>
                )}
            </div>

            {/* Bottom Planner Section */}
            <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🗓️</span>
                        <h3 className="font-bold text-white">Planlı Alacaklar & Vadeli Satışlar</h3>
                    </div>
                    <button className="px-3 py-1 bg-white/5 rounded-lg text-xs text-white/60 hover:bg-white/10">
                        + Planla
                    </button>
                </div>
                <div className="text-center py-8 text-white/20 text-sm">
                    Planlı alacak bulunmuyor.
                </div>
            </div>
        </div>
    );
}
