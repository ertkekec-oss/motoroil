
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TenantsPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [automationRunning, setAutomationRunning] = useState(false);
    const [automationResult, setAutomationResult] = useState<any>(null);
    const [showAutomationPanel, setShowAutomationPanel] = useState(false);

    const fetchTenants = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: String(page),
                limit: '10',
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter })
            });

            const res = await fetch(`/api/admin/tenants?${query}`);
            const data = await res.json();

            if (data.data) {
                setTenants(data.data);
                setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const runAutomation = async (tenantId?: string, dryRun = false) => {
        setAutomationRunning(true);
        try {
            const res = await fetch('/api/admin/automation/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, dryRun })
            });
            const data = await res.json();
            setAutomationResult(data);
            if (!dryRun) fetchTenants(pagination.page); // Refresh data if not dry run
        } catch (err) {
            console.error(err);
        } finally {
            setAutomationRunning(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchTenants(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    // Status Badge Component
    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            TRIAL: 'bg-blue-100 text-blue-700 border-blue-200',
            PAST_DUE: 'bg-amber-100 text-amber-700 border-amber-200',
            SUSPENDED: 'bg-red-100 text-red-700 border-red-200'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
                {status}
            </span>
        );
    };

    // Risk Badge Component (Phase 9)
    const RiskBadge = ({ risk, count }: { risk: string, count?: number }) => {
        const styles: any = {
            HEALTHY: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            RISK: 'bg-amber-50 text-amber-600 border-amber-100',
            HIGH_RISK: 'bg-red-50 text-red-600 border-red-100 animate-pulse',
            NEW: 'bg-blue-50 text-blue-600 border-blue-100'
        };
        const labels: any = {
            HEALTHY: 'Sağlıklı',
            RISK: 'Riskli',
            HIGH_RISK: 'KRİTİK',
            NEW: 'Yeni'
        };
        return (
            <div className="flex flex-col gap-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border text-center ${styles[risk] || 'bg-slate-50 text-slate-500'}`}>
                    {labels[risk] || risk}
                </span>
                {count ? (
                    <span className="text-[9px] text-amber-600 font-bold text-center">
                        ⚡ {count} OLAY
                    </span>
                ) : null}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Müşteriler (Tenants)</h1>
                    <p className="text-sm text-slate-500">Platformdaki tüm müşteri hesaplarını yönet.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAutomationPanel(!showAutomationPanel)}
                        className={`p-2 rounded-lg transition ${showAutomationPanel ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:text-amber-600'}`}
                        title="Otomasyon Konsolu"
                    >
                        <span className="text-xl">🤖</span>
                    </button>
                    <button onClick={() => fetchTenants(pagination.page)} className="p-2 text-slate-400 hover:text-blue-600 transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <Link href="/admin/tenants/new" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm">
                        + Manuel Ekle
                    </Link>
                </div>
            </div>

            {/* Automation Console Panel */}
            {showAutomationPanel && (
                <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-2xl animate-fade-in space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚡</span>
                            <div>
                                <h3 className="font-bold text-lg">Growth & Retention Engine</h3>
                                <p className="text-slate-400 text-xs">Tüm sistemi tarar (Churn, Limit, Büyüme Sinyalleri).</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => runAutomation(undefined, true)}
                                disabled={automationRunning}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition disabled:opacity-50"
                            >
                                🔍 Dry Run (Simüle Et)
                            </button>
                            <button
                                onClick={() => { if (window.confirm('TÜM SİSTEMİ TARIYORUM. Emin misiniz?')) runAutomation(); }}
                                disabled={automationRunning}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-black transition disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                            >
                                {automationRunning ? 'ÇALIŞIYOR...' : '🚀 GLOBAL ÇALIŞTIR'}
                            </button>
                        </div>
                    </div>

                    {automationResult && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="text-center">
                                <div className="text-xs text-slate-400 uppercase font-black">Müşteri</div>
                                <div className="text-xl font-bold">{automationResult.stats?.processedTenants || 0}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-amber-400 uppercase font-black">Churn Riski</div>
                                <div className="text-xl font-bold">{automationResult.stats?.inactivityEvents || 0}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-red-400 uppercase font-black">Limit Alarm</div>
                                <div className="text-xl font-bold">{automationResult.stats?.quotaEvents || 0}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-emerald-400 uppercase font-black">Büyüme Analizi</div>
                                <div className="text-xl font-bold">{automationResult.stats?.growthEvents || 0}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Firma adı, E-posta veya ID..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">Tüm Durumlar</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="TRIAL">Deneme</option>
                    <option value="PAST_DUE">Ödeme Gecikmiş</option>
                    <option value="SUSPENDED">Askıda</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Firma / Tenant</th>
                            <th className="px-6 py-4">Paket</th>
                            <th className="px-6 py-4">Durum</th>
                            <th className="px-6 py-4 text-center">Risk / Sinyal</th>
                            <th className="px-6 py-4 text-center">Fatura Kullanımı</th>
                            <th className="px-6 py-4">Kayıt Tarihi</th>
                            <th className="px-6 py-4 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Yükleniyor...</td></tr>
                        ) : tenants.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                        ) : (
                            tenants.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium text-slate-900">{t.name}</div>
                                            {t.highValue && (
                                                <span title="Limitine yaklaşan yüksek değerli müşteri" className="cursor-help">🔥</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500">{t.ownerEmail}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {t.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <StatusBadge status={t.status} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <RiskBadge risk={t.risk} count={t.growthEventsCount} />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="font-medium text-slate-700">{t.stats.invoices} / {t.stats.invoiceLimit}</span>
                                            {/* Progress Bar */}
                                            {t.stats.invoiceLimit !== '∞' && (
                                                <div
                                                    className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"
                                                >
                                                    <div
                                                        className={`h-full rounded-full ${t.stats.invoices / Number(t.stats.invoiceLimit) > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${Math.min(100, (t.stats.invoices / Number(t.stats.invoiceLimit)) * 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => runAutomation(t.id)}
                                                disabled={automationRunning}
                                                className="text-amber-600 hover:text-amber-700 font-black text-[10px] border border-amber-200 px-2 py-1 rounded bg-amber-50"
                                                title="Sadece bu müşteri için otomasyonu tetikle"
                                            >
                                                🤖 TETİKLE
                                            </button>
                                            <Link href={`/admin/tenants/${t.id}`} className="text-blue-600 hover:text-blue-700 font-medium text-xs">
                                                Yönet &rarr;
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="border-t border-slate-100 p-4 flex justify-between items-center text-sm text-slate-500">
                    <span>Toplam {pagination.totalPages} sayfa</span>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => fetchTenants(pagination.page - 1)}
                            className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                            Önceki
                        </button>
                        <button
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => fetchTenants(pagination.page + 1)}
                            className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                            Sonraki
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

