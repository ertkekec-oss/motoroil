"use client";

import { useState, useEffect, useMemo } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useCRM } from '@/contexts/CRMContext';
import { useFinancials } from '@/contexts/FinancialContext';
import { 
    Calendar, List as ListMenu, Plus, CheckCircle2, Trash2, 
    Wallet, TrendingUp, TrendingDown, Filter, ChevronLeft, ChevronRight,
    Search, FileText
} from 'lucide-react';

export default function CheckModule() {
    const { showSuccess, showError, showConfirm, showPrompt } = useModal();
    const { customers, suppliers } = useCRM();
    const { kasalar } = useFinancials();

    // States
    const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'new'>('list');
    const [checks, setChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Collection Modal State
    const [collectionModalOpen, setCollectionModalOpen] = useState(false);
    const [selectedCheckForCollection, setSelectedCheckForCollection] = useState<any>(null);
    const [collectionTargetKasaId, setCollectionTargetKasaId] = useState('');
    const [collectionActionType, setCollectionActionType] = useState<string>('');

    // New Data Form
    const [formData, setFormData] = useState({
        type: 'In', // In (Alınan), Out (Verilen)
        number: '',
        bank: '',
        dueDate: new Date().toISOString().split('T')[0],
        amount: '',
        customerId: '',
        supplierId: '',
        description: '',
        branch: 'Merkez'
    });

    useEffect(() => {
        fetchChecks();
    }, [filterType, filterStatus]);

    const fetchChecks = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                type: filterType,
                status: filterStatus
            });
            const res = await fetch(`/api/financials/checks?${query}`);
            const data = await res.json();
            if (data.success) {
                setChecks(data.checks);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/financials/checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Kaydedildi', 'Çek başarıyla sisteme işlendi');
                setFormData({ ...formData, number: '', amount: '', description: '', bank: '' });
                setActiveTab('list');
                fetchChecks();
            } else {
                showError('Hata', data.error);
            }
        } catch (error) {
            showError('Hata', 'Kaydedilirken bir hata oluştu');
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        if (newStatus === 'Tahsil Edildi' || newStatus === 'Ödendi') {
            const check = checks.find(c => c.id === id);
            if (!check) return;
            const banks = kasalar.filter((k: any) => k.type.toLowerCase().includes('bank') || k.type === 'Banka');
            if (banks.length === 0) {
                showError('Hata', 'İşlem için tanımlı bir banka kasası bulunamadı.');
                return;
            }
            setSelectedCheckForCollection(check);
            setCollectionActionType(newStatus);
            setCollectionTargetKasaId(banks.length > 0 ? String(banks[0].id) : '');
            setCollectionModalOpen(true);
        } else {
            updateStatus(id, newStatus);
        }
    };

    const handleExecuteCollection = () => {
        if (!selectedCheckForCollection || !collectionTargetKasaId) {
            showError("Hata", "Lütfen bir kasa veya banka seçin.");
            return;
        }
        updateStatus(selectedCheckForCollection.id, collectionActionType, collectionTargetKasaId);
        setCollectionModalOpen(false);
        setSelectedCheckForCollection(null);
    };

    const updateStatus = async (id: string, status: string, kasaId?: string) => {
        try {
            const res = await fetch(`/api/financials/checks/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, kasaId })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Güncellendi', `Çek durumu güncellendi: ${status}`);
                fetchChecks();
            } else {
                showError('Hata', data.error);
            }
        } catch (error) {
            showError('Hata', 'Güncelleme hatası');
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm('Kayıt Silme', 'Bu çek kaydını silmek istediğinize emin misiniz? (Bakiyeler geri alınmaz)', async () => {
            try {
                const res = await fetch(`/api/financials/checks/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showSuccess('Silindi', 'Kayıt başarıyla silindi');
                    fetchChecks();
                } else {
                    const d = await res.json();
                    showError('Hata', d.error);
                }
            } catch (e) { showError('Hata', 'Silinemedi'); }
        });
    };

    // Calendar Helper
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); 
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; 
        const lastDate = new Date(year, month + 1, 0).getDate();
        return { adjustedFirstDay, lastDate };
    }, [currentDate]);

    // Financial Overviews
    const stats = useMemo(() => {
        const isIncoming = (t: string) => t === 'In' || t?.includes('Alınan');
        const isOutgoing = (t: string) => t === 'Out' || t?.includes('Verilen');

        const inPending = checks.filter(c => isIncoming(c.type) && c.status !== 'Tahsil Edildi' && c.status !== 'Karşılıksız').reduce((a, b) => a + Number(b.amount), 0);
        const outPending = checks.filter(c => isOutgoing(c.type) && c.status !== 'Ödendi' && c.status !== 'Karşılıksız').reduce((a, b) => a + Number(b.amount), 0);
        return { inPending, outPending, isIncoming, isOutgoing };
    }, [checks]);

    // Search filter
    const searchedChecks = checks.filter(c => 
        (c.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.bank || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500 h-[calc(100vh-280px)] min-h-[600px]">
            {/* LEFT COLUMN: Metrics & Quick Actions (1 span) */}
            <div className="lg:col-span-1 flex flex-col gap-4 h-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-xl overflow-hidden overflow-y-auto modern-scrollbar">
                <div className="p-5 flex-1 flex flex-col gap-6">
                    {/* Action Button */}
                    <button 
                        onClick={() => setActiveTab('new')} 
                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> YENİ ÇEK / SENET
                    </button>

                    {/* KPI 1 */}
                    <div className="bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-100 dark:border-white/5 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Tahsilatlar
                            </h4>
                            <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                Portföydeki Alınan
                            </span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white truncate">
                            ₺{stats.inPending.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* KPI 2 */}
                    <div className="bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-100 dark:border-white/5 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                                <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Ödemeler
                            </h4>
                            <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 px-2 py-0.5 rounded-full">
                                Bekleyen Verilen
                            </span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white truncate">
                            ₺{stats.outPending.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5">
                        <h4 className="text-[12px] font-black tracking-widest text-slate-900 dark:text-white uppercase flex items-center gap-2">
                            <Filter className="w-4 h-4 text-blue-500" /> Hızlı Filtreler
                        </h4>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase block mb-1">Kayıt Türü</label>
                                <select 
                                    className="w-full h-10 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg px-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                                    value={filterType} onChange={e => setFilterType(e.target.value)}
                                >
                                    <option value="all">Tüm Yönler</option>
                                    <option value="In">⬇ Alınan Çekler</option>
                                    <option value="Out">⬆ Verilen Çekler</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase block mb-1">Durum</label>
                                <select 
                                    className="w-full h-10 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg px-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">Tüm Durumlar</option>
                                    <option value="Portföyde">Bekleyen (Portföyde)</option>
                                    <option value="Tahsil Edildi">Tahsil Edildi</option>
                                    <option value="Ödendi">Ödendi</option>
                                    <option value="Karşılıksız">Karşılıksız</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase block mb-1">Arama</label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari, banka veya no..." 
                                        className="w-full h-10 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: View Area (3 span) */}
            <div className="lg:col-span-3 flex flex-col h-full bg-white dark:bg-[#0f172a] shadow-sm rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                {/* View Tabs Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1e293b]/30 shrink-0">
                    <div className="flex gap-2 bg-slate-100 dark:bg-[#1e293b] p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('list')} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-bold transition-all ${activeTab === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            <ListMenu className="w-4 h-4" /> Liste
                        </button>
                        <button 
                            onClick={() => setActiveTab('calendar')} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-bold transition-all ${activeTab === 'calendar' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            <Calendar className="w-4 h-4" /> Takvim
                        </button>
                    </div>
                    {activeTab === 'list' && (
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1e293b] px-3 py-1.5 rounded-lg">
                            {searchedChecks.length} Kayıt Gösteriliyor
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto modern-scrollbar bg-white dark:bg-[#0f172a]">
                    
                    {/* LIST VIEW */}
                    {activeTab === 'list' && (
                        <table className="w-full text-left min-w-[700px] border-collapse relative">
                            <thead className="bg-slate-50/50 dark:bg-[#1e293b]/50 sticky top-0 z-10 border-b border-slate-200 dark:border-white/5 backdrop-blur-sm">
                                <tr>
                                    <th className="p-3 pl-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-36">Durum</th>
                                    <th className="p-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cari / Banka</th>
                                    <th className="p-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-28">Vade</th>
                                    <th className="p-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Tutar</th>
                                    <th className="p-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-28 text-center pr-5">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center text-slate-400 dark:text-slate-500 font-medium">Yükleniyor...</td>
                                    </tr>
                                ) : searchedChecks.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center">
                                            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Bu kriterlere uygun çek veya senet bulunamadı.</p>
                                        </td>
                                    </tr>
                                ) : searchedChecks.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="p-3 pl-5 align-middle">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                    stats.isIncoming(item.type) ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
                                                                       : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                                                }`}>
                                                    {stats.isIncoming(item.type) ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {stats.isIncoming(item.type) ? 'Alınan' : 'Verilen'}
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.status}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 align-middle">
                                            <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                                                {item.customer?.name || item.supplier?.name || '-'}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{item.bank || 'Banka Yok'}</span>
                                                {item.number && <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{item.number}</span>}
                                            </div>
                                        </td>
                                        <td className="p-3 align-middle">
                                            <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                                                {new Date(item.dueDate).toLocaleDateString('tr-TR')}
                                            </div>
                                        </td>
                                        <td className="p-3 align-middle text-right">
                                            <div className="text-[14px] font-black text-slate-900 dark:text-white">
                                                ₺{Number(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="p-3 pr-5 align-middle text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {item.status === 'Portföyde' || item.status === 'Bekleyen' ? (
                                                    <button
                                                        onClick={() => handleStatusChange(item.id, stats.isIncoming(item.type) ? 'Tahsil Edildi' : 'Ödendi')}
                                                        className={`h-7 px-3 rounded-md text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 ${
                                                            stats.isIncoming(item.type)
                                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        {stats.isIncoming(item.type) ? 'TAHSİL' : 'ÖDEME'}
                                                    </button>
                                                ) : null}
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-rose-300 hover:text-rose-500 dark:hover:border-rose-500/30 text-slate-400 transition-all flex items-center justify-center"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* CALENDAR VIEW */}
                    {activeTab === 'calendar' && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/5 transition-all flex items-center justify-center text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                                <div className="text-center">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-widest uppercase">
                                        {currentDate.toLocaleDateString('tr-TR', { month: 'long' })}
                                    </h3>
                                    <div className="text-blue-600 dark:text-blue-400 text-[12px] font-bold mt-0.5">{currentDate.getFullYear()}</div>
                                </div>
                                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/5 transition-all flex items-center justify-center text-slate-500"><ChevronRight className="w-5 h-5" /></button>
                            </div>

                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'].map(d => (
                                    <div key={d} className="text-center text-[10px] font-black text-slate-400 tracking-wider bg-slate-50 dark:bg-[#1e293b] py-1.5 rounded">{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {/* Fill empty start days */}
                                {Array(daysInMonth.adjustedFirstDay).fill(0).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent border border-dashed border-slate-200/50 dark:border-slate-800 opacity-30" />
                                ))}

                                {/* Days */}
                                {Array(daysInMonth.lastDate).fill(0).map((_, i) => {
                                    const day = i + 1;
                                    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                    const dateStr = d.toDateString();
                                    const dayChecks = checks.filter(c => new Date(c.dueDate).toDateString() === dateStr);
                                    const isToday = new Date().toDateString() === dateStr;

                                    return (
                                        <div key={day} className={`aspect-square rounded-xl border ${isToday ? 'border-blue-400 bg-blue-50/30 dark:border-blue-500/50 dark:bg-blue-500/5' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]/50'} p-2 relative flex flex-col group overflow-hidden`}>
                                            <div className={`text-[11px] font-black ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-400'}`}>{day}</div>
                                            <div className="mt-1 flex flex-col gap-1 overflow-y-auto custom-scroll flex-1">
                                                {dayChecks.map(c => (
                                                    <div
                                                        key={c.id}
                                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold truncate border ${stats.isIncoming(c.type) ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}
                                                        title={`${c.customer?.name || c.bank}: ${c.amount}₺`}
                                                    >
                                                        {c.amount.toLocaleString('tr-TR')}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* NEW ITEM FORM */}
                    {activeTab === 'new' && (
                        <div className="p-6 md:p-8">
                           <div className="max-w-2xl mx-auto">
                                <div className="mb-8 border-b border-slate-100 dark:border-white/5 pb-4">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-blue-500" /> Yeni Çek / Senet Girişi
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">Sisteme yeni bir tahsilat veya ödeme planı ekleyin.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">İşlem Yönü</label>
                                            <select 
                                                className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 h-12 text-[13px] font-bold outline-none focus:border-blue-500 transition-all appearance-none" 
                                                value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="In">⬇ ALINAN ÇEK (Müşteriden)</option>
                                                <option value="Out">⬆ VERİLEN ÇEK (Tedarikçiye)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Tutar (TRY)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                                                <input type="number" step="0.01" required placeholder="0.00"
                                                    className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-8 pr-4 h-12 text-[14px] font-black outline-none focus:border-blue-500 transition-all" 
                                                    value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">
                                            {formData.type === 'In' ? 'Müşteri Seçimi' : 'Tedarikçi Seçimi'}
                                        </label>
                                        <select 
                                            required 
                                            className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 h-12 text-[13px] font-bold outline-none focus:border-blue-500 transition-all" 
                                            value={formData.type === 'In' ? formData.customerId : formData.supplierId} 
                                            onChange={e => setFormData({ ...formData, [formData.type === 'In' ? 'customerId' : 'supplierId']: e.target.value })}
                                        >
                                            <option value="">Cari seçiniz...</option>
                                            {formData.type === 'In'
                                                ? customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                                : suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                            }
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Vade Tarihi</label>
                                            <input type="date" required 
                                                className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 h-12 text-[13px] font-bold outline-none focus:border-blue-500 transition-all" 
                                                value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Banka Bilgisi</label>
                                            <input type="text" placeholder="Örn: Garanti BBVA" 
                                                className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 h-12 text-[13px] font-bold outline-none focus:border-blue-500 transition-all" 
                                                value={formData.bank} onChange={e => setFormData({ ...formData, bank: e.target.value })} 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="md:col-span-1 space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Belge No</label>
                                            <input type="text" placeholder="No: 12345" 
                                                className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 h-12 text-[13px] font-bold outline-none focus:border-blue-500 transition-all" 
                                                value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} 
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Açıklama</label>
                                            <input type="text" placeholder="Opsiyonel not ekleyin..." 
                                                className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 h-12 text-[13px] font-bold outline-none focus:border-blue-500 transition-all" 
                                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button type="button" onClick={() => setActiveTab('list')} className="px-6 h-11 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm bg-white dark:bg-transparent hover:bg-slate-50 transition-all">İptal</button>
                                        <button type="submit" className="px-6 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all">
                                            Kaydet
                                        </button>
                                    </div>
                                </form>
                           </div>
                        </div>
                    )}
                </div>
            </div>

            {/* COLLECTION MODAL */}
            {collectionModalOpen && selectedCheckForCollection && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`p-6 border-b ${collectionActionType === 'Tahsil Edildi' ? 'border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5' : 'border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${collectionActionType === 'Tahsil Edildi' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'}`}>
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {collectionActionType === 'Tahsil Edildi' ? 'Çek Tahsilatı' : 'Çek / Senet Ödemesi'}
                                    </h3>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                        Fiziki portföyden banka hesabına geçiş
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Information Block */}
                            <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl p-4 border border-slate-100 dark:border-white/5 flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                        {collectionActionType === 'Tahsil Edildi' ? 'Gönderen (Müşteri)' : 'Alıcı (Tedarikçi)'}
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                        {selectedCheckForCollection.customer?.name || selectedCheckForCollection.supplier?.name || '-'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                        Tutar
                                    </div>
                                    <div className={`text-lg font-black ${collectionActionType === 'Tahsil Edildi' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                        ₺{Number(selectedCheckForCollection.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            {/* Bank Selection */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5 ml-1">
                                    <Wallet className="w-3.5 h-3.5" /> Hedef Kasa / Banka 
                                </label>
                                <select 
                                    className="w-full h-12 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 text-[13px] font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                                    value={collectionTargetKasaId}
                                    onChange={(e) => setCollectionTargetKasaId(e.target.value)}
                                >
                                    <option value="">Seçiniz...</option>
                                    {kasalar.filter((k: any) => k.type.toLowerCase().includes('bank') || k.type === 'Banka').map((kasa: any) => (
                                        <option key={kasa.id} value={kasa.id}>{kasa.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Warning Note */}
                            <div className="bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-xl p-3 text-amber-800 dark:text-amber-400 flex items-start gap-3">
                                <div className="text-lg">ℹ️</div>
                                <p className="text-[11px] font-semibold leading-relaxed pt-0.5">
                                    Bu işlem, seçili çekin tutarını doğrudan {collectionTargetKasaId ? kasalar.find((k:any)=>String(k.id)===collectionTargetKasaId)?.name : 'hedef bankaya'} aktaracak ve çeki sistemde kapatacaktır. Bu işlem bir finansal muhasebe fişi (102 Bankalar / 101 Alınan Çekler vb.) oluşturur.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0f172a] flex justify-end gap-3 rounded-b-2xl">
                            <button 
                                onClick={() => setCollectionModalOpen(false)} 
                                className="px-6 h-11 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-sm bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                İptal
                            </button>
                            <button 
                                onClick={handleExecuteCollection} 
                                className={`px-6 h-11 rounded-xl font-bold text-sm text-white shadow-md active:scale-95 transition-all flex items-center gap-2 ${collectionActionType === 'Tahsil Edildi' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
                            >
                                <CheckCircle2 className="w-4 h-4" /> 
                                İşlemi Tamamla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
