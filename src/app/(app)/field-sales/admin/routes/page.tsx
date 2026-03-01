"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Map, Settings, Target, ChevronLeft, ChevronRight, Plus, MapPin, Search, X, Edit2, Info, Users, CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react';

export default function AdminRoutesPage() {
    const { isAuthenticated, isLoading, user: currentUser } = useAuth();
    const { showError, showSuccess, showConfirm } = useModal();
    const router = useRouter();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [routes, setRoutes] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);

    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    const [newTemplateName, setNewTemplateName] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<any[]>([]);

    // Şablon düzenleme
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [editTemplateName, setEditTemplateName] = useState('');

    const searchCustomers = async (query: string) => {
        if (query.length < 2) { setSearchResults([]); return; }
        try {
            const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.customers || []);
            }
        } catch (e) { console.error(e); }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplateName || selectedCustomers.length === 0) {
            showError('Hata', 'Şablon adı girin ve en az bir müşteri seçin.');
            return;
        }
        setIsProcessing(true);
        try {
            const res = await fetch('/api/field-sales/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newTemplateName,
                    stops: selectedCustomers.map((c, i) => ({ customerId: c.id, sequence: i + 1 }))
                })
            });
            if (res.ok) {
                showSuccess('Başarılı', 'Rota şablonu oluşturuldu.');
                setShowCreateTemplateModal(false);
                setNewTemplateName('');
                setCustomerSearch('');
                setSearchResults([]);
                setSelectedCustomers([]);
                fetchData();
            } else {
                showError('Hata', 'Şablon oluşturulamadı.');
            }
        } catch (e) {
            showError('Hata', 'Şablon oluşturulamadı.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteTemplate = async (template: any) => {
        showConfirm(
            'Şablonu Sil',
            `"${template.name}" şablonunu silmek istediğinize emin misiniz?`,
            async () => {
                try {
                    const res = await fetch(`/api/field-sales/templates/${template.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showSuccess('Silindi', 'Şablon silindi.');
                        fetchData();
                    } else {
                        showError('Hata', 'Şablon silinemedi.');
                    }
                } catch (e) { showError('Hata', 'Bir hata oluştu.'); }
            }
        );
    };

    const handleRenameTemplate = async () => {
        if (!editingTemplate || !editTemplateName.trim()) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/field-sales/templates/${editingTemplate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editTemplateName })
            });
            if (res.ok) {
                showSuccess('Güncellendi', 'Şablon adı değiştirildi.');
                setEditingTemplate(null);
                fetchData();
            } else {
                showError('Hata', 'Güncellenemedi.');
            }
        } catch (e) { showError('Hata', 'Bir hata oluştu.'); }
        finally { setIsProcessing(false); }
    };

    const handleDeleteRoute = (route: any) => {
        showConfirm(
            'Rotayı Sil',
            `"${route.name}" rotasını silmek istediğinize emin misiniz?`,
            async () => {
                try {
                    const res = await fetch(`/api/field-sales/routes/${route.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showSuccess('Silindi', 'Rota silindi.');
                        fetchData();
                    } else {
                        showError('Hata', 'Rota silinemedi.');
                    }
                } catch (e) { showError('Hata', 'Bir hata oluştu.'); }
            }
        );
    };

    useEffect(() => {
        if (!isLoading && !isAuthenticated) { router.push('/login'); return; }
        fetchData();
    }, [isLoading, isAuthenticated, router]);

    const fetchData = async () => {
        try {
            const [routesRes, staffRes, templatesRes, campaignsRes] = await Promise.all([
                fetch('/api/field-sales/routes'),
                fetch('/api/staff'),
                fetch('/api/field-sales/templates'),
                fetch('/api/campaigns'),
            ]);

            if (routesRes.ok) setRoutes(await routesRes.json());
            if (staffRes.ok) {
                const data = await staffRes.json();
                setStaffList(Array.isArray(data) ? data : (data.staff || []));
            }
            if (templatesRes.ok) setTemplates(await templatesRes.json());
            if (campaignsRes.ok) {
                const data = await campaignsRes.json();
                const camps = Array.isArray(data) ? data : (data.campaigns || []);
                const now = new Date();
                setActiveCampaigns(camps.filter((c: any) => c.isActive && (!c.endDate || new Date(c.endDate) >= now)));
            }
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    const getMonday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    };

    const addDays = (d: Date, days: number) => {
        const result = new Date(d);
        result.setDate(result.getDate() + days);
        return result;
    };

    const weekStart = useMemo(() => getMonday(currentDate), [currentDate]);
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    const formatDay = (date: Date) => date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' });

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const handleAssignTemplate = async () => {
        if (!selectedDay || !selectedStaffId || !selectedTemplateId) {
            showError('Hata', 'Tarih, personel ve şablon seçiniz.');
            return;
        }
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) return;

        setIsProcessing(true);
        try {
            const routeRes = await fetch('/api/field-sales/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${template.name} - ${formatDay(selectedDay)}`,
                    staffId: selectedStaffId,
                    date: selectedDay.toISOString()
                })
            });

            if (routeRes.ok) {
                const newRoute = await routeRes.json();
                const stopsRes = await fetch(`/api/field-sales/routes/${newRoute.id}/stops/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        stops: template.stops.map((s: any) => ({ customerId: s.customerId, sequence: s.sequence }))
                    })
                });

                if (stopsRes.ok) {
                    showSuccess('Planlandı', 'Rota başarıyla atandı.');
                    setShowAssignModal(false);
                    fetchData();
                } else {
                    showError('Hata', 'Duraklar eklenemedi.');
                }
            }
        } catch (error) {
            showError('Hata', 'Planlama sırasında bir hata oluştu.');
        } finally {
            setIsProcessing(false);
        }
    };

    const sahaStaff = staffList.filter(s =>
        s.role?.includes('Saha') || s.role?.includes('Satış') || s.role?.includes('Müdür') || s.role?.includes('saha')
    );

    // Styling constants
    const textMain = isLight ? 'text-slate-900' : 'text-slate-100';
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
    const bgPage = isLight ? 'min-h-screen bg-slate-50' : 'min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617] to-[#020617]';
    const bgCard = isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/5';
    const bgSurface = isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/5';
    const borderColor = isLight ? 'border-slate-200' : 'border-white/5';

    if (loading) return (
        <div className={`${bgPage} p-20 flex flex-col items-center justify-center`}>
            <div className={`w-12 h-12 rounded-full border-4 border-t-blue-600 animate-spin mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}></div>
            <div className={`text-[12px] font-bold uppercase tracking-widest ${textMuted}`}>Planlama Panosu Hazırlanıyor...</div>
        </div>
    );

    return (
        <div data-pos-theme={theme} className={`${bgPage} font-sans transition-colors duration-300 p-8`}>
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* HEADER (Premium Header Strip) */}
                <header className="flex flex-col gap-1">
                    <h1 className={`text-[30px] font-bold tracking-tight flex items-center gap-3 ${textMain}`}>
                        {/* Soft subtle icon representation */}
                        <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
                            <Map size={20} strokeWidth={2.5} />
                        </div>
                        Saha Planlama Panosu
                    </h1>
                    <div className="flex items-center gap-3 mt-1 ml-14">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-semibold ${isLight ? 'bg-white border-slate-200 text-slate-600 shadow-sm' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                            <Circle size={8} className="fill-blue-500 text-blue-500" />
                            <span>{routes.length} Rota</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-semibold ${isLight ? 'bg-white border-slate-200 text-slate-600 shadow-sm' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                            <Circle size={8} className="fill-emerald-500 text-emerald-500" />
                            <span>{templates.length} Şablon</span>
                        </div>
                    </div>
                </header>

                {/* ACTION BAR (Horizontal Control Bar) */}
                <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 rounded-[16px] border shadow-sm ${bgCard}`}>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Ayarlar & Talepler (Sadece Admin) */}
                        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                            <button
                                onClick={() => router.push('/field-sales/admin/config')}
                                className={`h-10 px-4 rounded-[12px] border text-[13px] font-semibold transition-all flex items-center gap-2 ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20'}`}
                            >
                                <Settings size={16} /> Saha Ayarları
                            </button>
                        )}

                        {/* Kampanya Oluştur Linki - Primary but blue/soft instead of orange */}
                        <a
                            href="/settings?tab=campaigns"
                            className={`h-10 px-4 rounded-[12px] border text-[13px] font-semibold transition-all flex items-center gap-2 ${isLight ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'}`}
                        >
                            <Target size={16} /> Kampanya Oluştur
                        </a>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Month Navigator (Segmented) */}
                        <div className={`flex items-center p-1 rounded-[12px] border shadow-sm ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#1e293b] border-white/5'}`}>
                            <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className={`w-8 h-8 flex items-center justify-center rounded-[8px] transition-all ${isLight ? 'hover:bg-white text-slate-600' : 'hover:bg-slate-800 text-slate-400'}`}>
                                <ChevronLeft size={16} />
                            </button>
                            <div className={`px-4 text-[13px] font-bold uppercase tracking-wide ${textMain}`}>
                                {weekStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                            </div>
                            <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className={`w-8 h-8 flex items-center justify-center rounded-[8px] transition-all ${isLight ? 'hover:bg-white text-slate-600' : 'hover:bg-slate-800 text-slate-400'}`}>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowCreateTemplateModal(true)}
                            className={`h-10 px-5 rounded-[12px] text-[13px] font-bold transition-all shadow-sm flex items-center gap-2 ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                        >
                            <Plus size={16} strokeWidth={2.5} /> Yeni Şablon
                        </button>
                    </div>
                </div>

                {/* Aktif Kampanya Banner - Updated to avoid orange */}
                {activeCampaigns.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                        {activeCampaigns.slice(0, 3).map(camp => (
                            <div key={camp.id} className={`flex items-center gap-3 border rounded-[12px] px-4 py-3 shadow-sm ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                <Target size={16} className={isLight ? 'text-blue-600' : 'text-blue-400'} />
                                <div>
                                    <span className={`text-[13px] font-semibold ${isLight ? 'text-blue-800' : 'text-blue-300'}`}>{camp.name}</span>
                                    {camp.targetCustomerCategoryIds?.length > 0 && (
                                        <span className={`ml-2 text-[11px] font-medium ${isLight ? 'text-blue-600/70' : 'text-blue-400/50'}`}>• {camp.targetCustomerCategoryIds.join(', ')}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {activeCampaigns.length > 3 && (
                            <div className={`flex items-center gap-2 border rounded-[12px] px-4 py-3 shadow-sm ${bgSurface}`}>
                                <span className={`text-[12px] font-semibold ${textMuted}`}>+{activeCampaigns.length - 3} kampanya daha</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-[3fr_9fr] gap-8 items-start">

                    {/* Left Panel - Templates */}
                    <div className="space-y-6">
                        <div className={`rounded-[20px] border shadow-sm p-5 sm:p-6 ${bgCard}`}>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className={`text-[16px] font-semibold ${textMain}`}>Rota Şablonları</h3>
                                <button
                                    onClick={() => setShowCreateTemplateModal(true)}
                                    className={`text-[12px] font-semibold px-3 py-1.5 rounded-[8px] transition-all border ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                                >
                                    + Yeni
                                </button>
                            </div>

                            <div className="space-y-3">
                                {templates.map(template => (
                                    <div
                                        key={template.id}
                                        draggable
                                        onDragStart={(e) => { e.dataTransfer.setData('templateId', template.id); }}
                                        className={`p-4 rounded-[14px] border transition-all group flex items-start justify-between gap-3 cursor-grab hover:scale-[1.01] hover:shadow-sm ${isLight ? 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-white' : 'bg-white/[0.02] border-white/5 hover:border-blue-500/40 hover:bg-white/[0.04]'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-semibold text-[14px] truncate transition-colors ${isLight ? 'group-hover:text-blue-600 text-slate-800' : 'group-hover:text-blue-400 text-slate-200'}`}>
                                                {template.name}
                                            </div>
                                            <div className={`text-[11px] font-medium uppercase tracking-wide mt-1 flex items-center gap-1.5 ${textMuted}`}>
                                                <MapPin size={10} /> {template.stops?.length || 0} durak
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingTemplate(template); setEditTemplateName(template.name); }}
                                                className={`w-7 h-7 rounded-[8px] flex items-center justify-center transition-all ${isLight ? 'text-slate-500 hover:bg-blue-50 hover:text-blue-600' : 'text-slate-400 hover:bg-blue-500/20 hover:text-blue-400'}`}
                                                title="Düzenle"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template); }}
                                                className={`w-7 h-7 rounded-[8px] flex items-center justify-center transition-all ${isLight ? 'text-slate-500 hover:bg-red-50 hover:text-red-500' : 'text-slate-400 hover:bg-red-500/20 hover:text-red-400'}`}
                                                title="Sil"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {templates.length === 0 && (
                                    <div className={`py-10 text-center border-2 border-dashed rounded-[16px] flex flex-col items-center gap-2 ${isLight ? 'border-slate-200 text-slate-400' : 'border-white/10 text-white/30'}`}>
                                        <Map size={24} className="opacity-50" />
                                        <span className="text-[12px] font-semibold uppercase tracking-wide">Henüz şablon yok</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className={`p-5 rounded-[16px] border flex items-start gap-4 ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/5 border-blue-500/10'}`}>
                            <Info size={18} className={`shrink-0 mt-0.5 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                            <p className={`text-[12px] leading-relaxed font-medium ${isLight ? 'text-blue-800' : 'text-blue-200/70'}`}>
                                Soldaki rota şablonunu, sağdaki takvimde bir personelin kutucuğuna <strong className="font-bold">sürükleyip bırakarak</strong> hızlı atama yapabilirsiniz.
                            </p>
                        </div>
                    </div>

                    {/* Right Panel - Weekly Board */}
                    <div className={`rounded-[24px] border shadow-sm flex flex-col overflow-hidden ${bgCard}`}>

                        {/* Day Headers */}
                        <div className={`grid grid-cols-8 border-b ${borderColor}`}>
                            <div className={`p-4 flex flex-col items-center justify-center border-r ${borderColor} ${isLight ? 'bg-slate-50' : 'bg-white/[0.02]'}`}>
                                <Calendar size={20} className={textMuted} />
                            </div>
                            {weekDays.map((day, idx) => (
                                <div key={idx} className={`p-4 text-center border-r last:border-0 ${borderColor} ${isToday(day) ? (isLight ? 'bg-blue-50/50' : 'bg-blue-500/5') : ''}`}>
                                    <div className={`text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${isToday(day) ? (isLight ? 'text-blue-600' : 'text-blue-400') : textMuted}`}>
                                        {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                                    </div>
                                    <div className={`text-[18px] font-bold ${isToday(day) ? (isLight ? 'text-blue-700' : 'text-white') : textMain}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Staff Rows */}
                        <div className={`divide-y ${borderColor}`}>
                            {sahaStaff.length === 0 ? (
                                <div className="p-16 flex flex-col items-center justify-center text-center opacity-60">
                                    <Users size={32} className={`mb-3 ${textMuted}`} />
                                    <div className={`text-[14px] font-semibold ${textMain}`}>Saha personeli bulunamadı</div>
                                    <div className={`text-[12px] mt-1 ${textMuted}`}>İşleme devam etmek için personel ekleyin.</div>
                                </div>
                            ) : (
                                sahaStaff.map((staff) => (
                                    <div key={staff.id} className="grid grid-cols-8 min-h-[140px] group transition-all">

                                        {/* Staff Info Column */}
                                        <div className={`p-4 border-r flex flex-col justify-center items-center gap-3 transition-all ${borderColor} ${isLight ? 'bg-slate-50 group-hover:bg-slate-100' : 'bg-white/[0.01] group-hover:bg-white/[0.03]'}`}>
                                            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center font-bold text-[16px] shadow-sm ${isLight ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                                {staff.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="text-center w-full px-1">
                                                <div className={`text-[12px] font-bold truncate ${textMain}`}>{staff.name}</div>
                                                <div className={`text-[10px] font-semibold uppercase tracking-wide mt-1 ${textMuted}`}>
                                                    {routes.filter(r => r.staffId === staff.id && weekDays.some(d => {
                                                        const rd = new Date(r.date);
                                                        return rd.getDate() === d.getDate() && rd.getMonth() === d.getMonth();
                                                    })).length}/7 GÜN
                                                </div>
                                            </div>
                                        </div>

                                        {/* Day Cells */}
                                        {weekDays.map((day, idx) => {
                                            const dayRoutes = routes.filter(r => {
                                                const rDate = new Date(r.date);
                                                return rDate.getDate() === day.getDate() &&
                                                    rDate.getMonth() === day.getMonth() &&
                                                    r.staffId === staff.id;
                                            });
                                            const totalStops = dayRoutes.reduce((sum: number, r: any) => sum + (r._count?.stops || 0), 0);

                                            return (
                                                <div
                                                    key={idx}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        e.currentTarget.classList.add('drag-over-active');
                                                    }}
                                                    onDragLeave={(e) => {
                                                        e.currentTarget.classList.remove('drag-over-active');
                                                    }}
                                                    onDrop={(e) => {
                                                        e.currentTarget.classList.remove('drag-over-active');
                                                        const tid = e.dataTransfer.getData('templateId');
                                                        if (tid) {
                                                            setSelectedDay(day);
                                                            setSelectedStaffId(staff.id);
                                                            setSelectedTemplateId(tid);
                                                            setShowAssignModal(true);
                                                        }
                                                    }}
                                                    className={`p-3 border-r last:border-0 transition-all relative flex flex-col gap-2 drag-target-cell ${borderColor} ${isToday(day) ? (isLight ? 'bg-blue-50/20' : 'bg-blue-500/[0.02]') : ''}`}
                                                >


                                                    {dayRoutes.map(route => (
                                                        <div
                                                            key={route.id}
                                                            className={`p-2.5 rounded-[12px] border transition-all text-left group/card relative shadow-sm ${route.status === 'COMPLETED'
                                                                ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300')
                                                                : route.status === 'ACTIVE'
                                                                    ? (isLight ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-blue-100' : 'bg-blue-900/40 border-blue-500/50 text-blue-200')
                                                                    : (isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-800/50 border-slate-700 text-slate-300')
                                                                }`}
                                                        >
                                                            <div
                                                                onClick={() => router.push(`/field-sales/admin/routes/${route.id}`)}
                                                                className="cursor-pointer"
                                                            >
                                                                <div className="text-[11px] font-bold truncate pr-6">{route.name}</div>
                                                                <div className={`flex items-center justify-between text-[10px] font-semibold uppercase mt-1 opacity-80`}>
                                                                    <div className="flex items-center gap-1">
                                                                        <MapPin size={10} /> {route._count?.stops || 0}
                                                                    </div>
                                                                    {route.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                                                                    {route.status === 'ACTIVE' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                                                                </div>
                                                            </div>
                                                            {/* Delete Button */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteRoute(route); }}
                                                                className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-[6px] flex items-center justify-center text-[12px] opacity-0 group-hover/card:opacity-100 transition-all ${isLight ? 'bg-white border border-slate-200 text-red-500 hover:bg-red-50' : 'bg-slate-800 border border-slate-700 text-red-400 hover:bg-red-500/20'}`}
                                                                title="Rotayı Sil"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Total points summary */}
                                                    {totalStops > 0 && dayRoutes.length > 1 && (
                                                        <div className={`text-[10px] font-semibold text-center uppercase tracking-wide mt-1 ${textMuted}`}>
                                                            {totalStops} durak
                                                        </div>
                                                    )}

                                                    {/* Add Route Button */}
                                                    {dayRoutes.length === 0 ? (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDay(day);
                                                                setSelectedStaffId(staff.id);
                                                                setShowAssignModal(true);
                                                            }}
                                                            className={`w-full flex-1 min-h-[70px] flex items-center justify-center rounded-[12px] border-2 border-dashed transition-all group/add ${isLight ? 'border-slate-200 hover:border-blue-400 hover:bg-blue-50' : 'border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5'}`}
                                                        >
                                                            <Plus size={16} className={`transition-colors ${isLight ? 'text-slate-300 group-hover/add:text-blue-500' : 'text-slate-600 group-hover/add:text-blue-400'}`} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDay(day);
                                                                setSelectedStaffId(staff.id);
                                                                setShowAssignModal(true);
                                                            }}
                                                            className={`w-full py-1.5 rounded-[8px] text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${isLight ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'}`}
                                                        >
                                                            <Plus size={10} strokeWidth={3} /> Ekle
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Rota Atama Modalı */}
            {showAssignModal && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 ${isLight ? 'bg-slate-900/40' : 'bg-slate-900/60'}`}>
                    <div className={`w-full max-w-lg overflow-hidden rounded-[24px] border shadow-2xl relative ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                        <div className="p-6 md:p-8 relative z-10">
                            <h2 className={`text-[20px] font-bold mb-1 ${textMain}`}>Rota Ataması</h2>
                            <p className={`text-[13px] font-semibold mb-6 ${textMuted}`}>
                                {selectedDay && formatDay(selectedDay)} • {staffList.find(s => s.id === selectedStaffId)?.name}
                            </p>

                            <div className={`mb-6 p-4 rounded-[12px] border flex items-start gap-3 ${isLight ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-blue-500/10 border-blue-500/20 text-blue-200'}`}>
                                <Info size={16} className="shrink-0 mt-0.5" />
                                <span className="text-[12px] font-medium leading-relaxed">Rota atandıktan sonra takvimde ilgili rotaya tıklayarak durak ekleyebilir veya kaldırabilirsiniz.</span>
                            </div>

                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-wide mb-3 ${textMuted}`}>Bir Rota Şablonu Seçin</label>
                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {templates.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTemplateId(t.id)}
                                            className={`p-4 rounded-[16px] border text-left transition-all flex justify-between items-center ${selectedTemplateId === t.id
                                                ? (isLight ? 'bg-blue-50/50 border-blue-500 shadow-sm' : 'bg-blue-500/10 border-blue-500 shadow-sm')
                                                : (isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-white/[0.02] border-white/10 hover:border-white/20')
                                                }`}
                                        >
                                            <div>
                                                <div className={`font-semibold text-[14px] mb-0.5 ${textMain}`}>{t.name}</div>
                                                <div className={`text-[11px] font-medium flex items-center gap-1.5 ${textMuted}`}>
                                                    <MapPin size={12} /> {t.stops?.length || 0} Durak
                                                </div>
                                            </div>
                                            {selectedTemplateId === t.id && (
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isLight ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                                                    <Check size={12} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    {templates.length === 0 && (
                                        <div className={`p-8 text-center text-[12px] font-medium border border-dashed rounded-[16px] ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                                            Önce bir şablon oluşturun.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 flex gap-3">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className={`flex-1 h-12 rounded-[12px] font-bold text-[13px] border transition-all ${isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleAssignTemplate}
                                    disabled={isProcessing || !selectedTemplateId}
                                    className={`flex-[2] h-12 rounded-[12px] font-bold text-[13px] text-white transition-all disabled:opacity-50 ${isLight ? 'bg-blue-600 hover:bg-blue-700 shadow-sm' : 'bg-blue-600 hover:bg-blue-500'}`}
                                >
                                    {isProcessing ? 'Atanıyor...' : 'Planlamayı Kaydet'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Şablon Oluştur Modalı */}
            {showCreateTemplateModal && (
                <div className={`fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 ${isLight ? 'bg-slate-900/60' : 'bg-slate-900/80'}`}>
                    <div className={`w-full max-w-4xl overflow-hidden rounded-[24px] border shadow-2xl flex flex-col max-h-[90vh] ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                        <div className={`p-6 md:p-8 flex-1 overflow-y-auto ${isLight ? 'bg-slate-50' : 'bg-[#020617]'}`}>
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className={`text-[24px] font-bold tracking-tight mb-1 ${textMain}`}>Yeni Rota Şablonu</h2>
                                    <p className={`text-[13px] font-medium ${textMuted}`}>
                                        Rutin saha operasyonları için hazır durak setleri oluşturun.
                                    </p>
                                </div>
                                <button onClick={() => setShowCreateTemplateModal(false)} className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-all ${isLight ? 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className={`block text-[11px] font-bold uppercase tracking-wide ml-1 ${textMuted}`}>Şablon Adı</label>
                                        <input
                                            type="text"
                                            value={newTemplateName}
                                            onChange={(e) => setNewTemplateName(e.target.value)}
                                            placeholder="Örn: Salı — İstoç / Bursa Rutu"
                                            className={`w-full h-[48px] px-4 rounded-[12px] border text-[14px] font-semibold transition-all outline-none shadow-sm ${isLight ? 'bg-white border-slate-200 focus:border-blue-500 text-slate-900 placeholder:text-slate-400' : 'bg-white/[0.02] border-white/10 focus:border-blue-500/50 text-white placeholder:text-slate-500'}`}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className={`block text-[11px] font-bold uppercase tracking-wide ml-1 ${textMuted}`}>Müşteri Ara & Ekle</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={customerSearch}
                                                onChange={(e) => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                                                placeholder="Müşteri adı veya unvanı ara..."
                                                className={`w-full h-[48px] pl-10 pr-4 rounded-[12px] border text-[13px] transition-all outline-none shadow-sm ${isLight ? 'bg-white border-slate-200 focus:border-blue-500 text-slate-900 placeholder:text-slate-400' : 'bg-white/[0.02] border-white/10 focus:border-blue-500/50 text-white placeholder:text-slate-500'}`}
                                            />
                                            <Search size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
                                        </div>

                                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                            {searchResults.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        if (!selectedCustomers.find(sc => sc.id === c.id)) {
                                                            setSelectedCustomers([...selectedCustomers, c]);
                                                        }
                                                        setCustomerSearch('');
                                                        setSearchResults([]);
                                                    }}
                                                    className={`w-full p-4 rounded-[12px] border text-left transition-all flex justify-between items-center group ${isLight ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm' : 'bg-white/[0.02] border-white/10 hover:border-blue-500/40'}`}
                                                >
                                                    <div>
                                                        <div className={`text-[14px] font-semibold truncate ${textMain}`}>{c.name}</div>
                                                        <div className={`text-[11px] font-medium mt-1 ${textMuted}`}>{c.city} / {c.district}</div>
                                                    </div>
                                                    <span className={`text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>+ Ekle</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex flex-col rounded-[20px] border shadow-sm p-6 ${bgCard}`}>
                                    <div className="flex justify-between items-center mb-5">
                                        <h3 className={`text-[13px] font-bold uppercase tracking-wide ${textMuted}`}>Rota Akışı ({selectedCustomers.length})</h3>
                                        <button onClick={() => setSelectedCustomers([])} className={`text-[11px] font-bold uppercase transition-colors ${isLight ? 'text-slate-400 hover:text-red-500' : 'text-slate-500 hover:text-red-400'}`}>
                                            Tümünü Temizle
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                        {selectedCustomers.map((c, i) => (
                                            <div key={c.id} className={`p-3 rounded-[12px] border flex items-center gap-4 group transition-all ${isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                                                <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center font-bold text-[12px] flex-shrink-0 ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-[13px] font-semibold truncate ${textMain}`}>{c.name}</div>
                                                    <div className={`text-[11px] font-medium truncate ${textMuted}`}>{c.city}</div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedCustomers(selectedCustomers.filter(sc => sc.id !== c.id))}
                                                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${isLight ? 'text-slate-400 hover:bg-red-50 hover:text-red-500' : 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'}`}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {selectedCustomers.length === 0 && (
                                            <div className={`h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-[16px] ${isLight ? 'border-slate-200 text-slate-400' : 'border-white/10 text-white/30'}`}>
                                                <MapPin size={32} className="mb-3 opacity-30" />
                                                <div className="text-[12px] font-semibold uppercase tracking-wide">Henüz durak eklenmedi</div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleCreateTemplate}
                                        disabled={isProcessing || selectedCustomers.length === 0}
                                        className={`mt-6 w-full h-12 rounded-[12px] font-bold text-[13px] text-white uppercase tracking-wide transition-all disabled:opacity-50 ${isLight ? 'bg-blue-600 hover:bg-blue-700 shadow-sm' : 'bg-blue-600 hover:bg-blue-500'}`}
                                    >
                                        {isProcessing ? 'Kaydediliyor...' : 'Şablonu Oluştur'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Şablon Adı Düzenleme Modalı */}
            {editingTemplate && (
                <div className={`fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 ${isLight ? 'bg-slate-900/40' : 'bg-slate-900/60'}`}>
                    <div className={`w-full max-w-md overflow-hidden rounded-[24px] border shadow-2xl p-6 md:p-8 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-[20px] font-bold ${textMain}`}>Adı Değiştir</h2>
                            <button onClick={() => setEditingTemplate(null)} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-slate-400'}`}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <input
                                type="text"
                                autoFocus
                                value={editTemplateName}
                                onChange={e => setEditTemplateName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleRenameTemplate()}
                                className={`w-full h-[48px] px-4 rounded-[12px] border text-[14px] font-medium transition-all outline-none shadow-sm ${isLight ? 'bg-white border-slate-200 focus:border-blue-500 text-slate-900' : 'bg-white/[0.02] border-white/10 focus:border-blue-500/50 text-white'}`}
                                placeholder="Yeni şablon adı..."
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditingTemplate(null)}
                                    className={`flex-1 h-12 rounded-[12px] font-bold text-[13px] border transition-all ${isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleRenameTemplate}
                                    disabled={isProcessing || !editTemplateName.trim()}
                                    className={`flex-[2] h-12 rounded-[12px] font-bold text-[13px] text-white transition-all disabled:opacity-50 ${isLight ? 'bg-blue-600 hover:bg-blue-700 shadow-sm' : 'bg-blue-600 hover:bg-blue-500'}`}
                                >
                                    {isProcessing ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
                [data-pos-theme="dark"] .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
                [data-pos-theme="dark"] .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
                
                .drag-target-cell.drag-over-active {
                    background-color: rgba(59, 130, 246, 0.05);
                    box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.4);
                }
                [data-pos-theme="dark"] .drag-target-cell.drag-over-active {
                    background-color: rgba(59, 130, 246, 0.1);
                }
            `}</style>
        </div>
    );
}
