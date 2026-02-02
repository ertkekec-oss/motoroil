"use client";

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function PayrollModule() {
    const { showSuccess, showError } = useModal();
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
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
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
                showSuccess('Oluşturuldu', data.message);
                fetchPayrolls();
            } else {
                showError('Hata', data.error);
            }
        } catch (error) { showError('Hata', 'Oluşturulamadı'); }
        finally { setLoading(false); }
    };

    const totalSalary = payrolls.reduce((acc, curr) => acc + Number(curr.netPay), 0);

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white">Maaş Bordrosu</h3>
                    <input type="month" className="input input-sm input-bordered bg-black/20 text-white"
                        value={period} onChange={e => setPeriod(e.target.value)} />
                </div>
                <button onClick={handleGenerate} className="btn btn-warning btn-sm" disabled={loading}>
                    {loading ? 'İşleniyor...' : 'Bu Dönemi Oluştur'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="stat bg-white/5 rounded-xl border border-white/10">
                    <div className="stat-title text-gray-400">Toplam Ödenecek</div>
                    <div className="stat-value text-amber-400 text-2xl">{totalSalary.toLocaleString('tr-TR')} ₺</div>
                    <div className="stat-desc">Dönem: {period}</div>
                </div>
                <div className="stat bg-white/5 rounded-xl border border-white/10">
                    <div className="stat-title text-gray-400">Personel Sayısı</div>
                    <div className="stat-value text-white text-2xl">{payrolls.length}</div>
                </div>
            </div>

            <div className="overflow-x-auto card glass p-0">
                <table className="table w-full">
                    <thead className="bg-black/20 text-gray-400">
                        <tr>
                            <th>Personel</th>
                            <th>Brüt/Baz Maaş</th>
                            <th>Prim/Bonus</th>
                            <th>Kesintiler</th>
                            <th>NET ÖDENECEK</th>
                            <th>Durum</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrolls.map((p: any) => (
                            <tr key={p.id} className="hover:bg-white/5">
                                <td className="font-bold">{p.staff?.name}</td>
                                <td>{Number(p.salary).toLocaleString('tr-TR')} ₺</td>
                                <td>{Number(p.bonus).toLocaleString('tr-TR')} ₺</td>
                                <td className="text-red-400">-{Number(p.deductions).toLocaleString('tr-TR')} ₺</td>
                                <td className="font-black text-amber-400 text-lg">{Number(p.netPay).toLocaleString('tr-TR')} ₺</td>
                                <td>
                                    <span className={`badge ${p.status === 'Ödendi' ? 'badge-success' : 'badge-warning'}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td>
                                    {p.status !== 'Ödendi' && (
                                        <button className="btn btn-xs btn-success btn-outline">Öde</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {payrolls.length === 0 && (
                            <tr><td colSpan={7} className="text-center p-8 text-gray-500">Bu dönem için bordro kaydı bulunamadı. "Bu Dönemi Oluştur" butonuna basarak başlatabilirsiniz.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
