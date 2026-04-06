'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useModal } from '@/contexts/ModalContext';
import { Users, Plus, Search, Filter, Cpu, Play, Trash2, ArrowRight, Zap, RefreshCw, Layers, ShieldAlert, BarChart3, Database, AlertCircle } from 'lucide-react';
import { EnterprisePageShell, EnterpriseCard } from '@/components/ui/enterprise';

export default function TenantsPage() {
    const { showSuccess, showError, showConfirm } = useModal();
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
            if (!dryRun) fetchTenants(pagination.page);
        } catch (err) {
            console.error(err);
        } finally {
            setAutomationRunning(false);
        }
    };

    const deleteTenant = async (id: string, name: string) => {
        showConfirm('MÜŞTERİYİ SİL', `[${name}] ve tüm verilerini SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ?\nBu işlem geri alınamaz!`, async () => {
            try {
                const res = await fetch(`/api/admin/tenants/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showSuccess('Başarılı', 'Müşteri hesabı kalıcı olarak silindi.');
                    fetchTenants(pagination.page);
                } else {
                    const err = await res.json();
                    showError('Hata', err.error || 'Silme işlemi başarısız.');
                }
            } catch (err) {
                console.error(err);
                showError('Hata', 'Bağlantı hatası.');
            }
        });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTenants(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    // Status Badge Component
    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            ACTIVE: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-500/30 dark:text-emerald-400',
            TRIAL: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-500/30 dark:text-indigo-400',
            PAST_DUE: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/40 dark:border-amber-500/30 dark:text-amber-400',
            SUSPENDED: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-500/30 dark:text-red-400'
        };
        const labels: any = {
            ACTIVE: 'AKTİF',
            TRIAL: 'DENEME',
            PAST_DUE: 'GECİKMİŞ',
            SUSPENDED: 'ASKIDA'
        };
        return (
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm ${styles[status] || 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                {labels[status] || status}
            </span>
        );
    };

    // Risk Badge Component
    const RiskBadge = ({ risk, count }: { risk: string, count?: number }) => {
        const styles: any = {
            HEALTHY: 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-500',
            RISK: 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-500',
            HIGH_RISK: 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-500 animate-pulse',
            NEW: 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-500'
        };
        const labels: any = {
            HEALTHY: 'Sağlıklı',
            RISK: 'Riskli',
            HIGH_RISK: 'KRİTİK',
            NEW: 'Yeni'
        };
        return (
            <div className="flex flex-col gap-1 items-center">
                <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border text-center ${styles[risk] || 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                    {labels[risk] || risk}
                </span>
                {count ? (
                    <span className="text-[9px] text-amber-600 dark:text-amber-500 font-bold text-center flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {count} OLAY
                    </span>
                ) : null}
            </div>
        );
    };

    return (
        <EnterprisePageShell
            title="Müşteri Yönetimi (Tenants)"
            description="Platformdaki tüm müşteri hesaplarını (Tenant), lisans paketlerini ve risk durumlarını yönetin."
            actions={
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowAutomationPanel(!showAutomationPanel)} className={`p-2.5 rounded-xl transition-all shadow-sm border ${showAutomationPanel ? 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/40 dark:border-amber-500/30 dark:text-amber-400' : 'bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:border-amber-500/50'}`} title="Otomasyon & Growth Konsolu">
                        <Cpu className="w-5 h-5" />
                    </button>
                    <button onClick={() => fetchTenants(pagination.page)} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <Link href="/admin/tenants/new" className="bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Manuel Ekle
                    </Link>
                </div>
            }
        >
                

                {/* Automation Console Panel */}
                {showAutomationPanel && (
                    <div className="bg-slate-900 border border-slate-800 dark:bg-[#1e293b] dark:border-indigo-500/20 text-white p-6 md:p-8 rounded-3xl shadow-2xl animate-in slide-in-from-top-4 duration-300 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 dark:bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/20 dark:bg-indigo-500/20 rounded-xl">
                                    <Cpu className="w-8 h-8 text-amber-500 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl tracking-tight text-white">Growth & Retention Engine (G.R.E)</h3>
                                    <p className="text-slate-400 text-sm mt-1">Sistemi tarar, analiz eder, aksiyon tetikler.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => runAutomation(undefined, true)}
                                    disabled={automationRunning}
                                    className="flex-1 md:flex-none px-5 py-2.5 bg-slate-800 dark:bg-slate-800/80 hover:bg-slate-700 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm border border-slate-700 dark:border-slate-600"
                                >
                                    <Search className="w-4 h-4" /> Simüle Et
                                </button>
                                <button
                                    onClick={() => {
                                        showConfirm('Global Otomasyon', 'TÜM MÜŞTERİ HESAPLARINI TARIYORUM VE AKSİYON ALACAĞIM. Devam edilsin mi?', () => runAutomation());
                                    }}
                                    disabled={automationRunning}
                                    className="flex-1 md:flex-none px-5 py-2.5 bg-amber-500 hover:bg-amber-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-black dark:text-white rounded-xl text-sm font-black transition disabled:opacity-50 shadow-[0_0_20px_rgba(245,158,11,0.2)] dark:shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2"
                                >
                                    {automationRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                    {automationRunning ? 'ÇALIŞIYOR...' : 'GLOBAL TETİKLE'}
                                </button>
                            </div>
                        </div>

                        {automationResult && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/50 dark:bg-[#0f172a]/50 p-6 rounded-2xl border border-slate-800 dark:border-slate-700 relative z-10">
                                <div className="text-center group">
                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 flex flex-col items-center gap-2"><Database className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" /> Müşteri</div>
                                    <div className="text-3xl font-mono font-bold text-white tracking-tighter">{automationResult.stats?.processedTenants || 0}</div>
                                </div>
                                <div className="text-center group border-l border-slate-800 dark:border-slate-700">
                                    <div className="text-[10px] text-amber-400 uppercase font-black tracking-widest mb-2 flex flex-col items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500 group-hover:text-amber-300 transition-colors" /> Churn Riski</div>
                                    <div className="text-3xl font-mono font-bold text-white tracking-tighter">{automationResult.stats?.inactivityEvents || 0}</div>
                                </div>
                                <div className="text-center group border-l border-slate-800 dark:border-slate-700">
                                    <div className="text-[10px] text-red-400 uppercase font-black tracking-widest mb-2 flex flex-col items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500 group-hover:text-red-300 transition-colors" /> Limit Alarmı</div>
                                    <div className="text-3xl font-mono font-bold text-white tracking-tighter">{automationResult.stats?.quotaEvents || 0}</div>
                                </div>
                                <div className="text-center group border-l border-slate-800 dark:border-slate-700">
                                    <div className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-2 flex flex-col items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-500 group-hover:text-emerald-300 transition-colors" /> Büyüme Sinyali</div>
                                    <div className="text-3xl font-mono font-bold text-white tracking-tighter">{automationResult.stats?.growthEvents || 0}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white dark:bg-[#1e293b] p-2 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col sm:flex-row gap-2 mb-8">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Firma adı, e-posta, vergi no, vb..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-900 dark:text-white dark:placeholder-slate-500 transition-all shadow-inner font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative min-w-[200px]">
                        <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer shadow-inner"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Tüm Durumlar (ALL)</option>
                            <option value="ACTIVE">Aktif Filtrele</option>
                            <option value="TRIAL">Deneme Sürümü</option>
                            <option value="PAST_DUE">Ödeme Gecikmiş</option>
                            <option value="SUSPENDED">Dondurulmuş/Askıda</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans text-sm min-w-[1000px]">
                            <thead className="bg-slate-50/80 dark:bg-[#111827]/50 border-b border-slate-200 dark:border-white/5 text-[11px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 w-[30%]">Firma / Ünvan</th>
                                    <th className="px-6 py-4">Paket Rengi</th>
                                    <th className="px-6 py-4">Operasyonel Durum</th>
                                    <th className="px-6 py-4 text-center">Engine Risk/Event</th>
                                    <th className="px-6 py-4 text-center">Fatura Kotası</th>
                                    <th className="px-6 py-4">Kayıt / Onboarding</th>
                                    <th className="px-6 py-4 text-right">Yönetim</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-24 text-center">
                                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">VERİLER ÇEKİLİYOR...</span>
                                        </td>
                                    </tr>
                                ) : tenants.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-24 text-center">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-sm mx-auto mb-4">
                                                <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">Tenant (Müşteri) bulunamadı.</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                                                Arama kriterlerinize uyan kayıtlı bir müşteri organizasyonu sistemde yer almıyor.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    tenants?.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm font-bold text-lg ${t.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-500/30' : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                                                        {t.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-slate-900 dark:text-white leading-tight">{t.name}</div>
                                                            {t.highValue && (
                                                                <span title="VIP / Enterprise Müşteri" className="cursor-help bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-black uppercase border border-rose-200 dark:border-rose-500/30">VIP VEYA YÜKSEK CİRO</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{t.ownerEmail}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-max shadow-sm">
                                                    <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                    {t.plan}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <StatusBadge status={t.status} />
                                            </td>
                                            <td className="px-6 py-4 align-middle text-center">
                                                <RiskBadge risk={t.risk} count={t.growthEventsCount} />
                                            </td>
                                            <td className="px-6 py-4 align-middle text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded w-max border border-slate-100 dark:border-slate-800">
                                                        {t.stats.invoices} / {t.stats.invoiceLimit}
                                                    </span>
                                                    {/* Progress Bar */}
                                                    {t.stats.invoiceLimit !== '∞' && (
                                                        <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${t.stats.invoices / Number(t.stats.invoiceLimit) > 0.9 ? 'bg-red-500 dark:bg-red-400' : 'bg-blue-500 dark:bg-indigo-500'}`}
                                                                style={{ width: `${Math.min(100, (t.stats.invoices / Number(t.stats.invoiceLimit)) * 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-slate-600 dark:text-slate-400 font-medium text-xs">
                                                {new Date(t.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle">
                                                <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => runAutomation(t.id)}
                                                        disabled={automationRunning}
                                                        className="text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-200 dark:border-amber-500/30 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shadow-sm focus:ring-2 focus:ring-amber-500"
                                                        title="Sadece bu müşteri için otomasyonu tetikle"
                                                    >
                                                        <Cpu className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTenant(t.id, t.name)}
                                                        className="text-red-600 dark:text-red-400 p-1.5 border border-transparent hover:border-red-200 dark:hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all focus:ring-2 focus:ring-red-500"
                                                        title="Müşteriyi Kalıcı Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <Link href={`/admin/tenants/${t.id}`} className="inline-flex h-8 items-center gap-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                                                        Detay <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t border-slate-100 dark:border-white/5 px-6 py-4 bg-slate-50/50 dark:bg-[#111827]/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                            Toplam: {pagination.totalPages} Sayfa
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => fetchTenants(pagination.page - 1)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/50"
                            >
                                Geri
                            </button>
                            <button
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => fetchTenants(pagination.page + 1)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/50"
                            >
                                İleri
                            </button>
                        </div>
                    </div>
                </div>
            </EnterprisePageShell>
    );
}

