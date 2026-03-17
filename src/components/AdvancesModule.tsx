"use client";

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import {
    EnterpriseCard,
    EnterpriseButton,
    EnterpriseTable,
    EnterpriseEmptyState
} from '@/components/ui/enterprise';
import { Banknote, CheckCircle, Trash2, Plus } from 'lucide-react';

export default function AdvancesModule({ staffList }: { staffList: any[] }) {
    const { showSuccess, showError, showConfirm } = useModal();
    const [advances, setAdvances] = useState<any[]>([]);
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [loading, setLoading] = useState(false);
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ staffId: '', type: 'ADVANCE', amount: '', description: '' });

    useEffect(() => {
        fetchAdvances();
    }, [period]);

    const fetchAdvances = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/staff/advances?period=${period}`);
            const data = await res.json();
            if (data.success) {
                setAdvances(data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!formData.staffId || !formData.amount) {
            showError('Hata', 'Lütfen personel ve tutar seçiniz.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/staff/advances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, period })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Kayıt eklendi.');
                setShowAddModal(false);
                setFormData({ staffId: '', type: 'ADVANCE', amount: '', description: '' });
                fetchAdvances();
            } else {
                showError('Hata', data.error);
            }
        } catch (error) {
            showError('Hata', 'İşlem gerçekleştirilemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm('Sil', 'Bu kaydı silmek istediğinize emin misiniz?', async () => {
            try {
                const res = await fetch(`/api/staff/advances?id=${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Silindi', 'Kayıt başarıyla silindi.');
                    fetchAdvances();
                } else {
                    showError('Hata', data.error);
                }
            } catch (e) {
                showError('Hata', 'Silme işlemi başarısız.');
            }
        });
    };

    const totalAdvances = advances.filter(a => a.type === 'ADVANCE').reduce((sum, a) => sum + Number(a.amount), 0);
    const totalDeductions = advances.filter(a => a.type === 'DEDUCTION').reduce((sum, a) => sum + Number(a.amount), 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h3 className="text-[18px] font-black text-slate-900 dark:text-white">Avans ve Kesintiler</h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Personele verilen elden avansları ve manuel tutanak/zarar kesintilerini yönetin.
                        Bordro oluşturulurken otomatik düşülür.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="month" 
                        className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold outline-none focus:border-slate-400"
                        value={period} 
                        onChange={e => setPeriod(e.target.value)} 
                    />
                    <EnterpriseButton variant="primary" onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Ekle
                    </EnterpriseButton>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EnterpriseCard className="bg-slate-50 border-emerald-500/20 dark:bg-emerald-950/10">
                    <div className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400 uppercase tracking-widest mb-1">Toplam Verilen Avans</div>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-500">{totalAdvances.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                </EnterpriseCard>
                <EnterpriseCard className="bg-slate-50 border-rose-500/20 dark:bg-rose-950/10">
                    <div className="text-xs font-semibold text-rose-600/70 dark:text-rose-400 uppercase tracking-widest mb-1">Toplam Kesinti Cezası</div>
                    <div className="text-2xl font-black text-rose-700 dark:text-rose-500">{totalDeductions.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                </EnterpriseCard>
            </div>

            <EnterpriseCard noPadding>
                {advances.length > 0 ? (
                    <EnterpriseTable
                        headers={[
                            "TARİH",
                            "PERSONEL",
                            "TÜR",
                            "AÇIKLAMA",
                            { label: "TUTAR", alignRight: true },
                            { label: "İŞLEM", alignRight: true }
                        ]}
                    >
                        {advances.map((record: any) => (
                            <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <td className="h-14 px-4 align-middle text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                    {new Date(record.createdAt).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="h-14 px-4 align-middle">
                                    <div className="font-bold text-slate-900 dark:text-white text-[13px]">{record.staff?.name}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{record.staff?.role}</div>
                                </td>
                                <td className="h-14 px-4 align-middle">
                                    <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${
                                        record.type === 'ADVANCE' 
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                            : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                                    }`}>
                                        {record.type === 'ADVANCE' ? '💸 Avans' : '⚠️ Kesinti / Ceza'}
                                    </span>
                                </td>
                                <td className="h-14 px-4 align-middle text-[13px] font-medium text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                    {record.description || '-'}
                                </td>
                                <td className={`h-14 px-4 align-middle text-right text-[14px] font-black ${record.type === 'ADVANCE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {Number(record.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </td>
                                <td className="h-14 px-4 align-middle text-right pr-6">
                                    <button 
                                        onClick={() => handleDelete(record.id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                ) : (
                    <EnterpriseEmptyState
                        icon={<Banknote className="w-12 h-12" />}
                        title="Kayıt Yok"
                        description={`${period} dönemi için herhangi bir avans veya kesinti kaydı bulunmuyor.`}
                        className="py-16"
                    />
                )}
            </EnterpriseCard>

            {/* Yeni Ekle Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0f172a]">
                            <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>➕</span> Avans veya Kesinti Ekle
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Personel</label>
                                <select className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                                    value={formData.staffId} onChange={e => setFormData({ ...formData, staffId: e.target.value })}>
                                    <option value="">Seçiniz</option>
                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name} - {s.role}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Kayıt Türü</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setFormData({...formData, type: 'ADVANCE'})} 
                                        className={`h-11 rounded-xl text-[13px] font-bold transition-all border ${formData.type === 'ADVANCE' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                                        Elden Avans
                                    </button>
                                    <button 
                                        onClick={() => setFormData({...formData, type: 'DEDUCTION'})} 
                                        className={`h-11 rounded-xl text-[13px] font-bold transition-all border ${formData.type === 'DEDUCTION' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                                        Kesinti / Ceza
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Tutar (₺)</label>
                                <input type="number" placeholder="5000" className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                                    value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Açıklama (İsteğe Bağlı)</label>
                                <textarea placeholder="Örn: Yol avansı, ürün hasar bedeli vb." className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 resize-none h-20"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3">
                            <EnterpriseButton variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>İptal</EnterpriseButton>
                            <EnterpriseButton variant="primary" className="flex-1" onClick={handleAdd} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</EnterpriseButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
