"use client";

import React, { useState, useEffect } from 'react';
import { Staff } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { 
    Search, UserCircle, Briefcase, Calendar, CheckCircle2, 
    XCircle, FileText, MessageSquare, Flag, Plus
} from 'lucide-react';

interface StaffTask {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string | null;
    completedAt: string | null;
    createdAt: string;
    staff: { name: string; role: string };
    feedbacks: TaskFeedback[];
}

interface TaskFeedback {
    id: string;
    content: string;
    isFromStaff: boolean;
    fileKey: string | null;
    fileName: string | null;
    createdAt: string;
}

interface HrTasksTabProps {
    staff: Staff[];
    setSelectedStaff: (staff: Staff) => void;
    setShowTaskModal: (show: boolean) => void;
}

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'Yüksek': return 'text-rose-600 bg-rose-50 border-rose-200';
        case 'Kritik': return 'text-red-700 bg-red-100 border-red-300';
        case 'Orta': return 'text-amber-600 bg-amber-50 border-amber-200';
        case 'Düşük': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Tamamlandı': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        case 'Devam Ediyor': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'İptal': return 'text-slate-600 bg-slate-50 border-slate-200';
        case 'İncelemede': return 'text-purple-600 bg-purple-50 border-purple-200';
        default: return 'text-amber-600 bg-amber-50 border-amber-200';
    }
};

export default function HrTasksTab({ staff, setSelectedStaff }: HrTasksTabProps) {
    const { showError, showSuccess } = useModal();
    const [tasks, setTasks] = useState<StaffTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Smart List state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPerson, setSelectedPerson] = useState<Staff | null>({ id: 'ALL', name: 'Tüm Görevler', role: 'Genel Bakış' } as any);
    const [activeTask, setActiveTask] = useState<StaffTask | null>(null);

    // New task modal
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('Orta');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    // Feedback
    const [feedbackContent, setFeedbackContent] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Filters and Pagination
    const [filterStatus, setFilterStatus] = useState('Devam Edenler'); // 'Tümü', 'Devam Edenler', 'Tamamlandı'
    const [currentPage, setCurrentPage] = useState(1);
    const tasksPerPage = 15;

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/staff/tasks');
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!selectedPerson || selectedPerson.id === 'ALL' || !newTaskTitle) {
            showError('Hata', 'Lütfen geçerli bir personel seçin ve görev başlığı girin.');
            return;
        }

        setIsUpdating(true);
        try {
            const res = await fetch('/api/staff/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: selectedPerson.id,
                    title: newTaskTitle,
                    description: newTaskDesc,
                    priority: newTaskPriority,
                    dueDate: newTaskDueDate || null
                })
            });

            if (res.ok) {
                showSuccess('Başarılı', 'Görev personele atandı.');
                setIsCreatingTask(false);
                setNewTaskTitle('');
                setNewTaskDesc('');
                setNewTaskDueDate('');
                fetchTasks();
            } else {
                showError('Hata', 'Görev atanamadı.');
            }
        } catch (e) {
            showError('Hata', 'Sunucu hatası.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/staff/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchTasks();
                if (activeTask?.id === taskId) {
                    setActiveTask(prev => prev ? { ...prev, status: newStatus } : null);
                }
            }
        } catch (e) {
            showError('Hata', 'Durum güncellenemedi.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendFeedback = async () => {
        if (!activeTask || !feedbackContent.trim()) return;

        setIsUpdating(true);
        try {
            const res = await fetch(`/api/staff/tasks/${activeTask.id}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: feedbackContent,
                    isFromStaff: false // Yöneticiden
                })
            });

            if (res.ok) {
                setFeedbackContent('');
                fetchTasks();
                const newFeedback = await res.json();
                setActiveTask(prev => prev ? {
                    ...prev,
                    feedbacks: [...prev.feedbacks, newFeedback]
                } : null);
            }
        } catch (e) {
            showError('Hata', 'Geri bildirim gönderilemedi.');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredStaff = staff.filter(s => 
        (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         s.role?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        s.status !== 'Pasif'
    );

    const getStaffTaskCount = (staffId: string | number) => {
        return tasks.filter(t => t.staff.name === staff.find(s => s.id === staffId)?.name && t.status !== 'Tamamlandı').length;
    };

    const baseStaffTasks = selectedPerson === null || selectedPerson?.id === 'ALL' ? tasks : tasks.filter(t => t.staff.name === selectedPerson?.name);
    
    // Apply Filters
    const filteredTasks = baseStaffTasks.filter(t => {
        if (filterStatus === 'Tümü') return true;
        if (filterStatus === 'Tamamlandı') return t.status === 'Tamamlandı';
        return t.status !== 'Tamamlandı' && t.status !== 'İptal';
    });

    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
    const paginatedStaffTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px] animate-in fade-in duration-500 text-slate-900 dark:text-white">
            {/* COLUMN 1: AKILLI PERSONEL LİSTESİ */}
            <div className="lg:col-span-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col h-[600px] lg:h-[calc(100vh-180px)] min-h-[600px] overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                    <h3 className="text-[13px] font-black flex items-center gap-2 mb-3">
                        <UserCircle className="w-4 h-4 text-blue-600" /> Personel Listesi
                    </h3>
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Personel veya Rol ara..."
                            className="w-full h-9 pl-9 pr-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[8px] text-[12px] font-semibold outline-none focus:border-blue-500 shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    <button
                        onClick={() => { setSelectedPerson({ id: 'ALL', name: 'Tüm Görevler', role: 'Genel Bakış' } as any); setActiveTask(null); setIsCreatingTask(false); setCurrentPage(1); }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border ${selectedPerson?.id === 'ALL' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 border-transparent'}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center font-black text-[12px]">📋</div>
                            <div className="text-left">
                                <div className="text-[12px] font-bold">Tüm Görevler</div>
                                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Genel Görünüm</div>
                            </div>
                        </div>
                    </button>
                    {filteredStaff.map(person => {
                        const activeCount = getStaffTaskCount(person.id);
                        return (
                            <button
                                key={person.id}
                                onClick={() => {
                                    setSelectedPerson(person);
                                    setActiveTask(null);
                                    setIsCreatingTask(false);
                                    setCurrentPage(1);
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                                    selectedPerson?.id === person.id
                                    ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-black text-[12px]">
                                        {String(person.name).charAt(0)}
                                    </div>
                                    <div className="text-left w-32">
                                        <div className="text-[12px] font-bold truncate">{person.name}</div>
                                        <div className="text-[9px] font-medium text-slate-500 uppercase tracking-widest truncate">{person.role}</div>
                                    </div>
                                </div>
                                {activeCount > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[9px] font-black shadow-sm shrink-0">
                                        {activeCount}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* COLUMN 2: GÖREV LİSTESİ */}
            <div className="lg:col-span-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col h-[600px] lg:h-[calc(100vh-180px)] min-h-[600px] overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                    <div className="flex justify-between items-center mb-3">
                        <div className="truncate pr-2">
                            <h2 className="text-[14px] font-black truncate">{selectedPerson?.name}</h2>
                            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{selectedPerson?.role}</p>
                        </div>
                        <button
                            onClick={() => { setIsCreatingTask(true); setActiveTask(null); }}
                            disabled={!selectedPerson || selectedPerson.id === 'ALL'}
                            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" /> YENİ
                        </button>
                    </div>
                    <div className="flex bg-slate-200/50 dark:bg-[#0f172a] p-1 rounded-lg border border-slate-200 dark:border-slate-800 w-full mb-2">
                        {['Devam Edenler', 'Tamamlandı'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setFilterStatus(status); setCurrentPage(1); setActiveTask(null); }}
                                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${filterStatus === status ? 'bg-white dark:bg-[#1e293b] text-blue-600 shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {status.substring(0,10)}
                            </button>
                        ))}
                        <button
                            onClick={() => { setFilterStatus('Tümü'); setCurrentPage(1); setActiveTask(null); }}
                            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${filterStatus === 'Tümü' ? 'bg-white dark:bg-[#1e293b] text-blue-600 shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >Tümü</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {isLoading ? (
                         <div className="p-8 text-center text-slate-400 text-[11px] font-medium">Yükleniyor...</div>
                    ) : paginatedStaffTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 opacity-60">
                            <Briefcase className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Görev bulunamadı.</p>
                        </div>
                    ) : (
                        paginatedStaffTasks.map((task: any) => (
                            <button
                                key={task.id}
                                onClick={() => { setActiveTask(task); setIsCreatingTask(false); }}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${activeTask?.id === task.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20' : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/5 hover:border-blue-400'}`}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <h3 className="text-[12px] font-black line-clamp-1 pr-2">{task.title}</h3>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest shrink-0 ${getStatusColor(task.status)}`}>{task.status === 'Devam Ediyor' ? 'Devam' : task.status}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                                        <Flag className="w-2.5 h-2.5" /> {task.priority}
                                    </span>
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[120px]">
                                        <UserCircle className="w-3 h-3" /> {task.staff?.name.split(' ')[0]}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
                
                {totalPages > 1 && (
                    <div className="p-2 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex items-center justify-between text-[10px] font-bold text-slate-500 shrink-0">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 rounded-md bg-white border disabled:opacity-50">GERİ</button>
                        <span>{currentPage} / {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 rounded-md bg-white border disabled:opacity-50">İLERİ</button>
                    </div>
                )}
            </div>

            {/* COLUMN 3: GÖREV DETAY / FORM */}
            <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col h-[600px] lg:h-[calc(100vh-180px)] min-h-[600px] overflow-hidden">
                {!isCreatingTask && !activeTask ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-[#0f172a] opacity-50">
                        <Briefcase className="w-16 h-16 text-slate-400 mb-4" />
                        <p className="font-bold text-slate-500 uppercase tracking-widest text-[13px]">Detayları görmek için listeden görev seçin.</p>
                    </div>
                ) : isCreatingTask ? (
                    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in">
                        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex justify-between items-center sticky top-0 z-10 shrink-0">
                            <div>
                                <h2 className="text-[16px] font-black flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-blue-600" /> Yeni Görev Ata
                                </h2>
                                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mt-0.5"><span className="text-blue-600">{selectedPerson?.name}</span> adlı personele görev oluşturuluyor.</p>
                            </div>
                            <button onClick={() => setIsCreatingTask(false)} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white uppercase tracking-widest border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md bg-white dark:bg-slate-800">İptal Et</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-3xl mx-auto w-full custom-scrollbar">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Görev Başlığı *</label>
                                <input type="text" placeholder="Örn: Aylık raporların hazırlanması" className="w-full h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-blue-500 shadow-sm" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Açıklama & Notlar (Opsiyonel)</label>
                                <textarea className="w-full h-32 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl p-4 text-[13px] font-medium outline-none focus:border-blue-500 shadow-sm resize-none" placeholder="Görevin detayları, beklentiler..." value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Öncelik Seviyesi</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Düşük', 'Orta', 'Yüksek'].map(p => (
                                            <button key={p} onClick={() => setNewTaskPriority(p)} className={`h-10 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all border ${newTaskPriority === p ? getPriorityColor(p) : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-[#0f172a] text-slate-500'}`}>{p}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Son Teslim Tarihi (Opsiyonel)</label>
                                    <input type="datetime-local" className="w-full h-10 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg px-4 text-[12px] font-bold outline-none focus:border-blue-500 shadow-sm" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} />
                                </div>
                            </div>

                            <button onClick={handleCreateTask} disabled={isUpdating || !newTaskTitle} className="w-full h-12 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[12px] tracking-widest uppercase shadow-md disabled:opacity-50">
                                {isUpdating ? 'Atanıyor...' : 'GÖREVİ OLUŞTUR VE GÖNDER'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in">
                        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex justify-between items-start shrink-0">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-black text-[14px] flex items-center justify-center shrink-0">#{activeTask?.id.slice(-4).toUpperCase()}</div>
                                    <h2 className="text-[16px] md:text-[18px] font-black">{activeTask?.title}</h2>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${getStatusColor(activeTask?.status || '')}`}>{activeTask?.status}</span>
                                    <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${getPriorityColor(activeTask?.priority || '')}`}>{activeTask?.priority} ÖNCELİK</span>
                                    {activeTask?.dueDate && (
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-slate-600 bg-white text-[10px] font-bold uppercase tracking-widest">
                                            <Calendar className="w-3 h-3" /> Teslim: {new Date(activeTask.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-slate-500 bg-white dark:bg-[#0f172a] text-[10px] font-bold uppercase tracking-widest">
                                        <UserCircle className="w-3 h-3" /> Atanmış: {activeTask?.staff?.name}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                                {activeTask?.status !== 'Tamamlandı' && (
                                    <button onClick={() => handleUpdateTaskStatus(activeTask?.id || '', 'Tamamlandı')} className="h-9 px-3 md:px-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                                        <CheckCircle2 className="w-4 h-4" /> <span className="hidden md:inline">Onayla</span>
                                    </button>
                                )}
                                {activeTask?.status !== 'İptal' && activeTask?.status !== 'Tamamlandı' && (
                                    <button onClick={() => handleUpdateTaskStatus(activeTask?.id || '', 'İptal')} className="h-9 px-3 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                                        <XCircle className="w-4 h-4" /> <span className="hidden lg:inline">İptal</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-transparent custom-scrollbar">
                            {activeTask?.description && (
                                <div className="mb-6 p-4 md:p-5 bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm">
                                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Görev Açıklaması</h4>
                                    <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{activeTask.description}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Yorumlar & Etkinlik</h4>
                                
                                <div className="space-y-4 pl-3 border-l-2 border-slate-100 dark:border-white/5 ml-1">
                                    {activeTask?.feedbacks?.length === 0 ? (
                                        <div className="pl-4 text-[12px] font-medium text-slate-400 italic">Henüz bir yorum yok.</div>
                                    ) : (
                                        activeTask?.feedbacks?.map((fb: any) => (
                                            <div key={fb.id} className="relative pl-5">
                                                <div className={`absolute left-[-29px] top-0 w-8 h-8 rounded-full border-[3px] border-slate-50 dark:border-[#0f172a] shadow-sm flex items-center justify-center text-white ${fb.isFromStaff ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                                    {fb.isFromStaff ? <UserCircle className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                                                </div>
                                                <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 p-3 md:p-4 rounded-xl shadow-sm">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-[12px] font-black">{fb.isFromStaff ? activeTask.staff.name : 'Yönetim / İK'}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(fb.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">{fb.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shrink-0">
                            <div className="flex flex-col gap-2 relative">
                                <textarea className="w-full h-16 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl p-3 pr-24 text-[12px] font-medium resize-none outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white" placeholder="Yönetici yanıtı yazın..." value={feedbackContent} onChange={e => setFeedbackContent(e.target.value)} />
                                <button onClick={handleSendFeedback} disabled={!feedbackContent.trim() || isUpdating} className="absolute right-3 bottom-3 h-8 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-black tracking-widest uppercase transition-all shadow-sm">YanıtlA</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
