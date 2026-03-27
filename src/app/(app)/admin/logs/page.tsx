"use client";

import { useState } from 'react';
import { Terminal, DownloadCloud, Trash2, Activity, Zap, Server, ShieldAlert } from 'lucide-react';

export default function AdminLogs() {
    const logs = [
        { id: 1, type: 'INFO', message: 'Sistem yedeği başarıyla alındı. Hedef: S3-EUCentral', time: '14:20:05.122', user: 'System (Auto)' },
        { id: 2, type: 'WARN', message: 'Iyzico API bağlantısında yavaşlama tespit edildi (>1200ms). Timeout engellendi.', time: '13:55:12.894', user: 'Network Daemon' },
        { id: 3, type: 'ERROR', message: 'Yeni tenant oluşturulurken veritabanı constraint hatası: Duplicate key (tax_id).', time: '12:30:45.001', user: 'Admin' },
        { id: 4, type: 'INFO', message: 'Nilvera Fatura entegrasyon API webhook dinleyicisi güncellendi.', time: '11:15:30.455', user: 'DevOps' },
        { id: 5, type: 'INFO', message: 'Toptan kanalındaki (B2B) katalog senkronizasyonu tamamlandı.', time: '09:45:00.000', user: 'Sync Engine' },
        { id: 6, type: 'WARN', message: 'Yüksek CPU kullanımı: worker_queue_1. Ölçekleme önerisi hazırlandı.', time: '09:42:12.110', user: 'K8s Monitor' },
        { id: 7, type: 'ERROR', message: 'Redis cache hit ratio düştü (<50%). Cache tahliye oranı çok yüksek.', time: '08:15:22.333', user: 'Cache Layer' },
        { id: 8, type: 'INFO', message: 'Platform Doctor v2 günlük sağlık taraması: 0 kritik, 2 uyarı.', time: '07:00:00.000', user: 'Diagnostics' }
    ];

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen w-full font-sans pb-16">
            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <Terminal className="w-7 h-7 text-indigo-600 dark:text-indigo-500" />
                            Sistem Logları & Olay Kayıtları
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Platform alt yapısındaki tüm hareketleri, daemon yanıtlarını ve hata çıktılarını anlık olarak izleyin.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2.5 bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-slate-500/20">
                            <Trash2 className="w-4 h-4 text-rose-500" /> Konsolu Temizle
                        </button>
                        <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-indigo-500/50">
                            <DownloadCloud className="w-4 h-4" /> Dışa Aktar (.csv)
                        </button>
                    </div>
                </div>

                {/* Top Metrics Map */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Hata Oranı (Son 1H)</div>
                            <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">%0.02</div>
                            <div className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 mt-1 uppercase tracking-wider">İdeal Seviyede</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">P99 API Yanıt Süresi</div>
                            <Activity className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">42<span className="text-lg text-slate-400 ml-1">ms</span></div>
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Global Ortalama: 65ms</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aktif Thread (Worker)</div>
                            <Server className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">1,204</div>
                            <div className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 mt-1 uppercase tracking-wider">+42 yeni instance</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sistem Yükü (Load Avg)</div>
                            <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">0.8<span className="text-lg text-slate-400 ml-1">/ 4C</span></div>
                            <div className="text-[10px] font-bold text-amber-500 dark:text-amber-400 mt-1 uppercase tracking-wider">Kapasite: %20 Kullanımda</div>
                        </div>
                    </div>
                </div>

                {/* Terminal Window */}
                <div className="bg-[#0a0f1a] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden font-mono text-xs sm:text-sm flex flex-col relative w-full h-[650px]">
                    <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                    
                    {/* Window Controls (Mac Style) */}
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 cursor-pointer shadow-sm"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 cursor-pointer shadow-sm"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 cursor-pointer shadow-sm"></div>
                        </div>
                        <div className="text-slate-500 text-[11px] font-bold tracking-widest flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded">
                            <Terminal className="w-3 h-3" /> system_logs_stream.log
                        </div>
                        <div className="w-12"></div> {/* Spacer for centering */}
                    </div>

                    {/* Log Content */}
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-transparent to-transparent">
                        <div className="space-y-4">
                            {logs?.map((log) => (
                                <div key={log.id} className="flex flex-col sm:flex-row gap-2 sm:gap-4 group hover:bg-white/5 -mx-2 px-2 py-1.5 rounded transition-colors break-all sm:break-normal">
                                    <span className="text-slate-500 dark:text-slate-600 shrink-0 select-none">[{log.time}]</span>
                                    <span className={`font-black tracking-widest shrink-0 w-[55px] select-none
                                        ${log.type === 'ERROR' ? 'text-rose-500 dark:text-rose-400' :
                                        log.type === 'WARN' ? 'text-amber-500 dark:text-amber-400' : 
                                        'text-emerald-500 dark:text-emerald-400'}`}
                                    >
                                        {log.type}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-500 shrink-0 w-[120px] select-none truncate" title={log.user}>
                                        {"<" + log.user + ">"}
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-300">
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                            <div className="flex items-center gap-4 mt-8 px-2">
                                <span className="text-indigo-500 dark:text-indigo-400 font-bold">periodya@prod:~$</span>
                                <span className="text-slate-400 animate-pulse font-bold tracking-widest pl-2 border-l-2 border-indigo-500">
                                    tail -f /var/log/syslog | grep periodya_saas_metrics...
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
