"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, MapPin, Wrench, Clock, Search, ChevronRight } from 'lucide-react';

export default function ServiceTasksClient() {
    const router = useRouter();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/services/mobile/tasks');
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex-1 flex flex-col font-sans">
            
            {/* Header Performance Widget */}
            <div className="bg-[#161b22] border-b border-white/5 pt-4 pb-6 px-4 shrink-0 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-white text-lg font-black tracking-tight">Bugünkü Görevlerim</h2>
                        <div className="text-slate-400 text-[11px] font-bold uppercase mt-0.5 tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" /> {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                        </div>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="bg-[#0f111a] rounded-[16px] border border-white/10 p-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-end mb-3 relative z-10">
                        <div>
                            <div className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-1">
                                <Target className="w-3 h-3" /> Aylık Hedes (Q1)
                            </div>
                            <div className="text-white text-2xl font-black mt-1 tracking-tighter">
                                145,000 <span className="text-slate-500 text-sm">₺</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-emerald-400 text-xs font-bold leading-none">%72</div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">Tamamlanan</div>
                        </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative z-10">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="px-4 py-4 flex items-center justify-between">
                <div className="text-[12px] font-black text-white uppercase tracking-widest">Sahadaki Görevleriniz</div>
                <div className="w-7 h-7 rounded-full bg-[#161b22] border border-white/5 flex items-center justify-center text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                </div>
            </div>

            {/* Task List */}
            <div className="px-4 pb-6 space-y-3">
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-28 bg-[#161b22] rounded-[16px] border border-white/5"></div>
                        ))}
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="bg-[#161b22]/50 border border-white/5 rounded-[16px] p-8 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-3">
                            <Wrench className="w-5 h-5" />
                        </div>
                        <div className="text-slate-300 font-bold text-sm">Harika, tüm işler bitti!</div>
                        <div className="text-slate-500 text-xs mt-1">Bugün için atanan başka göreviniz bulunmuyor.</div>
                    </div>
                ) : (
                    tasks.map((task, idx) => (
                        <div 
                            key={task.id} 
                            onClick={() => router.push(`/service/${task.id}`)}
                            className="bg-[#161b22] hover:bg-[#1c222b] transition-colors border border-white/5 rounded-[16px] p-4 cursor-pointer relative overflow-hidden group shadow-lg"
                        >
                            {/* Accent Line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                            
                            <div className="flex justify-between items-start mb-3 ml-2">
                                <div>
                                    <div className="text-white font-bold text-sm leading-tight flex items-center gap-2">
                                        {task.customer?.name}
                                    </div>
                                    <div className="text-slate-400 text-xs font-medium mt-0.5">
                                        {task.asset?.brand || 'Bilinmeyen Cihaz'} • {task.asset?.primaryIdentifier}
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                    task.status === 'IN_PROGRESS' 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                    {task.status === 'IN_PROGRESS' ? 'İşlemde' : 'Bekliyor'}
                                </div>
                            </div>

                            <div className="ml-2 flex items-center gap-2 text-slate-500 text-xs font-medium bg-[#0f111a] rounded-lg p-2 border border-white/5">
                                <MapPin className="w-3.5 h-3.5" />
                                {task.customer?.district || 'Merkez'}, {task.customer?.city || 'İstanbul'}
                            </div>

                            <div className="mt-3 ml-2 flex items-center justify-between">
                                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest hidden xs:block">
                                    Sıra: #{idx + 1}
                                </div>
                                <div className="text-blue-400 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Detayı Aç <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
