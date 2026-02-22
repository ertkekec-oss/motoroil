
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

export default function AdminRoutesPage() {
    const { isAuthenticated, isLoading, user: currentUser } = useAuth();
    const { showError, showSuccess, showConfirm } = useModal();
    const router = useRouter();

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

    if (loading) return (
        <div className="p-20 text-center text-white/20 animate-pulse">
            <div className="text-6xl mb-4">🗺️</div>
            <div className="font-black uppercase tracking-widest">Planlama Panosu Hazırlanıyor...</div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 min-h-screen bg-[#0f111a] text-white font-sans">

            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2 flex items-center gap-3">
                        <span className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">🗺️</span>
                        Saha Planlama Panosu
                    </h1>
                    <div className="flex items-center gap-4 text-sm font-bold text-gray-500 uppercase tracking-widest pl-1">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            {routes.length} Rota
                        </span>
                        <span className="opacity-20">|</span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {templates.length} Şablon
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Kampanya Oluştur Linki */}
                    <a
                        href="/settings?tab=campaigns"
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all flex items-center gap-2"
                    >
                        🎯 Kampanya Oluştur
                    </a>

                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                        <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all">←</button>
                        <div className="px-4 font-black text-sm uppercase tracking-widest">
                            {weekStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                        </div>
                        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all">→</button>
                    </div>

                    <button
                        onClick={() => setShowCreateTemplateModal(true)}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 transition-all shadow-lg"
                    >
                        + Yeni Şablon
                    </button>
                </div>
            </div>

            {/* Aktif Kampanya Banner */}
            {activeCampaigns.length > 0 && (
                <div className="mb-6 flex gap-3 flex-wrap">
                    {activeCampaigns.slice(0, 3).map(camp => (
                        <div key={camp.id} className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2">
                            <span className="text-sm">🎯</span>
                            <div>
                                <span className="text-[11px] font-black text-orange-400">{camp.name}</span>
                                {camp.targetCustomerCategoryIds?.length > 0 && (
                                    <span className="ml-2 text-[9px] text-orange-400/50">• {camp.targetCustomerCategoryIds.join(', ')}</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {activeCampaigns.length > 3 && (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-2">
                            <span className="text-[11px] font-black text-gray-500">+{activeCampaigns.length - 3} kampanya daha</span>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Sol Sidebar: Şablonlar — SADECE GÖRÜNTÜLEME */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Rota Şablonları</h3>
                            <span className="text-[9px] text-gray-600 font-black uppercase">SADECE GÖRÜNTÜLEME</span>
                        </div>

                        <div className="space-y-3">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    draggable
                                    onDragStart={(e) => { e.dataTransfer.setData('templateId', template.id); }}
                                    className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl cursor-grab active:cursor-grabbing hover:border-blue-500/30 transition-all group"
                                >
                                    <div className="font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">{template.name}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span>📍 {template.stops?.length || 0} Durak</span>
                                        <span className="opacity-20">•</span>
                                        <span>Sürükle & Bırak</span>
                                    </div>
                                    {/* Not: Şablonlar silinemez/düzenlenemez */}
                                </div>
                            ))}
                            {templates.length === 0 && (
                                <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl opacity-30 text-[10px] uppercase font-black">
                                    Henüz şablon yok
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/10 rounded-3xl p-5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Nasıl Kullanılır?</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">
                            Soldaki şablonu, sağdaki takvimde personelin üzerine <strong>sürükleyin</strong> ve bırakın. Rota otomatik atanacaktır.
                        </p>
                    </div>
                </div>

                {/* Sağ: Planlama Takvimi */}
                <div className="xl:col-span-9">
                    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
                        {/* Gün Başlıkları */}
                        <div className="grid grid-cols-8 border-b border-white/5">
                            <div className="p-6 bg-black/20 border-r border-white/5 flex items-center justify-center">
                                <span className="text-2xl opacity-20">📅</span>
                            </div>
                            {weekDays.map((day, idx) => (
                                <div key={idx} className={`p-6 text-center border-r border-white/5 last:border-0 ${isToday(day) ? 'bg-blue-600/10' : ''}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isToday(day) ? 'text-blue-400' : 'text-gray-500'}`}>
                                        {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                                    </div>
                                    <div className={`text-xl font-black ${isToday(day) ? 'text-white' : 'text-white/80'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Personel Satırları */}
                        <div className="divide-y divide-white/5">
                            {sahaStaff.length === 0 ? (
                                <div className="p-12 text-center opacity-30">
                                    <div className="text-4xl mb-3">👤</div>
                                    <div className="text-sm font-black uppercase tracking-widest">Saha personeli bulunamadı</div>
                                </div>
                            ) : (
                                sahaStaff.map((staff) => (
                                    <div key={staff.id} className="grid grid-cols-8 min-h-[130px] group transition-all">
                                        {/* Personel Bilgisi */}
                                        <div className="p-5 bg-black/20 border-r border-white/5 flex flex-col justify-center items-center gap-2 group-hover:bg-black/40 transition-all">
                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-black text-base shadow-lg shadow-blue-900/40">
                                                {staff.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[11px] font-black text-white/90 truncate max-w-[72px]">{staff.name}</div>
                                                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">
                                                    {routes.filter(r => r.staffId === staff.id && weekDays.some(d => {
                                                        const rd = new Date(r.date);
                                                        return rd.getDate() === d.getDate() && rd.getMonth() === d.getMonth();
                                                    })).length}/7 gün
                                                </div>
                                            </div>
                                        </div>

                                        {/* Günlük Rota Hücreleri */}
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
                                                    className={`p-2 border-r border-white/5 last:border-0 hover:bg-white/[0.02] transition-all relative flex flex-col gap-1.5 ${isToday(day) ? 'bg-blue-600/[0.02]' : ''}`}
                                                >
                                                    {dayRoutes.map(route => (
                                                        <div
                                                            key={route.id}
                                                            onClick={() => router.push(`/field-sales/admin/routes/${route.id}`)}
                                                            className={`p-2.5 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-all text-left ${route.status === 'COMPLETED'
                                                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                                : route.status === 'ACTIVE'
                                                                    ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-900/30'
                                                                    : 'bg-white/5 border-white/10 text-white/60'
                                                                }`}
                                                        >
                                                            <div className="text-[9px] font-black truncate">{route.name}</div>
                                                            <div className="flex items-center justify-between text-[8px] font-bold uppercase opacity-60 mt-0.5">
                                                                <span>📍 {route._count?.stops || 0}</span>
                                                                {route.status === 'COMPLETED' && <span>✅</span>}
                                                                {route.status === 'ACTIVE' && <span className="animate-pulse">🟢</span>}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Nokta adedi özeti */}
                                                    {totalStops > 0 && dayRoutes.length > 1 && (
                                                        <div className="text-[8px] text-gray-600 font-black text-center">
                                                            toplam {totalStops} durak
                                                        </div>
                                                    )}

                                                    {/* Hover: Rota Ekle Butonu */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDay(day);
                                                            setSelectedStaffId(staff.id);
                                                            setShowAssignModal(true);
                                                        }}
                                                        className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 flex items-end justify-center pb-2 transition-all bg-blue-600/5"
                                                    >
                                                        <span className="text-[8px] font-black text-blue-400/50 uppercase">+ Rota Ekle</span>
                                                    </button>
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
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-1 italic">ROTA ATAMASI</h2>
                            <p className="text-sm text-gray-500 font-medium mb-8 uppercase tracking-widest">
                                {selectedDay && formatDay(selectedDay)} • {staffList.find(s => s.id === selectedStaffId)?.name}
                            </p>

                            {/* Politika notu */}
                            <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-[10px] text-blue-400/60 font-bold uppercase tracking-widest flex items-center gap-2">
                                <span>ℹ️</span> Rotalar yalnızca eklenebilir. Oluşturulduktan sonra değiştirilemez ve silinemez.
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Bir Rota Şablonu Seçin</label>
                                <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
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
                                                <div className="font-bold text-sm mb-0.5">{t.name}</div>
                                                <div className="text-[10px] opacity-60 font-bold uppercase">{t.stops?.length || 0} Müşteri</div>
                                            </div>
                                            {selectedTemplateId === t.id && <span className="text-xl">✓</span>}
                                        </button>
                                    ))}
                                    {templates.length === 0 && (
                                        <div className="p-8 text-center text-xs opacity-40 italic border border-dashed border-white/10 rounded-3xl">
                                            Önce şablon oluşturun.
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
                                    disabled={isProcessing || !selectedTemplateId}
                                    className="flex-[2] py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40 disabled:opacity-40"
                                >
                                    {isProcessing ? 'ATANIYOR...' : 'PLANLAMA YAP'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Şablon Oluştur Modalı */}
            {showCreateTemplateModal && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[110] flex items-center justify-center p-4">
                    <div className="bg-[#0f111a] border border-white/10 w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black mb-1 tracking-tighter">YENİ ROTA ŞABLONU</h2>
                                    <p className="text-sm text-gray-500 font-bold uppercase tracking-[0.2em]">
                                        Rutin saha operasyonları için durak setleri oluşturun.
                                    </p>
                                </div>
                                <button onClick={() => setShowCreateTemplateModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl hover:bg-white/10 transition-all">×</button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-1">Şablon İsmi</label>
                                        <input
                                            type="text"
                                            value={newTemplateName}
                                            onChange={(e) => setNewTemplateName(e.target.value)}
                                            placeholder="Örn: Salı — İstoç / Bursa Rutu"
                                            className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-4 text-sm font-bold focus:border-blue-500 focus:outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-1">Durak Ekle (Müşteri Ara)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={customerSearch}
                                                onChange={(e) => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                                                placeholder="Müşteri adı ara..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 text-sm focus:border-blue-500 outline-none"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                                        </div>

                                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
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
                                                    className="w-full p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 text-left transition-all flex justify-between items-center group"
                                                >
                                                    <div>
                                                        <div className="text-sm font-bold truncate">{c.name}</div>
                                                        <div className="text-[10px] text-gray-500 font-bold uppercase">{c.city} / {c.district}</div>
                                                    </div>
                                                    <span className="opacity-0 group-hover:opacity-100 text-blue-400 font-black text-[10px]">+ EKLE</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col bg-black/20 rounded-[2rem] p-6 border border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Rota Akışı ({selectedCustomers.length})</h3>
                                        <button onClick={() => setSelectedCustomers([])} className="text-[9px] font-black text-red-400/50 hover:text-red-400 uppercase">Temizle</button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {selectedCustomers.map((c, i) => (
                                            <div key={c.id} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 group">
                                                <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-xs flex-shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold truncate">{c.name}</div>
                                                    <div className="text-[9px] text-gray-600 font-bold uppercase">{c.city}</div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedCustomers(selectedCustomers.filter(sc => sc.id !== c.id))}
                                                    className="w-7 h-7 rounded-xl hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center text-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {selectedCustomers.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                                                <div className="text-3xl mb-3">📍</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest">Henüz durak eklenmedi</div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleCreateTemplate}
                                        disabled={isProcessing || selectedCustomers.length === 0}
                                        className="mt-6 w-full py-4 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-2xl shadow-blue-900/40 disabled:opacity-20 disabled:grayscale"
                                    >
                                        {isProcessing ? 'KAYDEDİLİYOR...' : 'ŞABLONU OLUŞTUR'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
            `}</style>
        </div>
    );
}
