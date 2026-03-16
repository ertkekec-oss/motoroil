"use client";

import React, { useState, useEffect } from 'react';
import { Staff } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { 
    Search, UserCircle, Briefcase, Calendar, CheckCircle2, 
    XCircle, Clock, FileText, UploadCloud, MessageSquare,
    AlertCircle, Flag, MoreVertical, Plus
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
    setShowTaskModal: (show: boolean) => void; // Keeping for compatibility, but we might use our own
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
    const [selectedPerson, setSelectedPerson] = useState<Staff | null>(null);
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
        if (!selectedPerson || !newTaskTitle) {
            showError('Hata', 'Lütfen personel seçin ve görev başlığı girin.');
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
                const updated = await res.json();
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
                // We should also update activeTask, but simplest is fetchTasks() which updates the list.
                // We could re-select the active task
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

    const getStaffTaskCount = (staffId: string) => {
        return tasks.filter(t => t.staff.name === staff.find(s => s.id === staffId)?.name && t.status !== 'Tamamlandı').length;
    };

    const staffTasks = tasks.filter(t => t.staff.name === selectedPerson?.name);

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[75vh] animate-fade-in">
            {/* SOL KOLON: AKILLI PERSONEL LİSTESİ */}
            <div className="w-full md:w-80 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                    <h3 className="text-[15px] font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                        <UserCircle className="w-5 h-5 text-blue-600" /> Akıllı Personel Listesi
                    </h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Personel veya Rol ara..."
                            className="w-full h-10 pl-9 pr-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredStaff.map(person => {
                        const activeCount = getStaffTaskCount(person.id);
                        return (
                            <button
                                key={person.id}
                                onClick={() => {
                                    setSelectedPerson(person);
                                    setActiveTask(null);
                                    setIsCreatingTask(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                                    selectedPerson?.id === person.id
                                    ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-black text-[14px]">
                                        {person.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[14px] font-bold text-slate-900 dark:text-white">{person.name}</div>
                                        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{person.role}</div>
                                    </div>
                                </div>
                                {activeCount > 0 && (
                                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[11px] font-black shadow-sm">
                                        {activeCount}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                    {filteredStaff.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-[13px] font-medium">Sonuç bulunamadı.</div>
                    )}
                </div>
            </div>

            {/* SAĞ KOLON: GÖREV DETAYLARI VE YÖNETİMİ */}
            <div className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col overflow-hidden">
                {!selectedPerson ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60 grayscale">
                        <Briefcase className="w-16 h-16 text-slate-400 mb-4" />
                        <h3 className="text-[16px] font-black text-slate-900 dark:text-white">Personel Seçilmedi</h3>
                        <p className="text-[13px] text-slate-500 font-medium mt-2">Görev geçmişini görmek veya yeni görev atamak için listeden personel seçin.</p>
                    </div>
                ) : isCreatingTask ? (
                    // YENİ GÖREV ATAMA FORMU
                    <div className="flex-1 flex flex-col overflow-y-auto animate-in slide-in-from-right-4 duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-blue-600" /> Yeni Görev Ata
                                </h2>
                                <p className="text-[12px] font-bold tracking-widest text-slate-500 uppercase mt-1">Personel: <span className="text-blue-600">{selectedPerson.name}</span></p>
                            </div>
                            <button onClick={() => setIsCreatingTask(false)} className="text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white uppercase tracking-widest">
                                İptal Et
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6 max-w-2xl mx-auto w-full">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Görev Başlığı *</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Aylık raporların hazırlanması"
                                    className="w-full h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] px-4 text-[14px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Açıklama & Notlar (Opsiyonel)</label>
                                <textarea
                                    className="w-full h-32 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] p-4 text-[13px] font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm resize-none"
                                    placeholder="Görevin detayları, beklentiler ve yapılması gerekenler..."
                                    value={newTaskDesc}
                                    onChange={e => setNewTaskDesc(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Öncelik Seviyesi</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Düşük', 'Orta', 'Yüksek'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setNewTaskPriority(p)}
                                                className={`h-11 rounded-[10px] text-[11px] font-bold uppercase tracking-widest transition-all border shadow-sm ${
                                                    newTaskPriority === p ? getPriorityColor(p) : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Son Teslim Tarihi (Opsiyonel)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] px-4 text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                                        value={newTaskDueDate}
                                        onChange={e => setNewTaskDueDate(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium pl-1">X tarihe kadar uygulanmalı seçimi</p>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateTask}
                                disabled={isUpdating || !newTaskTitle}
                                className="w-full h-14 mt-8 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-black text-[13px] tracking-widest uppercase transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUpdating ? 'Atanıyor...' : 'GÖREVİ OLUŞTUR VE PERSONELE İNCELEMESİ İÇİN GÖNDER'}
                            </button>
                        </div>
                    </div>
                ) : activeTask ? (
                    // GÖREV DETAY VE LOG PENCERESİ
                    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex justify-between items-start shrink-0">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <button onClick={() => setActiveTask(null)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-200/50 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 w-8 h-8 rounded-lg flex items-center justify-center transition-all">
                                        ←
                                    </button>
                                    <h2 className="text-[18px] font-black text-slate-900 dark:text-white">{activeTask.title}</h2>
                                </div>
                                <div className="flex items-center gap-3 ml-11">
                                    <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${getStatusColor(activeTask.status)}`}>{activeTask.status}</span>
                                    <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${getPriorityColor(activeTask.priority)}`}>{activeTask.priority} ÖNCELİK</span>
                                    {activeTask.dueDate && (
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                                            <Calendar className="w-3 h-3" /> {new Date(activeTask.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* HR Admin Actions */}
                            <div className="flex items-center gap-2">
                                {activeTask.status !== 'Tamamlandı' && (
                                    <button 
                                        onClick={() => handleUpdateTaskStatus(activeTask.id, 'Tamamlandı')}
                                        className="h-9 px-4 rounded-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-[11px] tracking-widest uppercase transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Kapat / Onayla
                                    </button>
                                )}
                                {activeTask.status !== 'İptal' && activeTask.status !== 'Tamamlandı' && (
                                    <button 
                                        onClick={() => handleUpdateTaskStatus(activeTask.id, 'İptal')}
                                        className="h-9 px-4 rounded-[10px] bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-bold text-[11px] tracking-widest uppercase transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <XCircle className="w-4 h-4" /> İptal Et
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-transparent custom-scrollbar">
                            {/* Task Description */}
                            {activeTask.description && (
                                <div className="mb-8 p-5 bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm">
                                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Görev Açıklaması</h4>
                                    <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{activeTask.description}</p>
                                </div>
                            )}

                            {/* Feedbacks / Timeline */}
                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Yorumlar & Geri Bildirimler</h4>
                                
                                <div className="space-y-4 pl-2 border-l-2 border-slate-100 dark:border-white/5">
                                    {activeTask.feedbacks?.length === 0 ? (
                                        <div className="pl-6 text-[12px] font-medium text-slate-400 italic">Henüz bir etkileşim yok.</div>
                                    ) : (
                                        activeTask.feedbacks.map(fb => (
                                            <div key={fb.id} className="relative pl-6">
                                                <div className={`absolute left-[-21px] top-1 w-10 h-10 rounded-full border-4 border-slate-50 dark:border-[#0f172a] shadow-sm flex items-center justify-center text-white ${fb.isFromStaff ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                                    {fb.isFromStaff ? <UserCircle className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                                                </div>
                                                <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 p-4 rounded-2xl rounded-tl-none shadow-sm ml-2">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[12px] font-black text-slate-900 dark:text-white">{fb.isFromStaff ? activeTask.staff.name : 'Yönetim / İK'}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(fb.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">{fb.content}</p>
                                                    {fb.fileKey && (
                                                        <div className="mt-3 p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4" /></div>
                                                            <div className="text-[12px] font-bold text-slate-700 dark:text-slate-300 truncate">{fb.fileName || 'Ek Belge'}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Add Admin Comment */}
                        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shrink-0">
                            <div className="flex flex-col gap-2 relative">
                                <textarea
                                    className="w-full h-20 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl p-3 pr-24 text-[13px] font-medium resize-none outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                                    placeholder="Personele yönetici yanıtı veya ek talimat yazın..."
                                    value={feedbackContent}
                                    onChange={e => setFeedbackContent(e.target.value)}
                                />
                                <button
                                    onClick={handleSendFeedback}
                                    disabled={!feedbackContent.trim() || isUpdating}
                                    className="absolute right-3 bottom-3 h-9 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-black tracking-widest uppercase transition-all shadow-sm"
                                >
                                    YanıtlA
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // PERSONELİN GÖREV LİSTESİ
                    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[12px] bg-white dark:bg-[#0f172a] shadow-sm font-black text-blue-600 text-[18px] flex items-center justify-center border border-slate-200 dark:border-white/5">
                                    {selectedPerson.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-[18px] font-black text-slate-900 dark:text-white">{selectedPerson.name}</h2>
                                    <p className="text-[12px] font-bold tracking-widest text-slate-500 uppercase mt-0.5">{selectedPerson.role}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreatingTask(true)}
                                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-black text-[12px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5"
                            >
                                <Plus className="w-4 h-4" /> Yeni Görev Ata
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-[#0f172a] custom-scrollbar">
                            {staffTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 opacity-60">
                                    <Briefcase className="w-12 h-12 text-slate-400 mb-3" />
                                    <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Bu personelin henüz atanmış görevi yok.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {staffTasks.map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => setActiveTask(task)}
                                            className="text-left bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm hover:border-blue-500 transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-[15px] font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 pr-4">{task.title}</h3>
                                                <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${getStatusColor(task.status)}`}>{task.status}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                                                    <Flag className="w-3 h-3" /> {task.priority}
                                                </span>
                                                {task.dueDate && (
                                                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                                        <Calendar className="w-3.5 h-3.5" /> Teslim: {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 ml-auto">
                                                    <MessageSquare className="w-3.5 h-3.5" /> {task.feedbacks?.length || 0} Yorum
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
