import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import BankIntegrationOnboarding from './Banking/BankIntegrationOnboarding';
import { apiFetch } from '@/lib/api-client';
import {
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseCard,
    EnterpriseSectionHeader,
    EnterpriseButton,
    EnterpriseField,
} from "@/components/ui/enterprise";

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// Tüm state, handler, API, fetch, context akışı aynıdır.
// Yalnızca UI katmanı (className + wrapper) Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

// ──── Shared sub-components ────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <label className="flex items-center cursor-pointer select-none">
            <div className={`w-11 h-6 rounded-full relative transition-all duration-300 ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${checked ? 'left-6' : 'left-1'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
        </label>
    );
}

function TestResult({ result }: { result?: string }) {
    if (!result) return null;
    const ok = result.includes('✅');
    return (
        <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 animate-in zoom-in-95 text-sm font-bold ${ok ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-500' : 'bg-red-50 dark:bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500'}`}>
            {result}
        </div>
    );
}

function BranchSelect({ value, onChange, branches }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; branches: any[] }) {
    return (
        <EnterpriseSelect value={value} onChange={onChange}>
            {branches.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
            {branches.length === 0 && <option value="Merkez">Merkez</option>}
        </EnterpriseSelect>
    );
}

// ──── Main Component ───────────────────────────────────────────────────────
export default function IntegrationsContent() {
    const { showSuccess, showError } = useModal();
    const [activeTab, setActiveTab] = useState<'efatura' | 'marketplace' | 'pos' | 'banking'>('efatura');

    // ── State (unchanged) ──
    const [eFaturaSettings, setEFaturaSettings] = useState({
        provider: 'nilvera',
        apiUrl: 'https://api.nilvera.com/v1',
        apiKey: '',
        apiSecret: '',
        username: '',
        password: '',
        companyVkn: '',
        companyTitle: '',
        environment: 'test',
        autoSend: false,
        autoApprove: false
    });

    const [posSettings, setPosSettings] = useState({
        provider: 'odeal',
        apiKey: '',
        apiPrefix: 'https://api.odeal.com/v1',
        terminalId: '',
        autoReceipt: true,
        testMode: true
    });

    const [marketplaceSettings, setMarketplaceSettings] = useState({
        trendyol: { enabled: false, apiKey: '', apiSecret: '', supplierId: '', autoSync: false, syncInterval: 15, branch: 'Merkez' },
        hepsiburada: { enabled: false, merchantId: '', username: '', password: '', autoSync: false, syncInterval: 15, isTest: false, branch: 'Merkez' },
        n11: { enabled: false, apiKey: '', apiSecret: '', autoSync: false, syncInterval: 15, branch: 'Merkez' },
        amazon: { enabled: false, sellerId: '', mwsAuthToken: '', accessKey: '', secretKey: '', autoSync: false, syncInterval: 30, branch: 'Merkez' },
        pazarama: { enabled: false, apiKey: '', apiSecret: '', isTest: false, autoSync: false, syncInterval: 15, branch: 'Merkez' },
        custom: { enabled: true, url: 'https://www.periodya.com/xml.php?c=siparisler&xmlc=10a4cd8d5e', autoSync: false, syncInterval: 60, branch: 'Merkez' }
    });

    const [testResults, setTestResults] = useState<{ [key: string]: string }>({});
    const [stats, setStats] = useState<any>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ── Handlers (unchanged) ──
    const fetchBranches = async () => {
        try {
            const res = await apiFetch('/api/branches');
            const data = await res.json();
            if (data.success) setBranches(data.branches);
        } catch (e) { console.error('Branches error:', e); }
    };

    const testEFaturaConnection = async () => {
        setIsTesting(true);
        setTestResults({ ...testResults, efatura: '⏳ Bağlantı test ediliyor...' });
        try {
            const res = await apiFetch('/api/sales/formal-invoice-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: eFaturaSettings.apiKey, username: eFaturaSettings.username, password: eFaturaSettings.password, environment: eFaturaSettings.environment, companyVkn: eFaturaSettings.companyVkn })
            });
            const data = await res.json();
            setTestResults({ ...testResults, efatura: data.success ? '✅ Nilvera Bağlantısı Başarılı!' : `❌ ${data.error}` });
        } catch (error: any) {
            setTestResults({ ...testResults, efatura: `❌ Bağlantı hatası: ${error.message}` });
        }
        setIsTesting(false);
    };

    const testMarketplaceConnection = async (marketplace: string) => {
        setIsTesting(true);
        setTestResults(prev => ({ ...prev, [marketplace]: '⏳ Test ediliyor...' }));
        try {
            if (marketplace === 'custom') {
                const response = await apiFetch('/api/integrations/ecommerce/sync', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    setTestResults(prev => ({ ...prev, [marketplace]: `✅ Bağlantı başarılı! ${data.count} sipariş bulundu.` }));
                } else throw new Error(data.error || 'API Hatası');
            } else {
                const config = { ...(marketplaceSettings as any)[marketplace] };
                const response = await apiFetch('/api/integrations/marketplace/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: marketplace, config })
                });
                const data = await response.json();
                if (data.success) {
                    let msg = `✅ ${data.message || 'Bağlantı ve senkronizasyon başarılı!'}`;
                    if (data.errors?.length > 0) msg += `\n❌ ${data.errors.length} HATA OLUŞTU`;
                    setTestResults(prev => ({ ...prev, [marketplace]: msg }));
                } else throw new Error(data.error || 'Bağlantı doğrulanamadı');
            }
        } catch (error: any) {
            setTestResults(prev => ({ ...prev, [marketplace]: `❌ Hata: ${error.message || 'Bağlantı kurulamadı'}` }));
        }
        setIsTesting(false);
    };

    const fetchStats = async () => {
        try {
            const res = await apiFetch('/api/integrations/marketplace/stats');
            const data = await res.json();
            if (data.success) setStats(data.stats);
        } catch (e) { console.error('Stats error:', e); }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiFetch('/api/integrations/settings/save');
                const data = await res.json();
                if (data.success) {
                    if (data.eFaturaSettings) setEFaturaSettings(data.eFaturaSettings);
                    if (data.posSettings) setPosSettings(data.posSettings);
                    if (data.marketplaceSettings) setMarketplaceSettings(prev => ({ ...prev, ...data.marketplaceSettings }));
                }
            } catch (e) {
                console.error('Fetch error:', e);
                const savedEFatura = localStorage.getItem('periodya_efatura_settings');
                const savedMarketplace = localStorage.getItem('periodya_marketplace_settings');
                const savedPos = localStorage.getItem('periodya_pos_settings');
                if (savedEFatura) setEFaturaSettings(JSON.parse(savedEFatura));
                if (savedMarketplace) setMarketplaceSettings(JSON.parse(savedMarketplace));
                if (savedPos) setPosSettings(JSON.parse(savedPos));
            }
        };
        fetchSettings();
        fetchBranches();
        if (activeTab === 'marketplace') fetchStats();
    }, [activeTab]);

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            const response = await apiFetch('/api/integrations/settings/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ marketplaceSettings, eFaturaSettings, posSettings })
            });
            const data = await response.json();
            if (data.success) {
                showSuccess('Başarılı', '✅ Tüm ayarlar veritabanına kaydedildi.');
                localStorage.setItem('periodya_efatura_settings', JSON.stringify(eFaturaSettings));
                localStorage.setItem('periodya_marketplace_settings', JSON.stringify(marketplaceSettings));
                localStorage.setItem('periodya_pos_settings', JSON.stringify(posSettings));
            } else {
                showError('Hata', '⚠️ Ayarlar kaydedilemedi: ' + data.error);
            }
        } catch {
            showError('Hata', 'Sunucu bağlantı hatası.');
            localStorage.setItem('periodya_efatura_settings', JSON.stringify(eFaturaSettings));
            localStorage.setItem('periodya_marketplace_settings', JSON.stringify(marketplaceSettings));
            localStorage.setItem('periodya_pos_settings', JSON.stringify(posSettings));
            showSuccess('Yerel Kayıt', '✅ Ayarlar tarayıcıya (yerel) kaydedildi.');
        }
        setIsSaving(false);
    };

    // ── UI ──────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-5xl animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <EnterpriseSectionHeader
                    icon="🔌"
                    title="Entegrasyonlar"
                    subtitle="E-Fatura, Ödeal ve Pazaryeri bağlantılarınızı bu panelden yönetebilir, senkronizasyon ayarlarınızı yapılandırabilirsiniz."
                />
                <div className="shrink-0">
                    <EnterpriseButton variant="primary" onClick={saveSettings} disabled={isSaving}>
                        {isSaving ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> KAYDEDİLİYOR</>
                        ) : (
                            <><span>💾</span> AYARLARI KAYDET</>
                        )}
                    </EnterpriseButton>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit mb-8">
                {[
                    { id: 'efatura', label: 'E-Fatura (Nilvera)', icon: '📄' },
                    { id: 'marketplace', label: 'Pazaryerleri', icon: '🛒' },
                    { id: 'pos', label: 'Yazar Kasa POS', icon: '💳' },
                    { id: 'banking', label: 'Banka Entegrasyonu', icon: '🏦' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-2.5 ${activeTab === tab.id
                            ? 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-900/5 dark:hover:bg-white/5'
                            }`}
                    >
                        <span className="text-base">{tab.icon}</span>
                        <span>{tab.label.toUpperCase()}</span>
                    </button>
                ))}
            </div>

            {/* ── E-Fatura Tab ── */}
            {activeTab === 'efatura' && (
                <div className="animate-in fade-in duration-300">
                    <EnterpriseCard>
                        {/* Header row */}
                        <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">📄</div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">E-Fatura Entegrasyonu</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Nilvera GİB uyumlu e-fatura servis sağlayıcı ayarları</p>
                            </div>
                            <div className="sm:ml-auto">
                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${eFaturaSettings.environment === 'production' ? 'bg-blue-600/10 text-blue-600 dark:text-blue-500 border-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                    {eFaturaSettings.environment === 'production' ? '🚀 Canlı Ortam' : '🧪 Test Ortamı'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Left column */}
                            <div className="space-y-6">
                                {/* Ortam seçici */}
                                <EnterpriseField label="ÇALIŞMA ORTAMI SEÇİMİ">
                                    <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        {['test', 'production'].map((env) => (
                                            <button
                                                key={env}
                                                onClick={() => setEFaturaSettings({ ...eFaturaSettings, environment: env })}
                                                className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${eFaturaSettings.environment === env
                                                    ? (env === 'production' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 dark:bg-slate-600 text-white shadow-sm')
                                                    : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                {env === 'production' ? 'Canlı Ortam' : 'Test Ortamı'}
                                            </button>
                                        ))}
                                    </div>
                                </EnterpriseField>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <EnterpriseField label="ŞİRKET VKN / TCKN">
                                        <EnterpriseInput value={eFaturaSettings.companyVkn} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEFaturaSettings({ ...eFaturaSettings, companyVkn: e.target.value })} />
                                    </EnterpriseField>
                                    <EnterpriseField label="ŞİRKET ÜNVANI">
                                        <EnterpriseInput placeholder="Fatura başlığı..." value={eFaturaSettings.companyTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEFaturaSettings({ ...eFaturaSettings, companyTitle: e.target.value })} />
                                    </EnterpriseField>
                                </div>

                                <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-xl text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    💡 Bilgileri Nilvera panelindeki "Şirket Bilgileri" alanıyla birebir aynı doldurmalısınız. Yanlış VKN kullanımı fatura reddine sebep olabilir.
                                </div>
                            </div>

                            {/* Right column */}
                            <div className="space-y-4">
                                <EnterpriseField label="API ADRESİ">
                                    <EnterpriseInput value={eFaturaSettings.apiUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEFaturaSettings({ ...eFaturaSettings, apiUrl: e.target.value })} />
                                </EnterpriseField>
                                <EnterpriseField label="API KEY (OPSİYONEL)">
                                    <EnterpriseInput placeholder="🔑 Opsiyonel anahtar" value={eFaturaSettings.apiKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEFaturaSettings({ ...eFaturaSettings, apiKey: e.target.value })} />
                                </EnterpriseField>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />VEYA KULLANICI BİLGİLERİ<div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <EnterpriseField label="KULLANICI ADI">
                                        <EnterpriseInput placeholder="test01@nilvera.com" value={eFaturaSettings.username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEFaturaSettings({ ...eFaturaSettings, username: e.target.value })} />
                                    </EnterpriseField>
                                    <EnterpriseField label="PORTAL ŞİFRESİ">
                                        <EnterpriseInput type="password" placeholder="••••••••" value={eFaturaSettings.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEFaturaSettings({ ...eFaturaSettings, password: e.target.value })} />
                                    </EnterpriseField>
                                </div>
                            </div>
                        </div>

                        {/* Toggle switches */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                            {[
                                { key: 'autoSend', label: 'Otomatik Gönderim', desc: 'Satış tamamlandığında faturayı otomatik oluşturur.' },
                                { key: 'autoApprove', label: 'Otomatik Onay', desc: 'Gelen faturaları otomatik olarak yanıtla/onayla.' }
                            ].map(({ key, label, desc }) => (
                                <label key={key} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none">
                                    <ToggleSwitch checked={(eFaturaSettings as any)[key]} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, [key]: e.target.checked })} />
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{label}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Test button */}
                        <div className="mt-6">
                            <EnterpriseButton variant="secondary" onClick={testEFaturaConnection} disabled={isTesting} className="w-full">
                                {isTesting ? <><div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" />Test Ediliyor...</> : <>🔍 BAĞLANTIYI ŞİMDİ TEST ET</>}
                            </EnterpriseButton>
                            <TestResult result={testResults.efatura} />
                        </div>
                    </EnterpriseCard>
                </div>
            )}

            {/* ── POS Tab ── */}
            {activeTab === 'pos' && (
                <div className="animate-in fade-in duration-300">
                    <EnterpriseCard>
                        <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">💳</div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Ödeal Yazar Kasa POS</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ödeme sistemleri ve yazar kasa POS entegrasyonu</p>
                            </div>
                            <div className="sm:ml-auto">
                                <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-600/10 text-blue-600 dark:text-blue-500 border border-blue-500/20">
                                    Durum: AKTİF
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <EnterpriseField label="ÖDEAL API TOKEN (CANLI)">
                                <EnterpriseInput placeholder="Od_Live_••••••••••••" value={posSettings.apiKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPosSettings({ ...posSettings, apiKey: e.target.value })} />
                            </EnterpriseField>
                            <EnterpriseField label="TERMİNAL / CİHAZ SERİ NO">
                                <EnterpriseInput placeholder="9988XXXX" value={posSettings.terminalId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPosSettings({ ...posSettings, terminalId: e.target.value })} />
                            </EnterpriseField>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            {[
                                { key: 'autoReceipt', label: 'Otomatik Fiş Kes', desc: 'Başarılı ödeme sonrası otomatik döküm alır.' },
                                { key: 'testMode', label: 'Geliştirici Modu', desc: 'Sanal bir işlem akışı simüle eder.' }
                            ].map(({ key, label, desc }) => (
                                <label key={key} className="flex items-center gap-4 cursor-pointer select-none">
                                    <ToggleSwitch checked={(posSettings as any)[key]} onChange={(e) => setPosSettings({ ...posSettings, [key]: e.target.checked })} />
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{label}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">{desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="mt-5 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 dark:text-slate-400 space-y-2 border border-slate-200 dark:border-slate-700">
                            <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[10px] mb-2">ℹ️ İşlem Akışı</div>
                            <p>• Satış POS ekranında "Ödeal POS" seçildiğinde tutar otomatik olarak cihaz ekranına düşer.</p>
                            <p>• Kart çekimi başarılı olduğu anda Periodya&apos;da "Satış Onaylandı" durumuna geçer ve kasa kaydı oluşur.</p>
                            <p>• Cihaz üzerinden Z raporu ve EKÜ dökümleri için Ödeal panelini kullanınız.</p>
                        </div>
                    </EnterpriseCard>
                </div>
            )}

            {/* ── Marketplace Tab ── */}
            {activeTab === 'marketplace' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Stats row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Açık Alacaklar', val: `₺${stats?.financials?.openReceivables?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) ?? '—'}`, sub: 'Tahsilat Bekleyen Brüt', trend: '↑' },
                            { label: 'Askıda Settlement', val: `${stats?.financials?.pendingSettlements || 0} İşlem`, sub: 'Muhasebe bekleyenler', trend: '⏳' },
                            { label: '24 Saatlik Sipariş', val: `${stats?.orders?.last24h || 0} Adet`, sub: 'Gerçek Zamanlı Akış', trend: '📦' },
                            { label: 'Son Sync Status', val: stats?.configs?.some((c: any) => c.lastSync) ? new Date(Math.max(...stats.configs.filter((c: any) => c.lastSync).map((c: any) => new Date(c.lastSync).getTime()))).toLocaleTimeString('tr-TR') : 'Beklemede', sub: 'Bağlantı Aktif ✅', trend: '🔄' }
                        ].map((s, i) => (
                            <div key={i} className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</div>
                                <div className="text-lg font-black text-slate-900 dark:text-white mb-1">{s.val}</div>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Integration Hub banner */}
                    <EnterpriseCard>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl border border-slate-200 dark:border-slate-700">🛰️</div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Enterprise Marketplace Control</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-sm">Tüm pazaryeri akışları, muhasebe entegrasyonu ve FIFO maliyet katmanları gerçek zamanlı olarak izlenmektedir.</p>
                                </div>
                            </div>
                            <EnterpriseButton variant="secondary" onClick={fetchStats}>VERİLERİ TAZELE 🔄</EnterpriseButton>
                        </div>
                    </EnterpriseCard>

                    {/* Marketplace cards */}
                    {[
                        {
                            key: 'custom', icon: '🏍️', title: 'Periodya E-Ticaret', desc: 'Özel XML entegrasyonu',
                            fields: (enabled: boolean) => enabled && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <EnterpriseField label="XML URL">
                                        <EnterpriseInput placeholder="https://site.com/xml.php" value={marketplaceSettings.custom.url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarketplaceSettings({ ...marketplaceSettings, custom: { ...marketplaceSettings.custom, url: e.target.value } })} />
                                    </EnterpriseField>
                                    <EnterpriseField label="İŞLEM DEPOSU">
                                        <BranchSelect value={marketplaceSettings.custom.branch || branches[0]?.name || 'Merkez'} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, custom: { ...marketplaceSettings.custom, branch: e.target.value } })} branches={branches} />
                                    </EnterpriseField>
                                </div>
                            )
                        },
                        {
                            key: 'trendyol', icon: '🟠', title: 'Trendyol', desc: "Türkiye'nin lider pazaryeri platformu",
                            fields: (enabled: boolean) => enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'API KEY', field: 'apiKey', type: 'text' },
                                        { label: 'API SECRET', field: 'apiSecret', type: 'password' },
                                        { label: 'SUPPLIER ID', field: 'supplierId', type: 'text' },
                                    ].map(({ label, field, type }) => (
                                        <EnterpriseField key={field} label={label}>
                                            <EnterpriseInput type={type} value={(marketplaceSettings.trendyol as any)[field]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, [field]: e.target.value } })} />
                                        </EnterpriseField>
                                    ))}
                                    <EnterpriseField label="İŞLEM DEPOSU">
                                        <BranchSelect value={marketplaceSettings.trendyol.branch || branches[0]?.name || 'Merkez'} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, branch: e.target.value } })} branches={branches} />
                                    </EnterpriseField>
                                </div>
                            )
                        },
                        {
                            key: 'hepsiburada', icon: '🟧', title: 'Hepsiburada', desc: 'Teknoloji ve yaşam odaklı pazaryeri',
                            fields: (enabled: boolean) => enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'MERCHANT ID (PORTAL)', field: 'merchantId', placeholder: 'f225561c-...', type: 'text' },
                                        { label: 'API USER (PORTAL)', field: 'username', placeholder: "Portal'da 'API Kullanıcısı' olarak geçer", type: 'text' },
                                        { label: 'SECRET KEY (API)', field: 'password', placeholder: 'DTSF5...', type: 'password' },
                                    ].map(({ label, field, placeholder, type }) => (
                                        <EnterpriseField key={field} label={label}>
                                            <EnterpriseInput type={type} placeholder={placeholder} value={(marketplaceSettings.hepsiburada as any)[field] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, [field]: e.target.value } as any })} />
                                        </EnterpriseField>
                                    ))}
                                    <EnterpriseField label="İŞLEM DEPOSU">
                                        <BranchSelect value={marketplaceSettings.hepsiburada.branch || branches[0]?.name || 'Merkez'} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, branch: e.target.value } })} branches={branches} />
                                    </EnterpriseField>
                                </div>
                            )
                        },
                        {
                            key: 'n11', icon: '🐞', title: 'N11', desc: 'Hayat Sana Gelir - Global pazaryeri ortağı',
                            fields: (enabled: boolean) => enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'API APPLICATION KEY', field: 'apiKey', type: 'text' },
                                        { label: 'API SECRET', field: 'apiSecret', type: 'password' },
                                    ].map(({ label, field, type }) => (
                                        <EnterpriseField key={field} label={label}>
                                            <EnterpriseInput type={type} value={(marketplaceSettings.n11 as any)[field]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, [field]: e.target.value } })} />
                                        </EnterpriseField>
                                    ))}
                                    <EnterpriseField label="İŞLEM DEPOSU">
                                        <BranchSelect value={marketplaceSettings.n11.branch || branches[0]?.name || 'Merkez'} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, branch: e.target.value } })} branches={branches} />
                                    </EnterpriseField>
                                </div>
                            )
                        },
                        {
                            key: 'amazon', icon: '🅰️', title: 'Amazon TR', desc: 'Amazon Türkiye Marketplace',
                            fields: (enabled: boolean) => enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { label: 'SELLER ID', field: 'sellerId', type: 'text' },
                                        { label: 'MWS AUTH TOKEN', field: 'mwsAuthToken', type: 'password' },
                                        { label: 'ACCESS KEY', field: 'accessKey', type: 'text' },
                                        { label: 'SECRET KEY', field: 'secretKey', type: 'password' },
                                    ].map(({ label, field, type }) => (
                                        <EnterpriseField key={field} label={label}>
                                            <EnterpriseInput type={type} value={(marketplaceSettings.amazon as any)[field]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, [field]: e.target.value } })} />
                                        </EnterpriseField>
                                    ))}
                                    <EnterpriseField label="İŞLEM DEPOSU">
                                        <BranchSelect value={marketplaceSettings.amazon.branch || branches[0]?.name || 'Merkez'} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, branch: e.target.value } })} branches={branches} />
                                    </EnterpriseField>
                                </div>
                            )
                        },
                        {
                            key: 'pazarama', icon: '🔵', title: 'Pazarama', desc: 'İş Bankası iştiraki pazaryeri platformu',
                            fields: (enabled: boolean) => enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { label: 'APP KEY', field: 'apiKey', type: 'text' },
                                        { label: 'APP SECRET', field: 'apiSecret', type: 'password' },
                                    ].map(({ label, field, type }) => (
                                        <EnterpriseField key={field} label={label}>
                                            <EnterpriseInput type={type} value={(marketplaceSettings.pazarama as any)[field]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarketplaceSettings({ ...marketplaceSettings, pazarama: { ...marketplaceSettings.pazarama, [field]: e.target.value } })} />
                                        </EnterpriseField>
                                    ))}
                                    <EnterpriseField label="İŞLEM DEPOSU">
                                        <BranchSelect value={marketplaceSettings.pazarama.branch || branches[0]?.name || 'Merkez'} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, pazarama: { ...marketplaceSettings.pazarama, branch: e.target.value } })} branches={branches} />
                                    </EnterpriseField>
                                </div>
                            )
                        },
                    ].map(({ key, icon, title, desc, fields }) => {
                        const enabled = (marketplaceSettings as any)[key]?.enabled ?? false;
                        return (
                            <EnterpriseCard key={key}>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">{icon}</div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                        <ToggleSwitch checked={enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, [key]: { ...(marketplaceSettings as any)[key], enabled: e.target.checked } })} />
                                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{enabled ? 'AKTİF' : 'PASİF'}</span>
                                    </label>
                                </div>

                                {enabled && (
                                    <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
                                        {fields(enabled)}

                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                                <ToggleSwitch checked={(marketplaceSettings as any)[key]?.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, [key]: { ...(marketplaceSettings as any)[key], autoSync: e.target.checked } })} />
                                                <span className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Otomatik Senkronizasyon</span>
                                            </label>
                                            <EnterpriseButton variant="secondary" onClick={() => testMarketplaceConnection(key)} disabled={isTesting}>
                                                {isTesting ? <><div className="w-3 h-3 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" /></> : <span>🔍</span>}
                                                BAĞLANTIYI TEST ET
                                            </EnterpriseButton>
                                        </div>
                                        <TestResult result={testResults[key]} />
                                    </div>
                                )}
                            </EnterpriseCard>
                        );
                    })}
                </div>
            )}

            {/* ── Banking Tab ── */}
            {activeTab === 'banking' && (
                <div className="animate-in fade-in duration-300">
                    <BankIntegrationOnboarding />
                </div>
            )}
        </div>
    );
}
