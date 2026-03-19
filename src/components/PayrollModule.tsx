"use client";

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import {
    EnterpriseCard,
    EnterpriseSectionHeader,
    EnterpriseButton,
    EnterpriseTable,
    EnterpriseInput,
    EnterpriseEmptyState
} from '@/components/ui/enterprise';
import { Calculator, CheckCircle, FileText, Download, Banknote } from 'lucide-react';

export default function PayrollModule() {
    const { showSuccess, showError, showConfirm } = useModal();
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPayrolls();
    }, [period]);

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/staff/payroll?period=${period}`);
            const data = await res.json();
            if (data.success) {
                setPayrolls(data.payrolls);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/staff/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ period })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Hesaplama Tamamlandı', data.message);
                fetchPayrolls();
            } else {
                showError('Hata', data.error);
            }
        } catch (error) {
            showError('Hata', 'Maaş bordroları hesaplanırken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const confirmGenerate = () => {
        showConfirm(
            "Bordroları Hesapla",
            `${period} dönemi için tüm personelin maaş, prim, SGK ve vergi kesintileri yeniden hesaplanacaktır. Onaylıyor musunuz?`,
            handleGenerate
        );
    };

    const handleMarkAsPaid = async (id: string) => {
        try {
            const res = await fetch('/api/staff/payroll', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'Ödendi' })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Bordro ödendi olarak işaretlendi ve kilitlendi.');
                fetchPayrolls();
            } else {
                showError('Hata', data.error || 'İşlem başarısız.');
            }
        } catch (e) {
            showError('Hata', 'Sistemsel bir sorun oluştu.');
        }
    };

    const handleUnlock = async (id: string) => {
        showConfirm('Kilidi Aç', 'Bordronun ödeme kilidini açarsanız, Dönemi Hesapla tuşu ile baştan yeniden hesaplatabilirsiniz. Onaylıyor musunuz?', async () => {
            try {
                const res = await fetch('/api/staff/payroll', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, status: 'Bekliyor' })
                });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', 'Bordro kilidi açıldı ve durumu Bekliyor yapıldı.');
                    fetchPayrolls();
                } else {
                    showError('Hata', data.error || 'İşlem başarısız.');
                }
            } catch (e) {
                showError('Hata', 'Sistemsel bir sorun oluştu.');
            }
        });
    };

    const totalSalary = payrolls.reduce((acc, curr) => acc + Number(curr.netPay), 0);
    const totalGross = payrolls.reduce((acc, curr) => acc + Number(curr.grossSalary || 0), 0);
    const totalSgk = payrolls.reduce((acc, curr) => acc + Number(curr.sgkDeduction || 0), 0);
    const totalTax = payrolls.reduce((acc, curr) => acc + Number(curr.incomeTax || 0) + Number(curr.stampTax || 0), 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h3 className="text-[18px] font-black text-slate-900 dark:text-white">Bordro & Maaş Yönetimi</h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Personel maaş, prim, avans ve vergi hesaplamalarını yönetin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="month" 
                        className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold outline-none focus:border-slate-400"
                        value={period} 
                        onChange={e => setPeriod(e.target.value)} 
                    />
                    <EnterpriseButton variant="primary" onClick={confirmGenerate} disabled={loading}>
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                        <Calculator className="w-4 h-4 mr-2" />
                        {loading ? 'Hesaplanıyor...' : 'Dönemi Hesapla'}
                    </EnterpriseButton>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <EnterpriseCard className="bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Toplam Ödenecek Net</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                </EnterpriseCard>
                <EnterpriseCard className="bg-slate-50 border-blue-500/20 dark:bg-blue-950/10">
                    <div className="text-xs font-semibold text-blue-600/70 dark:text-blue-400 uppercase tracking-widest mb-1">Toplam Brüt Maliyet</div>
                    <div className="text-2xl font-black text-blue-700 dark:text-blue-500">{totalGross.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                </EnterpriseCard>
                <EnterpriseCard className="bg-slate-50 border-rose-500/20 dark:bg-rose-950/10">
                    <div className="text-xs font-semibold text-rose-600/70 dark:text-rose-400 uppercase tracking-widest mb-1">Tahmini SGK Kesintisi</div>
                    <div className="text-2xl font-black text-rose-700 dark:text-rose-500">{totalSgk.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                </EnterpriseCard>
                <EnterpriseCard className="bg-slate-50 border-amber-500/20 dark:bg-amber-950/10">
                    <div className="text-xs font-semibold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest mb-1">Gelir & Damga Vergisi</div>
                    <div className="text-2xl font-black text-amber-700 dark:text-amber-500">{totalTax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                </EnterpriseCard>
            </div>

            <EnterpriseCard noPadding>
                {payrolls.length > 0 ? (
                    <EnterpriseTable
                        headers={[
                            "PERSONEL",
                            "Ç. GÜN",
                            { label: "KÖK MAAŞ", alignRight: true },
                            { label: "PRİM/EK", alignRight: true },
                            { label: "KESİNTİLER (VERGİ+SGK)", alignRight: true },
                            { label: "NET ÖDENECEK", alignRight: true },
                            "DURUM",
                            { label: "İŞLEM", alignRight: true }
                        ]}
                    >
                        {payrolls.map((p: any) => {
                            const totalTaxes = Number(p.sgkDeduction || 0) + Number(p.incomeTax || 0) + Number(p.stampTax || 0) + Number(p.unemploymentDeduction || 0);
                            
                            return (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="h-14 px-4 align-middle">
                                        <div className="font-bold text-slate-900 dark:text-white text-[13px]">{p.staff?.name}</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{p.staff?.role}</div>
                                    </td>
                                    <td className="h-14 px-4 align-middle text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                        {p.workedDays || 30} Gün
                                    </td>
                                    <td className="h-14 px-4 align-middle text-right text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                        {Number(p.salary).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        <div className="text-[10px] text-slate-400">{p.staff?.salaryType === 'GROSS' ? 'Brüt Anlaşma' : 'Net Anlaşma'}</div>
                                    </td>
                                    <td className="h-14 px-4 align-middle text-right text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                                        +{Number(p.bonus).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </td>
                                    <td className="h-14 px-4 align-middle text-right text-[13px] font-medium text-rose-600 dark:text-rose-400">
                                        -{totalTaxes.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </td>
                                    <td className="h-14 px-4 align-middle text-right text-[14px] font-black text-slate-900 dark:text-white">
                                        {Number(p.netPay).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </td>
                                    <td className="h-14 px-4 align-middle">
                                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${
                                            p.status === 'Ödendi' 
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                                : p.status === 'İşlendi'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="h-14 px-4 align-middle text-right pr-6">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {p.status !== 'Ödendi' ? (
                                                <button 
                                                    onClick={() => handleMarkAsPaid(p.id)}
                                                    className="h-8 px-3 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    ÖDENDİ YAP
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleUnlock(p.id)}
                                                    className="h-8 px-3 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                                    title="Ödeme Kilidini Açıp Yeniden Hesaplanabilir Yap"
                                                >
                                                    KİLİDİ AÇ
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </EnterpriseTable>
                ) : (
                    <EnterpriseEmptyState
                        icon={<FileText className="w-12 h-12" />}
                        title="Bordro Bulunamadı"
                        description={`${period} dönemi için henüz bordro hesaplaması yapılmamış. "Dönemi Hesapla" butonuna basarak işlemleri başlatabilirsiniz.`}
                        className="py-16"
                    />
                )}
            </EnterpriseCard>
        </div>
    );
}
