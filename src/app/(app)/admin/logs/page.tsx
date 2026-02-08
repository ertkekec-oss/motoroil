
"use client";

import { useState } from 'react';

export default function AdminLogs() {
    const logs = [
        { id: 1, type: 'INFO', message: 'Sistem yedeği başarıyla alındı.', time: '14:20:05', user: 'Sistem' },
        { id: 2, type: 'WARN', message: 'Iyzico API bağlantısında yavaşlama tespit edildi.', time: '13:55:12', user: 'Network' },
        { id: 3, type: 'ERROR', message: 'Yeni tenant oluşturulurken veritabanı hatası: Duplicate key.', time: '12:30:45', user: 'Admin' },
        { id: 4, type: 'INFO', message: 'Nilvera entegrasyonu güncellendi.', time: '11:15:30', user: 'DevOps' },
        { id: 5, type: 'INFO', message: 'Yeni şube senkronizasyonu tamamlandı.', time: '09:45:00', user: 'Sistem' }
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sistem Logları & Olay Kayıtları</h1>
                    <p className="text-slate-500 text-sm">Alt yapıdaki tüm hareketleri ve hataları anlık olarak izleyin.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                        Logları Temizle
                    </button>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
                        Dışa Aktar (.csv)
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl font-mono text-sm">
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="ml-4 text-slate-400 text-xs">system_logs_20260205.log — Terminal View</span>
                </div>
                <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
                    {logs.map((log) => (
                        <div key={log.id} className="flex gap-4 group">
                            <span className="text-slate-600 shrink-0">[{log.time}]</span>
                            <span className={`font-bold shrink-0 ${log.type === 'ERROR' ? 'text-rose-500' :
                                    log.type === 'WARN' ? 'text-amber-500' : 'text-emerald-500'
                                }`}>{log.type}</span>
                            <span className="text-slate-300 group-hover:text-white transition-colors">
                                <span className="text-blue-400">({log.user})</span> {log.message}
                            </span>
                        </div>
                    ))}
                    <div className="pt-4 text-slate-500 animate-pulse">
                        $ tail -f /var/log/syslog | grep periodya_saas ...
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Hata Oranı</p>
                    <p className="text-xl font-bold text-slate-900">%0.02</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">API Yanıt Süresi</p>
                    <p className="text-xl font-bold text-slate-900">42ms</p>
                </div>
            </div>
        </div>
    );
}
