
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

export default function TenantDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const { showSuccess, showError, showConfirm } = useModal();
    const router = useRouter();
    const [tenant, setTenant] = useState<any>(null);
    const [usage, setUsage] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [errors, setErrors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showModal, setShowModal] = useState<string | null>(null); // 'PLAN', 'TRIAL', 'STATUS'

    // Form States
    const [selectedPlan, setSelectedPlan] = useState('');
    const [trialDays, setTrialDays] = useState(7);
    const [suspendReason, setSuspendReason] = useState('Payment Failed');

    // Plans list (Mock or API fetch)
    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            // Fetch plans for modal
            fetch('/api/billing/plans').then(r => r.json()).then(setPlans).catch(console.error);

            // Fetch Tenant Details
            try {
                const res = await fetch(`/api/admin/tenants/${params.id}`);
                const data = await res.json();
                if (data.tenant) {
                    setTenant(data.tenant);
                    setUsage(data.usage);
                    setHistory(data.history);
                    setErrors(data.errors);
                    setSelectedPlan(data.tenant.subscription?.planId);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [params.id]);

    const handleAction = async (action: string, payload: any) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/tenants/${params.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            });
            const data = await res.json();
            if (res.status === 200) {
                showSuccess('Başarılı', 'İşlem Başarılı');
                window.location.reload();
            } else {
                showError('Hata', 'Hata: ' + data.error);
            }
        } catch (e: any) {
            showError('Hata', 'Sistem Hatası: ' + e.message);
        } finally {
            setActionLoading(false);
            setShowModal(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;
    if (!tenant) return <div className="p-8 text-center text-red-500">Tenant bulunamadı.</div>;

    const sub = tenant.subscription;
    const plan = sub?.plan;

    // Calculate Usage Percent
    const invoiceLimit = plan?.limits?.find((l: any) => l.resource === 'monthly_documents')?.limit || 0;
    const invoiceUsage = usage?.currentMonthInvoices || 0;
    const invoicePercent = invoiceLimit > 0 ? (invoiceUsage / invoiceLimit) * 100 : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. HERO SECTION */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        {tenant.name}
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${sub?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                            sub?.status === 'PAST_DUE' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-700'
                            }`}>
                            {sub?.status}
                        </span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded w-fit">
                        <span>{tenant.id}</span>
                        <button className="text-blue-500 hover:underline text-xs" onClick={() => navigator.clipboard.writeText(tenant.id)}>(Kopyala)</button>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{tenant.ownerEmail} • {plan?.name || 'No Plan'} ({sub?.period})</p>
                </div>

                <div className="flex gap-2">
                    {sub?.status !== 'SUSPENDED' && (
                        <button onClick={() => setShowModal('STATUS_SUSPEND')} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition shadow-sm">
                            🔴 Suspend
                        </button>
                    )}
                    {sub?.status === 'SUSPENDED' && (
                        <button onClick={() => handleAction('SET_STATUS', { status: 'ACTIVE' })} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm">
                            🟢 Activate
                        </button>
                    )}
                    <button onClick={() => setShowModal('TRIAL')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm">
                        ⏳ Trial Uzat
                    </button>
                    <button onClick={() => setShowModal('PLAN')} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm">
                        🔁 Plan Değiştir
                    </button>
                </div>
            </div>

            {/* 2. QUOTA DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Monthly Invoices */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Aylık Fatura</h3>
                        <span className="text-xs text-slate-400">{plan?.interval}</span>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-slate-900">{invoiceUsage}</span>
                        <span className="text-sm text-slate-400 mb-1">/ {invoiceLimit === -1 ? '∞' : invoiceLimit}</span>
                    </div>
                    {invoiceLimit > 0 && (
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${invoicePercent > 90 ? 'bg-red-500' : invoicePercent > 75 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, invoicePercent)}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Users */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Kullanıcılar</h3>
                        <span className="text-xs text-slate-400">Total</span>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-slate-900">{tenant.users?.length || 0}</span>
                        {/* Find User limit */}
                        <span className="text-sm text-slate-400 mb-1">/ {plan?.limits?.find((l: any) => l.resource === 'users')?.limit || 0}</span>
                    </div>
                </div>

                {/* Companies */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Şirketler</h3>
                        <span className="text-xs text-slate-400">Total</span>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-slate-900">{tenant.companies?.length || 0}</span>
                        <span className="text-sm text-slate-400 mb-1">/ {plan?.limits?.find((l: any) => l.resource === 'companies')?.limit || 0}</span>
                    </div>
                </div>
            </div>

            {/* 3. SYSTEM STATUS & LOGS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4 bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Sistem Logları & Geçmiş</h3>
                </div>
                <div className="p-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Son Hatalar (External Requests)</h4>
                    <div className="overflow-x-auto mb-8">
                        <table className="w-full text-left text-xs">
                            <thead className="text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="py-2">Tarih</th>
                                    <th className="py-2">Provider</th>
                                    <th className="py-2">Entity ID</th>
                                    <th className="py-2">Payload/Error</th>
                                    <th className="py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                                {errors.length === 0 ? (
                                    <tr><td colSpan={5} className="py-4 text-center text-slate-400">Hata kaydı bulunmuyor.</td></tr>
                                ) : errors.map(err => (
                                    <tr key={err.id}>
                                        <td className="py-2">{new Date(err.updatedAt).toLocaleString()}</td>
                                        <td className="py-2 font-medium">{err.provider}</td>
                                        <td className="py-2 font-mono">{err.entityId}</td>
                                        <td className="py-2 truncate max-w-xs" title={JSON.stringify(err.responsePayload)}>{JSON.stringify(err.responsePayload)}</td>
                                        <td className="py-2"><span className="text-red-600 font-bold">{err.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-3">Abonelik Değişimleri</h4>
                    <ul className="space-y-3">
                        {history.length === 0 ? (
                            <li className="text-sm text-slate-400">Kayıt yok.</li>
                        ) : history.map(h => (
                            <li key={h.id} className="text-sm flex gap-2">
                                <span className="text-slate-400 font-mono text-xs">{new Date(h.createdAt).toLocaleDateString()}</span>
                                <span className="font-medium text-slate-800">{h.action}</span>
                                <span className="text-slate-500">Plan changed from {h.prevPlanId} to {h.newPlanId}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* MODALS */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        {showModal === 'PLAN' && (
                            <>
                                <h3 className="text-lg font-bold mb-4">Plan Değiştir</h3>
                                <div className="space-y-2 mb-6">
                                    {plans.map(p => (
                                        <label key={p.id} className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${selectedPlan === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                                            <input type="radio" name="plan" value={p.id} checked={selectedPlan === p.id} onChange={(e) => setSelectedPlan(e.target.value)} className="mr-3" />
                                            <div>
                                                <div className="font-medium">{p.name}</div>
                                                <div className="text-xs text-slate-500">{p.price} {p.currency} / {p.interval}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setShowModal(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">İptal</button>
                                    <button onClick={() => handleAction('CHANGE_PLAN', { planId: selectedPlan })} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                        {actionLoading ? '...' : 'Planı Güncelle'}
                                    </button>
                                </div>
                            </>
                        )}

                        {showModal === 'TRIAL' && (
                            <>
                                <h3 className="text-lg font-bold mb-4">Trial Süresini Uzat</h3>
                                <p className="text-sm text-slate-500 mb-4">Mevcut bitiş tarihine seçilen gün kadar eklenir.</p>
                                <div className="flex gap-2 mb-6">
                                    {[3, 7, 14, 30].map(d => (
                                        <button key={d} onClick={() => setTrialDays(d)} className={`flex-1 py-2 border rounded-lg ${trialDays === d ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                                            +{d} Gün
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setShowModal(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">İptal</button>
                                    <button onClick={() => handleAction('EXTEND_TRIAL', { days: trialDays })} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                        {actionLoading ? '...' : 'Süreyi Uzat'}
                                    </button>
                                </div>
                            </>
                        )}

                        {showModal === 'STATUS_SUSPEND' && (
                            <>
                                <h3 className="text-lg font-bold mb-4 text-red-600">Hesabı Askıya Al</h3>
                                <p className="text-sm text-slate-600 mb-4">Bu işlem müşterinin giriş yapmasını ve API kullanmasını engeller.</p>
                                <select className="w-full border p-2 rounded mb-6" value={suspendReason} onChange={e => setSuspendReason(e.target.value)}>
                                    <option value="Payment Failed">Ödeme Alınamadı</option>
                                    <option value="Policy Violation">Kullanım İhlali</option>
                                    <option value="Other">Diğer</option>
                                </select>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setShowModal(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">İptal</button>
                                    <button onClick={() => handleAction('SET_STATUS', { status: 'SUSPENDED', reason: suspendReason })} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                                        {actionLoading ? '...' : 'Hesabı Dondur'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
