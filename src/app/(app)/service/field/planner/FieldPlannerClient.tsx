"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Users, Map, Clock, ArrowRight, Settings2, Plus, PenTool, LayoutDashboard, Activity, CalendarCheck, PlusSquare } from 'lucide-react';
import Link from 'next/link';
import CustomerCreateModal from '@/components/modals/CustomerCreateModal';

export default function FieldPlannerClient() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [unplanned, setUnplanned] = useState<any[]>([
        { id: 'wo-1', code: 'WO-1001', priority: 'Yüksek', title: 'Dahili Filtre Bakımı & Yağ Değişimi', duration: '45dk', durationMins: 45, loc: 'Kozyatağı', coords: { lat: 40.9730, lng: 29.1000 } },
        { id: 'wo-2', code: 'WO-1002', priority: 'Normal', title: 'Akü Değişimi & Şarj Kontrolü', duration: '30dk', durationMins: 30, loc: 'Bostancı', coords: { lat: 40.9530, lng: 29.1000 } },
        { id: 'wo-3', code: 'WO-1003', priority: 'Düşük', title: 'Periyodik Yıllık Bakım', duration: '120dk', durationMins: 120, loc: 'Ataşehir', coords: { lat: 40.9840, lng: 29.1100 } },
        { id: 'wo-4', code: 'WO-1004', priority: 'Yüksek', title: 'Motor Arıza Tespiti (OBD)', duration: '60dk', durationMins: 60, loc: 'Maltepe', coords: { lat: 40.9320, lng: 29.1310 } },
        { id: 'wo-5', code: 'WO-1005', priority: 'Normal', title: 'Fren Balata Değişimi', duration: '45dk', durationMins: 45, loc: 'Kadıköy', coords: { lat: 40.9900, lng: 29.0200 } }
    ]);

    const [technicians, setTechnicians] = useState<any[]>([
        { id: 'tech-1', name: 'Ahmet Yılmaz', jobs: [], isVisible: true, activeZone: 'Kadıköy-Ataşehir' },
        { id: 'tech-2', name: 'Mehmet Demir', jobs: [], isVisible: true, activeZone: 'Maltepe-Kartal' },
        { id: 'tech-3', name: 'Ali Veli', jobs: [], isVisible: true, activeZone: 'Genel Dağıtım' }
    ]);

    const [optimizationRules, setOptimizationRules] = useState({
        mesafeKisitlamasi: true,
        deneyimEslesmesi: true,
        performansOnceligi: false
    });

    const [viewMode, setViewMode] = useState<'KANBAN' | 'GANTT' | 'MAP'>('KANBAN');
    const [showTemplates, setShowTemplates] = useState(false);
    const [showOptimizeModal, setShowOptimizeModal] = useState(false);
    const [showTeamsModal, setShowTeamsModal] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [showNewApptModal, setShowNewApptModal] = useState(false);

    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);

    const [realCustomers, setRealCustomers] = useState<any[]>([]);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);



    useEffect(() => {
        const fetchCustomers = async () => {
            if (customerSearch.length < 2) {
                setRealCustomers([]);
                return;
            }
            setCustomerLoading(true);
            try {
                const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`);
                if (res.ok) {
                    const data = await res.json();
                    setRealCustomers(data.customers || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setCustomerLoading(false);
            }
        };
        const timeoutId = setTimeout(fetchCustomers, 300);
        return () => clearTimeout(timeoutId);
    }, [customerSearch]);

    const runOptimization = (templateType: 'STANDARD' | 'EMERGENCY') => {
        // Simple client-side auto-routing algorithm simulation
        let newUnplanned = [...unplanned];
        let newTechs = JSON.parse(JSON.stringify(technicians)); // deep copy

        // Sort unplanned jobs by priority if EMERGENCY template
        if (templateType === 'EMERGENCY') {
            newUnplanned.sort((a, b) => (a.priority === 'Yüksek' ? -1 : 1));
        }

        // Extremely simplified "Greedy" load balancing across available specific technicians
        while (newUnplanned.length > 0) {
            const job = newUnplanned.shift();
            // Find tech with lowest total duration
            let bestTech = newTechs.reduce((min: any, t: any) => {
                const totalDur = t.jobs.reduce((sum: number, j: any) => sum + (j.durationMins || 30), 0);
                const minDur = min.jobs.reduce((sum: number, j: any) => sum + (j.durationMins || 30), 0);
                return totalDur < minDur ? t : min;
            }, newTechs[0]);

            bestTech.jobs.push(job);
        }

        setUnplanned([]);
        setTechnicians(newTechs);
        setShowOptimizeModal(false);
        setShowTemplates(false);
    };

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
                                            className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[14px] p-4 flex flex-col shadow-sm transition-colors ${!tech.isVisible ? 'hidden' : ''}`}
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
                                <div className="p-6 flex flex-col gap-4 animate-in fade-in duration-300 min-w-[800px]">
                                    {technicians.filter(t => t.isVisible).map(tech => (
                                        <div key={tech.id} className="relative bg-white dark:bg-[#0f172a] rounded-[16px] border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                                                        {tech.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-[13px] dark:text-white uppercase tracking-wider">{tech.name}</span>
                                                </div>
                                                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded font-mono font-bold">
                                                    Toplam Yük: {tech.jobs.reduce((acc: number, j: any) => acc + (j.durationMins || 60), 0)} dk
                                                </span>
                                            </div>
                                            
                                            {/* GANTT TIMELINE BAR */}
                                            <div className="relative h-16 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex items-center overflow-x-auto custom-scroll p-2 gap-2 border border-slate-100 dark:border-white/5">
                                                {tech.jobs.map((job: any) => (
                                                    <div key={job.id} 
                                                         className={`h-full rounded-lg px-3 py-1.5 flex flex-col justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity border ${job.priority === 'Yüksek' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20' : job.priority === 'Normal' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20' : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'} shadow-sm`}
                                                         style={{ width: `${Math.max((job.durationMins || 60) * 3, 80)}px` }} 
                                                    >
                                                        <span className="text-[10px] font-black truncate block tracking-wider uppercase mb-0.5">{job.code}</span>
                                                        <span className="text-[9px] truncate block opacity-70 mb-0.5">{job.title}</span>
                                                        <span className="text-[10px] font-mono font-bold mt-auto truncate block">{job.durationMins} dk</span>
                                                    </div>
                                                ))}
                                                {tech.jobs.length === 0 && <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest pl-4">Planlanmış iş emri yok.</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {technicians.filter(t => t.isVisible).length === 0 && (
                                        <div className="py-20 text-center text-slate-400 font-bold text-[12px] uppercase tracking-widest">
                                            Lütfen 'Ekipler' menüsünden en az bir teknisyen seçin.
                                        </div>
                                    )}
                                </div>
                            )}

                            {viewMode === 'MAP' && (
                                <div className="relative p-6 flex flex-col animate-in fade-in duration-300 min-h-[600px] h-full">
                                    <div className="absolute top-10 w-full text-center z-[1000] pointer-events-none">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full text-[11px] font-bold tracking-widest uppercase shadow-lg">
                                            <Map className="w-3 h-3 text-orange-400" /> Tam Zamanlı Açık Harita (OSM)
                                        </div>
                                    </div>
                                    <div className="flex-1 relative bg-[#e2e8f0] dark:bg-[#1e293b] rounded-[24px] border border-slate-300 dark:border-white/10 overflow-hidden shadow-inner">
                                        <LeafletPlannerMap technicians={technicians} unplanned={unplanned} />
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
                        <h2 className="text-xl font-black mb-4 dark:text-white">Otomatik Dağıtım Kuralları</h2>
                        <div className="space-y-3">
                            <div onClick={() => runOptimization('STANDARD')} className="p-4 border border-slate-200 dark:border-white/10 rounded-xl hover:border-orange-500 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/50">
                                <h4 className="font-bold text-[14px] dark:text-slate-200 mb-1">Standart Periyodik Bakım Dağılımı</h4>
                                <p className="text-[12px] text-slate-500">Kalan işleri mevcut teknisyenlere tahmini süreye göre eş paylaştırır.</p>
                            </div>
                            <div onClick={() => runOptimization('EMERGENCY')} className="p-4 border border-slate-200 dark:border-white/10 rounded-xl hover:border-orange-500 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/50">
                                <h4 className="font-bold text-[14px] dark:text-slate-200 mb-1">Acil Müdahale Düzeni</h4>
                                <p className="text-[12px] text-slate-500">Yüksek öncelikli işleri önceleyecek şekilde hızlı dağıtım yapar.</p>
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
                                <div key={t.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-white/5 rounded-lg hover:border-orange-500/50 transition-colors">
                                    <label className="flex items-center justify-between w-full cursor-pointer">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[13px] dark:text-slate-200">{t.name}</span>
                                            <span className="text-[10px] text-slate-500">{t.activeZone}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {t.isVisible ? 'Sahada' : 'Gizli'}
                                            </span>
                                            <input 
                                                type="checkbox" 
                                                checked={t.isVisible} 
                                                onChange={(e) => {
                                                    setTechnicians(prev => prev.map(p => p.id === t.id ? {...p, isVisible: e.target.checked} : p))
                                                }} 
                                                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                                            />
                                        </div>
                                    </label>
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
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={optimizationRules.mesafeKisitlamasi} 
                                    onChange={(e) => setOptimizationRules({...optimizationRules, mesafeKisitlamasi: e.target.checked})}
                                    className="mt-1 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer" 
                                />
                                <div>
                                    <p className="font-bold text-[13px] dark:text-slate-200 group-hover:text-orange-500 transition-colors">Mesafe Limitasyonu</p>
                                    <p className="text-[11px] text-slate-500">Personeller günlük 50km rotanın üzerine çıkamaz.</p>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={optimizationRules.deneyimEslesmesi} 
                                    onChange={(e) => setOptimizationRules({...optimizationRules, deneyimEslesmesi: e.target.checked})}
                                    className="mt-1 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer" 
                                />
                                <div>
                                    <p className="font-bold text-[13px] dark:text-slate-200 group-hover:text-orange-500 transition-colors">Deneyim Eşleştirmesi</p>
                                    <p className="text-[11px] text-slate-500">Ağır hasar işleri sadece 5+ yıl kıdemli ustalara atanır.</p>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={optimizationRules.performansOnceligi} 
                                    onChange={(e) => setOptimizationRules({...optimizationRules, performansOnceligi: e.target.checked})}
                                    className="mt-1 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer" 
                                />
                                <div>
                                    <p className="font-bold text-[13px] dark:text-slate-200 group-hover:text-orange-500 transition-colors">Yük Dengelemesi (Eşit Dağılım)</p>
                                    <p className="text-[11px] text-slate-500">İşleri öncelikle mesafe / uzmanlığa değil, teknisyen toplam dolu saatine göre eş paylaştırır.</p>
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
                            <div className="relative">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Müşteri / Firma</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Müşteri ara..." 
                                        value={selectedCustomer ? selectedCustomer.name : customerSearch}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            setSelectedCustomer(null);
                                            setIsCustomerListOpen(true);
                                        }}
                                        onFocus={() => setIsCustomerListOpen(true)}
                                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-bold outline-none focus:border-blue-500 dark:focus:border-blue-500/50 transition-colors" 
                                    />
                                    {selectedCustomer && (
                                        <button 
                                            onClick={() => {
                                                setSelectedCustomer(null);
                                                setCustomerSearch('');
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full"
                                        >✕</button>
                                    )}
                                </div>
                                {isCustomerListOpen && !selectedCustomer && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsCustomerListOpen(false)}></div>
                                        <div className="absolute top-[calc(100%+4px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scroll bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20">
                                            {customerLoading ? (
                                                    <div className="p-4 text-center text-slate-500 text-[12px]">Aranıyor...</div>
                                                ) : realCustomers.length === 0 ? (
                                                    <div className="p-5 text-center">
                                                        <div className="text-slate-500 text-[12px] mb-3">"{customerSearch}" adına kayıtlı cari bulunamadı.</div>
                                                        <button onClick={() => { setIsCreatingCustomer(true); setNewCustomerName(customerSearch); }} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                                                            + Yeni Müşteri/Firma Ekle
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {realCustomers.map(cust => (
                                                            <div 
                                                                key={cust.id} 
                                                                onClick={() => {
                                                                    setSelectedCustomer(cust);
                                                                    setIsCustomerListOpen(false);
                                                                }}
                                                                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
                                                            >
                                                                <div className="font-bold text-[13px] dark:text-slate-200">{cust.name}</div>
                                                                <div className="text-[11px] text-slate-500 flex gap-2 mt-0.5">
                                                                    <span>{cust.district || '-'}, {cust.city || '-'}</span>
                                                                    <span className="opacity-50">•</span>
                                                                    <span>{cust.phone || '-'}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 text-center">
                                                            <button onClick={() => { setIsCustomerListOpen(false); setIsCreatingCustomer(true); setNewCustomerName(customerSearch); }} className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                                                + Listede yok mu? Yeni Ekle
                                                            </button>
                                                        </div>
                                                    </>
                                                )
                                            }
                                        </div>
                                    </>
                                )}
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

function LeafletPlannerMap({ technicians, unplanned }: { technicians: any[], unplanned: any[] }) {
    const mapRef = React.useRef<any>(null);
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    const markersRef = React.useRef<any[]>([]);

    React.useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        let isMounted = true;
        let resizeObserver: ResizeObserver | null = null;

        // 1. Dynamically load Leaflet CSS if not present
        if (!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/leaflet/leaflet.css';
            link.onload = () => {
                if (mapRef.current && isMounted) {
                    mapRef.current.invalidateSize();
                }
            };
            document.head.appendChild(link);
        }

        const initMap = () => {
            if (!isMounted || !mapContainerRef.current) return;
            
            const L = (window as any).L;
            if (!L) return;

            // Prevent re-initialization on the same node
            if ((mapContainerRef.current as any)._leaflet_id) {
                return;
            }

            const map = L.map(mapContainerRef.current, {
                center: [40.9500, 29.0500],
                zoom: 12,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);

            mapRef.current = map;
            renderMarkers();
            
            // Force resize a few times to cover animation timings
            setTimeout(() => { if (mapRef.current && isMounted) mapRef.current.invalidateSize(); }, 100);
            setTimeout(() => { if (mapRef.current && isMounted) mapRef.current.invalidateSize(); }, 300);
            setTimeout(() => { if (mapRef.current && isMounted) mapRef.current.invalidateSize(); }, 800);

            // Add ResizeObserver to handle any container changes
            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(() => {
                    if (mapRef.current && isMounted) {
                        mapRef.current.invalidateSize();
                    }
                });
                resizeObserver.observe(mapContainerRef.current);
            }
        };

        // 2. Dynamically load Leaflet JS
        if (!(window as any).L) {
            const existingScript = document.querySelector('script[src*="leaflet.js"]');
            if (existingScript) {
                existingScript.addEventListener('load', initMap);
            } else {
                const script = document.createElement('script');
                script.src = '/leaflet/leaflet.js';
                script.onload = initMap;
                document.head.appendChild(script);
            }
        } else {
            // Give it a tiny tick for the DOM to settle
            setTimeout(initMap, 50);
        }

        return () => {
            isMounted = false;
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            
            const existingScript = document.querySelector('script[src*="leaflet.js"]');
            if (existingScript) {
               existingScript.removeEventListener('load', initMap);
            }
        };
    }, []);

    const renderMarkers = () => {
        if (!mapRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        // Clear old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        const bounds: [number, number][] = [];

        // 1. Unplanned jobs (Gray markers)
        unplanned.forEach(job => {
            if (job.coords && job.coords.lat && job.coords.lng) {
                const grayIcon = L.divIcon({
                    className: '',
                    html: `<div style="width:16px;height:16px;border-radius:50%;background:#94a3b8;border:2px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.3); animation:myping 2s infinite"></div>`,
                    iconAnchor: [8, 8]
                });
                const m = L.marker([job.coords.lat, job.coords.lng], { icon: grayIcon })
                    .addTo(mapRef.current)
                    .bindPopup(`<div style="font-family:sans-serif;font-size:12px;color:black"><b>${job.code}</b><br>${job.title}<br>${job.loc}</div>`);
                markersRef.current.push(m);
                bounds.push([job.coords.lat, job.coords.lng]);
            }
        });

        // 2. Technicians and their routes
        technicians.filter(t => t.isVisible).forEach((tech, tIndex) => {
            const colorsHex = ['#f97316', '#3b82f6', '#10b981', '#a855f7'];
            const color = colorsHex[tIndex % colorsHex.length];
            const routePoints: [number, number][] = [];

            tech.jobs.forEach((job: any, jIndex: number) => {
                if (job.coords && job.coords.lat && job.coords.lng) {
                    routePoints.push([job.coords.lat, job.coords.lng]);
                    bounds.push([job.coords.lat, job.coords.lng]);

                    const colorIcon = L.divIcon({
                        className: '',
                        html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:10px">${jIndex + 1}</div>`,
                        iconAnchor: [12, 12]
                    });
                    const m = L.marker([job.coords.lat, job.coords.lng], { icon: colorIcon })
                        .addTo(mapRef.current)
                        .bindPopup(`<div style="font-family:sans-serif;font-size:12px;color:black"><b>[${tech.name}] Hedef #${jIndex + 1}</b><br>${job.code} - ${job.loc}<br>${job.durationMins}dk</div>`);
                    markersRef.current.push(m);
                }
            });

            // Draw route line
            if (routePoints.length > 1) {
                const line = L.polyline(routePoints, {
                    color: color,
                    weight: 3,
                    dashArray: '8 6',
                    opacity: 0.7
                }).addTo(mapRef.current);
                markersRef.current.push(line);
            }
        });

        if (bounds.length > 0) {
            mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    };

    React.useEffect(() => {
        renderMarkers();
    }, [technicians, unplanned]);

    return (
        <div className="w-full h-full relative z-[1]">
            <style>{`
                @keyframes myping {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 10px !important;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
                }
            `}</style>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: '24px' }} />
        </div>
    );
}
