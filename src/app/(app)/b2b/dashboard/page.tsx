import React from 'react';
import { ShoppingCart, Package, CreditCard, ChevronRight, Activity, TrendingUp, AlertCircle, FileText, Bell, MapPin } from 'lucide-react';
import Link from 'next/link';

export default async function B2bBuyerDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans pb-16 w-full">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-indigo-500" />
              Satınalma & B2B Bayi Portalı
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Alıcı cari özetiniz, aktif teslimatlarınız ve toptan sipariş işlemleriniz.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/b2b/catalog"
              className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              Kataloğa Git
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-indigo-500/30 transition-colors"></div>
                <div className="flex items-center justify-between mb-4 relative">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Kredi Limiti</h3>
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <CreditCard className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white mb-1 relative">
                    125.000,00 ₺
                </p>
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                        %60 Kullanılabilir
                    </span>
                    <span className="text-slate-500 dark:text-slate-500">
                        Açık Hesap (B2B)
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-emerald-500/30 transition-colors"></div>
                <div className="flex items-center justify-between mb-4 relative">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Açık Siparişler</h3>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <Package className="w-4 h-4" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1 relative">
                    <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                        4
                    </p>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Adet</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                        2'si kargoda
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4 relative">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ödenmemiş Vade</h3>
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white mb-1 relative">
                    8.450,00 ₺
                </p>
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span className="text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded outline outline-1 outline-rose-200 dark:outline-rose-900/50">
                        1 faturanın vadesi geçti
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-amber-500/30 transition-colors"></div>
                <div className="flex items-center justify-between mb-4 relative">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Kazanılan B2B Puan</h3>
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white mb-1 relative">
                    1.450
                </p>
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                        Bu çeyrek +450 eklendi
                    </span>
                </div>
            </div>
        </div>

        {/* Main Grid area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Açık Siparişler */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            Aktif Sipariş / Sevkiyatlar
                        </h2>
                        <Link href="/b2b/orders" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            Tümünü Gör
                        </Link>
                    </div>
                </div>
                <div className="p-0 flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/50 dark:bg-[#0f172a]/50 text-xs text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-3">Sipariş No</th>
                                <th className="px-6 py-3">Tarih</th>
                                <th className="px-6 py-3 text-right">Tutar</th>
                                <th className="px-6 py-3 text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {/* Mock Data */}
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    ORD-2026-9921
                                </td>
                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                    Bugün, 11:30
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    12.450,00 ₺
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                        <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-500/30 rounded shadow-sm flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3" /> YOLDA
                                        </span>
                                    </div>
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    ORD-2026-9918
                                </td>
                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                    Dün, 16:45
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    4.200,00 ₺
                                </td>
                                <td className="px-6 py-4 flex justify-center">
                                    <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-500/30 rounded shadow-sm">
                                        HAZIRLANIYOR
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fatura & Cari */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        Finans & Faturalar
                    </h2>
                </div>
                <div className="p-6 flex-1 flex flex-col gap-4">
                    <div className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">FYS-20260012</p>
                                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">Son Ödeme: 2 gün geçti</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">8.450,00 ₺</p>
                            <ChevronRight className="w-4 h-4 text-slate-400 inline-block group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                        </div>
                    </div>

                    <div className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer opacity-70">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">FYS-20260009</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Ödendi (Geçen Hafta)</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">12.000,00 ₺</p>
                        </div>
                    </div>

                    <div className="mt-auto pt-4">
                        <button className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm rounded-xl shadow-sm hover:opacity-90 transition-opacity">
                            Tüm Faturaları Gör
                        </button>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
