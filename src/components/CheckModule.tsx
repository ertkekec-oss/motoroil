"use client";

import { useState, useEffect, useMemo } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useApp } from '@/contexts/AppContext';
import { useCRM } from '@/contexts/CRMContext';
import { useFinancials } from '@/contexts/FinancialContext';

export default function CheckModule() {
    const { showSuccess, showError, showConfirm, showWarning } = useModal();
    const { customers, suppliers } = useCRM();
    const { kasalar, refreshChecks: refreshFinancialChecks } = useFinancials();

    // States
    const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'new'>('list');
    const [checks, setChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

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
        // If status requires money movement (Tahsil/Ödeme), ask for Kasa
        if (newStatus === 'Tahsil Edildi' || newStatus === 'Ödendi') {
            const banks = kasalar.filter((k: any) => k.type.toLowerCase().includes('bank') || k.type === 'Banka');

            if (banks.length === 0) {
                showError('Hata', 'İşlem için tanımlı bir banka kasası bulunamadı.');
                return;
            }

            // Simple selection for now, could be a modal
            const kasaOptions = banks.map(b => `${b.name}`).join(', ');
            const selectedKasaName = prompt(`Tahsilat/Ödeme yapılacak kasayı yazınız:\n(${kasaOptions})`, banks[0].name);

            if (!selectedKasaName) return;

            const selectedKasa = banks.find(b => b.name.toLowerCase() === selectedKasaName.toLowerCase());
            if (!selectedKasa) {
                showError('Hata', 'Geçersiz kasa seçimi.');
                return;
            }

            updateStatus(id, newStatus, String(selectedKasa.id));
        } else {
            updateStatus(id, newStatus);
        }
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
        showConfirm('Kayıt Silme', 'Bu çek kaydını silmek istediğinize emin misiniz? (Bu işlem bakiyeleri geri almaz)', async () => {
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
        const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust to Monday start
        const lastDate = new Date(year, month + 1, 0).getDate();

        return { adjustedFirstDay, lastDate };
    }, [currentDate]);

    // Financial Overviews
    const stats = useMemo(() => {
        const inPending = checks.filter(c => c.type === 'In' && c.status !== 'Tahsil Edildi' && c.status !== 'Karşılıksız').reduce((a, b) => a + Number(b.amount), 0);
        const outPending = checks.filter(c => c.type === 'Out' && c.status !== 'Ödendi' && c.status !== 'Karşılıksız').reduce((a, b) => a + Number(b.amount), 0);
        return { inPending, outPending };
    }, [checks]);

    return (
        <div className="animate-fade-in space-y-6">
            {/* Summary Cards */}
            {/* 1. Strategic Metrics Zone (Unified Strip) */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[24px] flex flex-col md:flex-row shadow-sm overflow-hidden mb-8">
                <div className="flex-1 p-6 relative group">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bekleyen Tahsilatlar</span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-[6px]">
                            ↑ Tahsilat
                        </div>
                    </div>
                    <div className="text-[32px] font-bold text-slate-900 dark:text-white leading-none mb-1">
                        {stats.inPending.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">Portföydeki Alınan Çekler</div>
                </div>

                <div className="w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
                <div className="h-px w-full bg-slate-200 dark:bg-slate-800 block md:hidden" />

                <div className="flex-1 p-6 relative group">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bekleyen Ödemeler</span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-[6px]">
                            ↓ Ödeme
                        </div>
                    </div>
                    <div className="text-[32px] font-bold text-slate-900 dark:text-white leading-none mb-1">
                        {stats.outPending.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">Vadesi Gelen Verilen Çekler</div>
                </div>

                <div className="w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
                <div className="h-px w-full bg-slate-200 dark:bg-slate-800 block md:hidden" />

                <div className="flex-1 p-6 flex flex-col justify-center">
                    <button onClick={() => setActiveTab('new')} className="w-full h-[52px] rounded-[12px] bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                        <span className="text-[18px]">+</span> Yeni Çek Gönder / Al
                    </button>
                </div>
            </div>

            {/* 2. Navigation Zone */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 w-full overflow-x-auto custom-scroll select-none">
                <div className="flex h-[48px] items-end gap-8 px-2 w-full min-w-max">
                    <button onClick={() => setActiveTab('list')} className={`pb-3 text-[14px] font-semibold transition-all relative whitespace-nowrap ${activeTab === 'list' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                        Liste Görünümü
                        {activeTab === 'list' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                    </button>
                    <button onClick={() => setActiveTab('calendar')} className={`pb-3 text-[14px] font-semibold transition-all relative whitespace-nowrap ${activeTab === 'calendar' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                         Vade Takvimi
                        {activeTab === 'calendar' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                    </button>
                </div>
            </div>

            {/* List View */}
            {activeTab === 'list' && (
                <div className="bg-white dark:bg-[#1e293b] rounded-[24px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-4">
                            <select className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[12px] px-4 py-2 text-sm outline-none focus:border-blue-600 dark:focus:border-blue-400 ring-0" value={filterType} onChange={e => setFilterType(e.target.value)}>
                                <option value="all">Tüm Yönler</option>
                                <option value="In">⬇ Alınan Çekler</option>
                                <option value="Out">⬆ Verilen Çekler</option>
                            </select>
                            <select className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[12px] px-4 py-2 text-sm outline-none focus:border-blue-600 dark:focus:border-blue-400 ring-0" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="all">Tüm Durumlar</option>
                                <option value="Portföyde">Portföyde</option>
                                <option value="Tahsil Edildi">Tahsil Edildi</option>
                                <option value="Ödendi">Ödendi</option>
                                <option value="Karşılıksız">Karşılıksız</option>
                            </select>
                        </div>
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white/40 uppercase tracking-widest">
                            Toplam {checks.length} Kayıt Listeleniyor
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-900 dark:text-white/30 uppercase tracking-[2px] border-b border-slate-200 dark:border-slate-800">
                                    <th className="p-6">YÖN / DURUM</th>
                                    <th className="p-6">VADE / BANKA</th>
                                    <th className="p-6">BELGE NO</th>
                                    <th className="p-6">MÜŞTERİ / TEDARİKÇİ</th>
                                    <th className="p-6 text-right">TUTAR</th>
                                    <th className="p-6 text-center">İŞLEM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center text-slate-900 dark:text-white/40 animate-pulse font-bold tracking-widest italic">VERİLER YÜKLENİYOR...</td>
                                    </tr>
                                ) : checks.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center text-slate-900 dark:text-white/20 italic">Henüz kayıtlı çek bulunmuyor.</td>
                                    </tr>
                                ) : checks.map(item => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${item.type === 'In' ? 'bg-emerald-500' : 'bg-rose-500 shadow-lg shadow-rose-500/50 pulse-error'}`} />
                                                <div className="flex flex-col">
                                                    <span className={`text-[11px] font-black ${item.type === 'In' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {item.type === 'In' ? 'ALINAN' : 'VERİLEN'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-900 dark:text-white/40 font-bold mt-0.5">{item.status}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{new Date(item.dueDate).toLocaleDateString('tr-TR')}</span>
                                                <span className="text-[11px] text-slate-900 dark:text-white/40 italic">{item.bank}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-sm font-mono text-slate-900 dark:text-white/60">{item.number}</td>
                                        <td className="p-6">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white/80">{item.customer?.name || item.supplier?.name || '-'}</span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className="text-[14px] font-semibold text-slate-900 dark:text-white">
                                                {Number(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </span>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex justify-center gap-2">
                                                {item.status === 'Portföyde' && (
                                                    <button
                                                        onClick={() => handleStatusChange(item.id, item.type === 'In' ? 'Tahsil Edildi' : 'Ödendi')}
                                                        className="px-4 py-2 rounded-[12px] bg-blue-600 hover:bg-blue-700 text-slate-900 dark:text-white text-[10px] font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                                    >
                                                        {item.type === 'In' ? 'TAHSİL ET' : 'ÖDEME YAP'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="w-10 h-10 rounded-[12px] bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-500/10 text-slate-900 dark:text-white/20 hover:text-rose-500 transition-all flex items-center justify-center font-black"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Calendar View */}
            {activeTab === 'calendar' && (
                <div className="bg-white dark:bg-[#1e293b] rounded-[24px] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="w-12 h-12 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:bg-slate-800 transition-all text-xl">←</button>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase">
                                {currentDate.toLocaleDateString('tr-TR', { month: 'long' })}
                            </h3>
                            <div className="text-blue-600 dark:text-blue-400 text-sm font-black mt-1">{currentDate.getFullYear()}</div>
                        </div>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="w-12 h-12 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:bg-slate-800 transition-all text-xl">→</button>
                    </div>

                    <div className="grid grid-cols-7 gap-3 mb-3">
                        {['PT', 'SA', 'ÇR', 'PR', 'CU', 'CT', 'PA'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-slate-900 dark:text-white/20 tracking-widest">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-3">
                        {/* Fill empty start days */}
                        {Array(daysInMonth.adjustedFirstDay).fill(0).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square rounded-[24px] bg-transparent opacity-10 border border-dashed border-slate-200 dark:border-slate-800" />
                        ))}

                        {/* Days */}
                        {Array(daysInMonth.lastDate).fill(0).map((_, i) => {
                            const day = i + 1;
                            const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const dateStr = d.toDateString();
                            const dayChecks = checks.filter(c => new Date(c.dueDate).toDateString() === dateStr);
                            const isToday = new Date().toDateString() === dateStr;

                            return (
                                <div key={day} className={`aspect-square rounded-[24px] border ${isToday ? 'border-sky-500/50 bg-sky-500/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'} p-3 relative group hover:border-sky-500/30 transition-all cursor-pointer`}>
                                    <div className={`text-xs font-black ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white/30'} group-hover:text-slate-900 dark:text-white transition-colors`}>{day}</div>
                                    <div className="mt-2 flex flex-col gap-1 overflow-y-auto custom-scroll max-h-full pb-2">
                                        {dayChecks.map(c => (
                                            <div
                                                key={c.id}
                                                className={`text-[8px] px-1.5 py-0.5 rounded-lg font-black truncate ${c.type === 'In' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}
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

            {/* Create Form */}
            {activeTab === 'new' && (
                <div className="bg-white dark:bg-[#1e293b] rounded-[24px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl mx-auto bg-gradient-to-br from-white/5 to-transparent">
                    <div className="flex items-center gap-4 mb-10 border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div className="w-16 h-16 rounded-[24px] bg-sky-500/10 flex items-center justify-center text-3xl">🎫</div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">YENİ ÇEK / SENET GİRİŞİ</h3>
                            <p className="text-xs text-slate-900 dark:text-white/40 font-bold uppercase tracking-widest mt-1">Sisteme yeni bir tahsilat veya ödeme planı ekleyin</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-900 dark:text-white/30 uppercase tracking-[2px] ml-4">İŞLEM YÖNÜ</label>
                                <select className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[24px] px-6 py-4 text-[13px] h-[52px] outline-none focus:border-blue-600 dark:focus:border-blue-400 ring-0 transition-all font-bold appearance-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="In">ALINAN ÇEK (Müşteri)</option>
                                    <option value="Out">VERİLEN ÇEK (Tedarikçi)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-900 dark:text-white/30 uppercase tracking-[2px] ml-4">TUTAR (TRY)</label>
                                <input type="number" className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[24px] px-6 py-4 text-[13px] h-[52px] outline-none focus:border-blue-600 dark:focus:border-blue-400 ring-0 transition-all font-bold" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" step="0.01" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-900 dark:text-white/30 uppercase tracking-[2px] ml-4">
                                {formData.type === 'In' ? 'MÜŞTERİ SEÇİMİ' : 'TEDARİKÇİ SEÇİMİ'}
                            </label>
                            <select className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[24px] px-6 py-4 text-[13px] h-[52px] outline-none focus:border-blue-600 dark:focus:border-blue-400 ring-0 transition-all font-bold" required value={formData.type === 'In' ? formData.customerId : formData.supplierId} onChange={e => setFormData({ ...formData, [formData.type === 'In' ? 'customerId' : 'supplierId']: e.target.value })}>
                                <option value="">Bir cari seçiniz...</option>
                                {formData.type === 'In'
                                    ? customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                    : suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                }
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-900 dark:text-white/30 uppercase tracking-[2px] ml-4">VADE TARİHİ</label>
                                <input type="date" className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[24px] px-6 py-4 text-[13px] h-[52px] outline-none focus:border-blue-600 dark:focus:border-blue-400 ring-0 transition-all font-bold" required value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-900 dark:text-white/30 uppercase tracking-[2px] ml-4">BANKA BİLGİSİ</label>
                                <input type="text" className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[24px] px-6 py-4 text-[13px] h-[52px] outline-none focus:border-blue-600 dark:focus:border-blue-400 ring-0 transition-all font-bold" placeholder="Örn: Garanti BBVA" value={formData.bank} onChange={e => setFormData({ ...formData, bank: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-900 dark:text-white/30 uppercase tracking-[2px] ml-4">BELGE NO / AÇIKLAMA</label>
                            <div className="flex gap-4">
                                <input type="text" className="w-48 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[24px] px-6 py-4 text-[13px] h-[52px] outline-none focus:border-blue-600 dark:focus:border-blue-400 ring-0 transition-all font-bold" placeholder="No: 12345" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
                                <input type="text" className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[24px] px-6 py-4 text-[13px] h-[52px] outline-none focus:border-blue-600 dark:focus:border-blue-400 ring-0 transition-all font-bold" placeholder="Not ekleyin..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                        </div>

                        <button type="submit" className="w-full py-5 rounded-[24px] bg-blue-600 hover:bg-blue-700 text-slate-900 dark:text-white font-black text-[14px] shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all">
                            ✅ KAYDI SİSTEME İŞLE
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
