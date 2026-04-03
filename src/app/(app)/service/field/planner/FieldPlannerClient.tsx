"use client";

import React, { useState } from 'react';
import { Calendar, Filter, Users, Map, Clock, ArrowRight, Settings2, Plus, PenTool, LayoutDashboard, Activity, CalendarCheck, PlusSquare } from 'lucide-react';
import Link from 'next/link';

export default function FieldPlannerClient() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [unplanned, setUnplanned] = useState<any[]>([
        { id: 'wo-1', code: 'WO-1001', priority: 'Yüksek', title: 'Dahili Filtre Bakımı & Yağ Değişimi', duration: '45dk', loc: 'Kozyatağı' },
        { id: 'wo-2', code: 'WO-1002', priority: 'Normal', title: 'Akü Değişimi & Şarj Kontrolü', duration: '30dk', loc: 'Bostancı' },
        { id: 'wo-3', code: 'WO-1003', priority: 'Düşük', title: 'Periyodik Yıllık Bakım', duration: '120dk', loc: 'Ataşehir' },
        { id: 'wo-4', code: 'WO-1004', priority: 'Yüksek', title: 'Motor Arıza Tespiti (OBD)', duration: '60dk', loc: 'Maltepe' },
        { id: 'wo-5', code: 'WO-1005', priority: 'Normal', title: 'Fren Balata Değişimi', duration: '45dk', loc: 'Kadıköy' }
    ]);

    const [technicians, setTechnicians] = useState<any[]>([
        { id: 'tech-1', name: 'Ahmet Yılmaz', jobs: [] },
        { id: 'tech-2', name: 'Mehmet Demir', jobs: [] },
        { id: 'tech-3', name: 'Ali Veli', jobs: [] }
    ]);

    const [viewMode, setViewMode] = useState<'KANBAN' | 'GANTT' | 'MAP'>('KANBAN');
    const [showTemplates, setShowTemplates] = useState(false);
    const [showOptimizeModal, setShowOptimizeModal] = useState(false);
    const [showTeamsModal, setShowTeamsModal] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [showNewApptModal, setShowNewApptModal] = useState(false);

    // DRAG & DROP HANDLERS (Native HTML5)
    // ... [existing logic remains] ...
    const handleDragStart = (e: React.DragEvent, jobId: string, sourceTechId: string | null = null) => {
        e.dataTransfer.setData('jobId', jobId);
        e.dataTransfer.setData('sourceTechId', sourceTechId || 'unplanned');
    };

    const handleDrop = (e: React.DragEvent, targetTechId: string | null = null) => {
        const jobId = e.dataTransfer.getData('jobId');
        const sourceTechId = e.dataTransfer.getData('sourceTechId');

        if (!jobId || sourceTechId === String(targetTechId)) return;

        let jobToMove: any = null;

        // 1. Find and remove from origin
        if (sourceTechId === 'unplanned') {
            const index = unplanned.findIndex(j => j.id === jobId);
            if (index !== -1) {
                jobToMove = unplanned[index];
                const newUnplanned = [...unplanned];
                newUnplanned.splice(index, 1);
                setUnplanned(newUnplanned);
            }
        } else {
            const newTechs = [...technicians];
            const tIndex = newTechs.findIndex(t => t.id === sourceTechId);
            if (tIndex !== -1) {
                const jIndex = newTechs[tIndex].jobs.findIndex((j: any) => j.id === jobId);
                if (jIndex !== -1) {
                    jobToMove = newTechs[tIndex].jobs[jIndex];
                    newTechs[tIndex].jobs.splice(jIndex, 1);
                    setTechnicians(newTechs);
                }
            }
        }

        if (!jobToMove) return;

        // 2. Add to destination
        if (targetTechId === 'unplanned' || targetTechId === null) {
            setUnplanned(prev => [...prev, jobToMove]);
        } else {
            setTechnicians(prev => prev.map(t => {
                if (t.id === targetTechId) {
                    return { ...t, jobs: [...t.jobs, jobToMove] };
                }
                return t;
            }));
        }
    };

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
                            <Link href="/service/calendar" className="h-[36px] sm:h-[40px] px-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-[10px] font-bold text-[11px] sm:text-[12px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm">
                                <CalendarCheck className="w-4 h-4 text-emerald-500" /> Servis Randevuları
                            </Link>
                            <button onClick={() => setShowNewApptModal(true)} className="h-[36px] sm:h-[40px] px-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-[10px] font-bold text-[11px] sm:text-[12px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm">
                                <PlusSquare className="w-4 h-4 text-blue-500" /> Yeni Randevu
                            </button>
                            <div className="w-[1px] h-8 bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block"></div>
                            <button onClick={() => setShowTemplates(true)} className="h-[36px] sm:h-[40px] px-4 sm:px-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-orange-600 dark:text-orange-400 hover:bg-slate-50 rounded-[10px] font-bold text-[11px] sm:text-[12px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm">
                                <LayoutDashboard className="w-4 h-4" /> Kapasite & Bölgeler
                            </button>
                            <button onClick={() => setShowOptimizeModal(true)} className="h-[36px] sm:h-[40px] px-4 sm:px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-[10px] font-bold text-[11px] sm:text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm">
                                <Activity className="w-4 h-4" /> Optimize Et
                            </button>
                        </div>
                    </div>
                </div>

                {/* BOARD ALANI */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
                    
                    {/* SOL KOLON: BEKLEYEN İŞ EMİRLERİ */}
                    <div 
                        className="lg:col-span-1 h-[calc(100vh-180px)] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col overflow-hidden transition-colors"
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-slate-100', 'dark:bg-slate-800'); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('bg-slate-100', 'dark:bg-slate-800'); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('bg-slate-100', 'dark:bg-slate-800');
                            handleDrop(e, 'unplanned');
                        }}
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">Planda Olmayanlar</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300">{unplanned.length}</span>
                            </div>
                            <button className="text-slate-400 hover:text-orange-500 transition-colors"><Filter className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
                            {unplanned.length === 0 && (
                                <div className="text-center py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    Bekleyen İş Yok
                                </div>
                            )}
                            {unplanned.map((job) => (
                                <div 
                                    key={job.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, job.id, 'unplanned')}
                                    className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-sm cursor-grab hover:border-orange-500/50 transition-colors active:cursor-grabbing"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{job.code}</span>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${job.priority === 'Yüksek' ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' : job.priority === 'Normal' ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-600 bg-slate-100 dark:bg-slate-700'}`}>
                                            {job.priority}
                                        </span>
                                    </div>
                                    <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200 mb-1 leading-tight">{job.title}</h4>
                                    <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mb-2">
                                        <Map className="w-3 h-3" /> {job.loc}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                                        <div className="font-mono text-[10px] font-bold text-slate-500">Tahmini: {job.duration}</div>
                                        <button className="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-bold text-[10px] uppercase tracking-wider">Ata</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SAĞ KOLONLAR: TEKNİSYEN TAKVİMİ / GANTT */}
                    <div className="lg:col-span-3 h-[calc(100vh-180px)] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 overflow-x-auto custom-scroll">
                            <div className="flex gap-4 shrink-0">
                                <button onClick={() => setViewMode('KANBAN')} className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-colors ${viewMode === 'KANBAN' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-slate-400 hover:text-orange-500'}`}>Teknisyen (Kanban)</button>
                                <button onClick={() => setViewMode('GANTT')} className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-colors ${viewMode === 'GANTT' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-slate-400 hover:text-orange-500'}`}>Zaman Çizelgesi (Gantt)</button>
                                <button onClick={() => setViewMode('MAP')} className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-colors ${viewMode === 'MAP' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-slate-400 hover:text-orange-500'}`}>Rota Haritası</button>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                <button onClick={() => setShowTeamsModal(true)} className="flex items-center gap-1.5 text-[10px] font-bold bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:border-orange-500/50 transition-colors">
                                    <Users className="w-3 h-3" /> Ekipler
                                </button>
                                <button onClick={() => setShowRulesModal(true)} className="flex items-center gap-1.5 text-[10px] font-bold bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:border-orange-500/50 transition-colors">
                                    <Settings2 className="w-3 h-3" /> Kurallar
                                </button>
                            </div>
                        </div>

                        {/* DİNAMİK İÇERİK ALANI */}
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scroll relative bg-slate-50 dark:bg-slate-900">
                            {viewMode === 'KANBAN' && (
                                <div className="p-6 flex flex-col gap-6 min-w-[700px] animate-in fade-in duration-300">
                                    {technicians.map((tech) => (
                                        <div 
                                            key={tech.id} 
                                            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[14px] p-4 flex flex-col shadow-sm transition-colors"
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-orange-50', 'dark:bg-orange-500/10'); }}
                                            onDragLeave={(e) => { e.currentTarget.classList.remove('bg-orange-50', 'dark:bg-orange-500/10'); }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove('bg-orange-50', 'dark:bg-orange-500/10');
                                                handleDrop(e, tech.id);
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                                                        {tech.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[13px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">{tech.name}</h3>
                                                        <p className="text-[10px] text-slate-500">Kapasite: %{(tech.jobs.length * 20)} Kullanılıyor</p>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{tech.jobs.length} Görev</span>
                                            </div>
                                            
                                            <div className="flex gap-3 min-h-[100px] overflow-x-auto pb-2 custom-scroll items-start">
                                                {tech.jobs.length === 0 ? (
                                                    <div className="w-full h-[100px] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
                                                        Sürükle & Bırak ile İş Emri Atayın
                                                    </div>
                                                ) : (
                                                    tech.jobs.map((job: any) => (
                                                        <div 
                                                            key={job.id} 
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, job.id, tech.id)}
                                                            className="w-[240px] shrink-0 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 cursor-grab hover:border-orange-500/50 transition-colors active:cursor-grabbing"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">{job.code}</span>
                                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${job.priority === 'Yüksek' ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' : job.priority === 'Normal' ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-600 bg-slate-100 dark:bg-slate-700'}`}>
                                                                    {job.priority}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-2 leading-tight line-clamp-2">{job.title}</h4>
                                                            <div className="flex items-center justify-between mt-auto">
                                                                <div className="text-[9px] font-medium text-slate-500 flex items-center gap-1">
                                                                    <Map className="w-3 h-3" /> {job.loc}
                                                                </div>
                                                                <div className="font-mono text-[9px] font-bold text-slate-500">{job.duration}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'GANTT' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 p-6 text-center animate-in zoom-in-95 duration-300">
                                    <Clock className="w-12 h-12 text-slate-300 mb-4" />
                                    <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">Zaman Çizelgesi (Gantt) Hazırlanıyor</h3>
                                    <p className="text-[13px] text-slate-500 max-w-[400px] mt-2">Bu görünümde personellerin görev süreleri saatlere göre harita blokları halinde dizilecektir.</p>
                                </div>
                            )}

                            {viewMode === 'MAP' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[url('/bg-dots.svg')] dark:bg-[url('/bg-dots-dark.svg')] bg-[length:24px_24px] p-6 text-center animate-in zoom-in-95 duration-300">
                                    <div className="absolute inset-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-[1px]"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <Map className="w-12 h-12 text-orange-400 mb-4" />
                                        <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">Entegre Harita Görüntüsü</h3>
                                        <p className="text-[13px] text-slate-500 max-w-[400px] mt-2">Google Maps / Mapbox entegrasyonu tamamlandığında dağıtım rotaları burada simüle edilecektir.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showTemplates && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowTemplates(false)}>
                    <div className="bg-white dark:bg-[#0f172a] rounded-[24px] shadow-2xl w-full max-w-[500px] p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black mb-4 dark:text-white">Planlama Şablonları</h2>
                        <div className="space-y-3">
                            <div className="p-4 border border-slate-200 dark:border-white/10 rounded-xl hover:border-orange-500 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/50">
                                <h4 className="font-bold text-[14px] dark:text-slate-200 mb-1">Standart Periyodik Bakım Dağılımı</h4>
                                <p className="text-[12px] text-slate-500">Mevcut 3 teknisyeni bölgelere göre (%33) eş paylaştırır.</p>
                            </div>
                            <div className="p-4 border border-slate-200 dark:border-white/10 rounded-xl hover:border-orange-500 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/50">
                                <h4 className="font-bold text-[14px] dark:text-slate-200 mb-1">Acil Müdahale Düzeni</h4>
                                <p className="text-[12px] text-slate-500">Yüksek öncelikli işleri sadece "Usta" seviye personele atar.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowTemplates(false)} className="mt-6 w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold">Kapat</button>
                    </div>
                </div>
            )}

            {showOptimizeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowOptimizeModal(false)}>
                    <div className="bg-white dark:bg-[#0f172a] rounded-[24px] shadow-2xl w-full max-w-[400px] p-6 text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-8 h-8 animate-pulse" />
                        </div>
                        <h2 className="text-xl font-black mb-2 dark:text-white">Yapay Zeka Optimizasyonu</h2>
                        <p className="text-[13px] text-slate-500 mb-6">Sisteme girilen adres lokasyonları, tahmini süreler ve teknisyen yetkinlikleri baz alınarak rota optimizasyonu hesaplanacaktır.</p>
                        <button onClick={() => setShowOptimizeModal(false)} className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20">Optimizasyonu Başlat</button>
                    </div>
                </div>
            )}

            {showTeamsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowTeamsModal(false)}>
                    <div className="bg-white dark:bg-[#0f172a] rounded-[24px] shadow-2xl w-full max-w-[500px] p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black mb-4 dark:text-white">Ekip & Personel Yönetimi</h2>
                        <p className="text-[13px] text-slate-500 mb-4">Pano üzerinde görünecek personelleri buradan yönetebilirsiniz.</p>
                        <div className="space-y-2 mb-6">
                            {technicians.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-white/5 rounded-lg">
                                    <span className="font-bold text-[13px] dark:text-slate-200">{t.name}</span>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Aktif Sahada</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowTeamsModal(false)} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold">Kapat</button>
                    </div>
                </div>
            )}

            {showRulesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowRulesModal(false)}>
                    <div className="bg-white dark:bg-[#0f172a] rounded-[24px] shadow-2xl w-full max-w-[500px] p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black mb-4 dark:text-white">Planlama Kuralları</h2>
                        <div className="space-y-4 mb-6">
                            <label className="flex items-start gap-3">
                                <input type="checkbox" className="mt-1" defaultChecked />
                                <div>
                                    <p className="font-bold text-[13px] dark:text-slate-200">Mesafe Limitasyonu</p>
                                    <p className="text-[11px] text-slate-500">Personeller günlük 50km rotanın üzerine çıkamaz.</p>
                                </div>
                            </label>
                            <label className="flex items-start gap-3">
                                <input type="checkbox" className="mt-1" defaultChecked />
                                <div>
                                    <p className="font-bold text-[13px] dark:text-slate-200">Deneyim Eşleştirmesi</p>
                                    <p className="text-[11px] text-slate-500">Ağır hasar işleri sadece 5+ yıl kıdemli ustalara atanır.</p>
                                </div>
                            </label>
                        </div>
                        <button onClick={() => setShowRulesModal(false)} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold">Kaydet & Kapat</button>
                    </div>
                </div>
            )}

            {showNewApptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowNewApptModal(false)}>
                    <div className="bg-white dark:bg-[#0f172a] rounded-[24px] shadow-2xl w-full max-w-[500px] p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black dark:text-white">Hızlı Servis Randevusu</h2>
                            <button onClick={() => setShowNewApptModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Müşteri / Firma</label>
                                <input type="text" placeholder="Müşteri ara..." className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-bold outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Tarih</label>
                                    <input type="date" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Saat</label>
                                    <input type="time" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-bold outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Şikayet / Talep</label>
                                <textarea placeholder="Örn: Yıllık Periyodik Bakım..." className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-bold outline-none resize-none"></textarea>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowNewApptModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold">İptal</button>
                            <button onClick={() => { setShowNewApptModal(false); /* Fake save */ }} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Randevu Oluştur</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
