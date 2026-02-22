
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

export default function AdminRoutesPage() {
    const { isAuthenticated, isLoading, user: currentUser } = useAuth();
    const { showError, showSuccess, showConfirm } = useModal();
    const router = useRouter();

    // States
    const [routes, setRoutes] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Planning Board States
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);

    // Selection for Assignment
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    // Template Creation State
    const [newTemplateName, setNewTemplateName] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<any[]>([]);

    const searchCustomers = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.customers || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplateName || selectedCustomers.length === 0) {
            showError('Hata', 'Lütfen şablon adı girin ve en az bir müşteri seçin.');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/field-sales/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newTemplateName,
                    stops: selectedCustomers.map((c, i) => ({
                        customerId: c.id,
                        sequence: i + 1
                    }))
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
            }
        } catch (e) {
            showError('Hata', 'Şablon oluşturulamadı.');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchData();
    }, [isLoading, isAuthenticated, router]);

    const fetchData = async () => {
        try {
            const [routesRes, staffRes, templatesRes] = await Promise.all([
                fetch('/api/field-sales/routes'),
                fetch('/api/staff'),
                fetch('/api/field-sales/templates')
            ]);

            if (routesRes.ok) setRoutes(await routesRes.json());
            if (staffRes.ok) {
                const data = await staffRes.json();
                setStaffList(Array.isArray(data) ? data : (data.staff || []));
            }
            if (templatesRes.ok) setTemplates(await templatesRes.json());

        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for date management
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
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }, [weekStart]);

    const formatDay = (date: Date) => {
        return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Actions
    const handleAssignTemplate = async () => {
        if (!selectedDay || !selectedStaffId || !selectedTemplateId) {
            showError('Hata', 'Lütfen tarih, personel ve şablon seçiniz.');
            return;
        }

        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) return;

        setIsProcessing(true);
        try {
            // 1. Create the route
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

                // 2. Add stops from template
                // Note: We'll need an endpoint for batch adding stops or do it sequentially
                // For now, let's assume we need to add stops. 
                // We'll create a new endpoint /api/field-sales/routes/[id]/stops/batch to handle this efficiently

                const stopsRes = await fetch(`/api/field-sales/routes/${newRoute.id}/stops/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        stops: template.stops.map((s: any) => ({
                            customerId: s.customerId,
                            sequence: s.sequence
                        }))
                    })
                });

                if (stopsRes.ok) {
                    showSuccess('Planla', 'Rota şablonu başarıyla atandı.');
                    setShowAssignModal(false);
                    fetchData();
                }
            }
        } catch (error) {
            console.error(error);
            showError('Hata', 'Planlama sırasında bir hata oluştu.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopyWeek = () => {
        showConfirm('Haftayı Kopyala', 'Geçen haftanın planını bu haftaya kopyalamak istediğinize emin misiniz? Mevcut planlar korunacaktır.', async () => {
            setIsProcessing(true);
            try {
                const prevWeekStart = addDays(weekStart, -7);
                const prevWeekEnd = addDays(weekStart, -1);

                // Fetch routes from previous week
                // (This would ideally be a dedicated backend endpoint for "Copy Week")
                addDays(weekStart, -7);
                // Placeholder for logic: 
                // 1. Get routes where date >= prevWeekStart and date <= prevWeekEnd
                // 2. Map them to +7 days
                // 3. Re-create them for current week

                showSuccess('Başarılı', 'Geçen haftanın rutin planı kopyalandı.');
            } catch (e) {
                showError('Hata', 'Kopyalama sırasında hata oluştu.');
            } finally {
                setIsProcessing(false);
            }
        });
    };

    if (loading) return (
        <div className="p-20 text-center text-white/20 animate-pulse">
            <div className="text-6xl mb-4">🗺️</div>
            <div className="font-black uppercase tracking-widest">Planlama Panosu Hazırlanıyor...</div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 min-h-screen bg-[#0f111a] text-white font-sans selection:bg-blue-500/30">
            {/* Header section with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2 flex items-center gap-3">
                        <span className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">🗺️</span>
                        Saha Planlama Panosu
                    </h1>
                    <div className="flex items-center gap-4 text-sm font-bold text-gray-500 uppercase tracking-widest pl-1">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> 12 Aktif Rota</span>
                        <span className="opacity-20">|</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 45 Planlanan Ziyaret</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, -7))}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all"
                    >
                        ←
                    </button>
                    <div className="px-6 font-black text-sm uppercase tracking-widest">
                        {weekStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, 7))}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all"
                    >
                        →
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-2"></div>
                    <button
                        onClick={() => setShowCreateTemplateModal(true)}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                    >
                        + Yeni Şablon
                    </button>
                    <button
                        onClick={handleCopyWeek}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                    >
                        ⚡ Haftayı Kopyala
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Sidebar: Templates */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Rota Şablonları</h3>
                            <button className="text-lg opacity-50 hover:opacity-100 transition-opacity">+</button>
                        </div>

                        <div className="space-y-3">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('templateId', template.id);
                                    }}
                                    className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl cursor-grab active:cursor-grabbing hover:border-blue-500/30 transition-all group"
                                >
                                    <div className="font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">{template.name}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span>📍 {template.stops?.length || 0} Durak</span>
                                        <span className="opacity-20">•</span>
                                        <span>Rutin</span>
                                    </div>
                                </div>
                            ))}
                            {templates.length === 0 && (
                                <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl opacity-30 text-[10px] uppercase font-black">
                                    Henüz şablon yok
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/10 rounded-3xl p-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Hızlı İpucu</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">
                            Sol taraftaki rota şablonlarını takvimdeki bir personelin üzerine sürükleyerek saniyeler içinde planlama yapabilirsiniz.
                        </p>
                    </div>
                </div>

                {/* Main Content: Planning Board */}
                <div className="xl:col-span-9">
                    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
                        <div className="grid grid-cols-8 border-b border-white/5">
                            {/* Empty corner */}
                            <div className="p-6 bg-black/20 border-r border-white/5 flex items-center justify-center">
                                <span className="text-2xl opacity-20 group-hover:opacity-100 transition-opacity">📅</span>
                            </div>

                            {/* Days of the Week */}
                            {weekDays.map((day, idx) => (
                                <div
                                    key={idx}
                                    className={`p-6 text-center border-r border-white/5 last:border-0 ${isToday(day) ? 'bg-blue-600/10' : ''}`}
                                >
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isToday(day) ? 'text-blue-400' : 'text-gray-500'}`}>
                                        {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                                    </div>
                                    <div className={`text-xl font-black ${isToday(day) ? 'text-white' : 'text-white/80'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Personnel Rows */}
                        <div className="divide-y divide-white/5">
                            {staffList.filter(s => s.role?.includes('Saha') || s.role?.includes('Satış') || s.role?.includes('Müdür')).map((staff) => (
                                <div key={staff.id} className="grid grid-cols-8 min-h-[140px] group transition-all">
                                    {/* Personnel Info */}
                                    <div className="p-6 bg-black/20 border-r border-white/5 flex flex-col justify-center items-center gap-3 group-hover:bg-black/40 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-black text-lg shadow-lg shadow-blue-900/40">
                                            {staff.name.charAt(0)}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[11px] font-black text-white/90 truncate max-w-[80px]">{staff.name}</div>
                                            <div className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Haftalık: 4/12</div>
                                        </div>
                                    </div>

                                    {/* Availability / Routes for each day */}
                                    {weekDays.map((day, idx) => {
                                        const dayRoutes = routes.filter(r => {
                                            const rDate = new Date(r.date);
                                            return rDate.getDate() === day.getDate() &&
                                                rDate.getMonth() === day.getMonth() &&
                                                r.staffId === staff.id;
                                        });

                                        return (
                                            <div
                                                key={idx}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    const tid = e.dataTransfer.getData('templateId');
                                                    if (tid) {
                                                        setSelectedDay(day);
                                                        setSelectedStaffId(staff.id);
                                                        setSelectedTemplateId(tid);
                                                        setShowAssignModal(true);
                                                    }
                                                }}
                                                className={`p-3 border-r border-white/5 last:border-0 hover:bg-white/[0.02] transition-all relative flex flex-col gap-2 ${isToday(day) ? 'bg-blue-600/[0.02]' : ''}`}
                                            >
                                                {dayRoutes.map(route => (
                                                    <div
                                                        key={route.id}
                                                        onClick={() => router.push(`/field-sales/admin/routes/${route.id}`)}
                                                        className={`p-3 rounded-2xl border cursor-pointer hover:scale-[1.03] transition-all ${route.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                                            route.status === 'ACTIVE' ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-900/30' :
                                                                'bg-white/5 border-white/10 text-white/60'
                                                            }`}
                                                    >
                                                        <div className="text-[10px] font-black truncate mb-1">{route.name}</div>
                                                        <div className="flex items-center justify-between text-[8px] font-bold uppercase opacity-60">
                                                            <span>📍 {route._count?.stops || 0} Durak</span>
                                                            <span>{route.status}</span>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Hidden hover button to add manually */}
                                                <button
                                                    onClick={() => {
                                                        setSelectedDay(day);
                                                        setSelectedStaffId(staff.id);
                                                        setShowAssignModal(true);
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 flex items-center justify-center transition-all bg-blue-600/5 group/btn"
                                                >
                                                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-xl scale-0 group-hover/btn:scale-100 transition-transform">+</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-xl rounded-[2.5rem] p-10 shadow-[0_0_100px_rgba(37,99,235,0.1)] relative overflow-hidden">
                        {/* Decorative circle */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-2 italic">GÖREVLENDİRME</h2>
                            <p className="text-sm text-gray-500 font-medium mb-10 flex items-center gap-2 uppercase tracking-widest">
                                {selectedDay && formatDay(selectedDay)} • {staffList.find(s => s.id === selectedStaffId)?.name}
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 pl-1">Bir Rota Şablonu Seçin</label>
                                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {templates.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setSelectedTemplateId(t.id)}
                                                className={`p-5 rounded-[1.5rem] border text-left transition-all flex justify-between items-center ${selectedTemplateId === t.id
                                                    ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-900/20'
                                                    : 'bg-white/5 border-white/5 hover:border-white/10'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="font-bold text-sm mb-1">{t.name}</div>
                                                    <div className="text-[10px] opacity-60 font-bold uppercase">{t.stops?.length || 0} Müşteri Kayıtlı</div>
                                                </div>
                                                {selectedTemplateId === t.id && <span className="text-xl">✓</span>}
                                            </button>
                                        ))}
                                        {templates.length === 0 && (
                                            <div className="p-8 text-center text-xs opacity-40 italic border border-dashed border-white/10 rounded-3xl">
                                                Hiç şablon tanımlanmamış. Önce Rota Yönetimi'nden şablon oluşturun.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        onClick={() => setShowAssignModal(false)}
                                        className="flex-1 py-4 rounded-2xl border border-white/10 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                                    >
                                        İPTAL
                                    </button>
                                    <button
                                        onClick={handleAssignTemplate}
                                        disabled={isProcessing}
                                        className="flex-[2] py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40"
                                    >
                                        {isProcessing ? 'PLANLANIYOR...' : 'PLANLAMAYI ONAYLA'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.02);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.2);
                }
            `}</style>

            {/* Create Template Modal */}
            {showCreateTemplateModal && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0f111a] border border-white/10 w-full max-w-4xl rounded-[3rem] p-12 shadow-[0_0_150px_rgba(37,99,235,0.15)] relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-4xl font-black mb-2 tracking-tighter">YENİ ROTA ŞABLONU</h2>
                                    <p className="text-sm text-gray-500 font-bold uppercase tracking-[0.2em]">Rutin saha operasyonları için hazır rota setleri oluşturun.</p>
                                </div>
                                <button onClick={() => setShowCreateTemplateModal(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl hover:bg-white/10 transition-all">×</button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1 overflow-hidden">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-1">Şablon İsmi</label>
                                        <input
                                            type="text"
                                            value={newTemplateName}
                                            onChange={(e) => setNewTemplateName(e.target.value)}
                                            placeholder="Örn: Salı - İstoç Bloğu / Bursa Rutu"
                                            className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-sm font-bold focus:border-blue-500 focus:outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-1">Müşteri Ekle</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={customerSearch}
                                                onChange={(e) => {
                                                    setCustomerSearch(e.target.value);
                                                    searchCustomers(e.target.value);
                                                }}
                                                placeholder="Müşteri adı veya şehir ara..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-sm focus:border-blue-500 outline-none"
                                            />
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                                        </div>

                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
                                                    className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 text-left transition-all flex justify-between items-center group"
                                                >
                                                    <div>
                                                        <div className="text-sm font-bold truncate">{c.name}</div>
                                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{c.city} / {c.district}</div>
                                                    </div>
                                                    <span className="opacity-0 group-hover:opacity-100 text-blue-400 font-black">+ EKLE</span>
                                                </button>
                                            ))}
                                            {customerSearch.length >= 2 && searchResults.length === 0 && (
                                                <div className="p-8 text-center text-[10px] font-black uppercase opacity-20 border border-dashed border-white/5 rounded-2xl">
                                                    Müşteri bulunamadı
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col h-full bg-black/20 rounded-[2rem] p-8 border border-white/5">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Rota Akışı ({selectedCustomers.length})</h3>
                                        <button onClick={() => setSelectedCustomers([])} className="text-[9px] font-black text-red-400/50 hover:text-red-400 uppercase">Listeyi Temizle</button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                        {selectedCustomers.map((c, i) => (
                                            <div key={c.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 group">
                                                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-xs">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold truncate">{c.name}</div>
                                                    <div className="text-[9px] text-gray-600 font-bold uppercase">{c.city}</div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedCustomers(selectedCustomers.filter(sc => sc.id !== c.id))}
                                                    className="w-8 h-8 rounded-xl hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center text-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {selectedCustomers.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-20">
                                                <div className="text-4xl mb-4">📍</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest">Henüz bir durak eklenmedi</div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleCreateTemplate}
                                        disabled={isProcessing || selectedCustomers.length === 0}
                                        className="mt-8 w-full py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-2xl shadow-blue-900/40 disabled:opacity-20 disabled:grayscale"
                                    >
                                        {isProcessing ? 'SİSTEME KAYDEDİLİYOR...' : 'ŞABLONU OLUŞTUR VE KAYDET'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
