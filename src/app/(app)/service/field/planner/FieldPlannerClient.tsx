"use client";

import React, { useState } from 'react';
import { Calendar, Filter, Users, Map, Clock, ArrowRight, Settings2, Plus, PenTool, LayoutDashboard } from 'lucide-react';

export default function FieldPlannerClient() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    return (
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans dark:bg-[#0f172a]">
            {/* HER YERDE GEÇERLİ EN ÜST STRATEJİ / BAŞLIK BANDI */}
            <div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8">
                <div className="flex-shrink-0 bg-transparent z-10 sticky top-0 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-600 dark:bg-orange-500/20 text-white dark:text-orange-400 font-bold border border-orange-500/10 shadow-sm shrink-0">
                            <Map className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none truncate">
                                    Saha Planlama Panosu
                                </h1>
                            </div>
                            <span className="text-[11px] sm:text-[12px] font-bold tracking-widest uppercase text-slate-500 mt-1.5 truncate block">
                                Teknisyen Görev Çizelgeleme ve Rota Optimizasyonu
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto bg-white sm:bg-transparent dark:bg-[#1e293b] sm:dark:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-transparent border-slate-200 dark:border-white/5">
                        <div className="flex flex-col items-start sm:items-end mr-2 sm:mr-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Aktif Tarih</span>
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="text-[14px] font-black text-slate-800 dark:text-slate-200 bg-transparent outline-none focus:ring-0 leading-none cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="h-[36px] sm:h-[40px] px-4 sm:px-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-orange-600 dark:text-orange-400 hover:bg-slate-50 rounded-[10px] font-bold text-[11px] sm:text-[12px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm">
                                <LayoutDashboard className="w-4 h-4" /> Şablonlar
                            </button>
                            <button className="h-[36px] sm:h-[40px] px-4 sm:px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-[10px] font-bold text-[11px] sm:text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm">
                                <Plus className="w-4 h-4" /> Optimze Et
                            </button>
                        </div>
                    </div>
                </div>

                {/* BOARD ALANI */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
                    
                    {/* SOL KOLON: BEKLEYEN İŞ EMİRLERİ */}
                    <div className="lg:col-span-1 h-[calc(100vh-180px)] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">Planda Olmayanlar</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300">12</span>
                            </div>
                            <button className="text-slate-400 hover:text-orange-500 transition-colors"><Filter className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
                            {/* Örnek İş Emri Kartı */}
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-sm cursor-grab hover:border-orange-500/50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">WO-{1000 + i}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 px-1.5 py-0.5 rounded-full">Yüksek Öncelik</span>
                                    </div>
                                    <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200 mb-1 leading-tight">Dahili Filtre Bakımı & Yağ Değişimi</h4>
                                    <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mb-2">
                                        <Map className="w-3 h-3" /> Kozyatağı / Kadıköy (4.2 km)
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                                        <div className="font-mono text-[10px] font-bold text-slate-500">Tahmini: 45 Dk</div>
                                        <button className="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-bold text-[10px] uppercase tracking-wider">Ata</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SAĞ KOLONLAR: TEKNİSYEN TAKVİMİ / GANTT */}
                    <div className="lg:col-span-3 h-[calc(100vh-180px)] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex gap-4">
                                <button className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-colors">Zaman Çizelgesi (Gantt)</button>
                                <button className="text-[11px] font-black uppercase tracking-widest text-orange-600 border-b-2 border-orange-500 pb-1">Teknisyen & Rota Haritası</button>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-1.5 text-[10px] font-bold bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400">
                                    <Users className="w-3 h-3" /> Ekipler
                                </button>
                                <button className="flex items-center gap-1.5 text-[10px] font-bold bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400">
                                    <Settings2 className="w-3 h-3" /> Kurallar
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scroll relative bg-[url('/bg-dots.svg')] dark:bg-[url('/bg-dots-dark.svg')] bg-[length:24px_24px]">
                            {/* BOŞ STATE / YAPILANDIRILIYOR GÖRÜNÜMÜ */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-50/80 dark:bg-[#0f172a]/80 backdrop-blur-[2px]">
                                <div className="w-20 h-20 mb-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-white/10 flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors"></div>
                                    <Map className="w-8 h-8 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-white mb-2">Drag & Drop Planlama Modülü</h3>
                                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 max-w-[400px]">
                                    Saha Planlama motoru şu anda entegre ediliyor. Teknisyenlerin günlük kapasitelerini ve akıllı rota optimizasyonlarını bu harita tabanlı panele sürükle bırak mantığıyla yerleştirebileceksiniz.
                                </p>
                                <button className="mt-8 h-[44px] px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[14px] font-bold text-[12px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg flex items-center gap-2">
                                    Planlamayı Başlat <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
