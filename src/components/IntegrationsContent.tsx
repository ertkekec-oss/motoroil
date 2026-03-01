import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import BankIntegrationOnboarding from './Banking/BankIntegrationOnboarding';
import { apiFetch } from '@/lib/api-client';
import { EnterpriseInput, EnterpriseSelect } from "@/components/ui/enterprise";

export default function IntegrationsContent() {
    const { showSuccess, showError } = useModal();
    const [activeTab, setActiveTab] = useState<'efatura' | 'marketplace' | 'pos' | 'banking'>('efatura');

    // E-Fatura Settings (Nilvera Only)
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

    // POS Settings
    const [posSettings, setPosSettings] = useState({
        provider: 'odeal',
        apiKey: '',
        apiPrefix: 'https://api.odeal.com/v1',
        terminalId: '',
        autoReceipt: true,
        testMode: true
    });

    // Marketplace Settings
    const [marketplaceSettings, setMarketplaceSettings] = useState({
        trendyol: {
            enabled: false,
            apiKey: '',
            apiSecret: '',
            supplierId: '',
            autoSync: false,
            syncInterval: 15, // minutes
            branch: 'Merkez'
        },
        hepsiburada: {
            enabled: false,
            merchantId: '',
            username: '',
            password: '',
            autoSync: false,
            syncInterval: 15,
            isTest: false,
            branch: 'Merkez'
        },
        n11: {
            enabled: false,
            apiKey: '',
            apiSecret: '',
            autoSync: false,
            syncInterval: 15,
            branch: 'Merkez'
        },
        amazon: {
            enabled: false,
            sellerId: '',
            mwsAuthToken: '',
            accessKey: '',
            secretKey: '',
            autoSync: false,
            syncInterval: 30,
            branch: 'Merkez'
        },
        pazarama: {
            enabled: false,
            apiKey: '',
            apiSecret: '',
            isTest: false,
            autoSync: false,
            syncInterval: 15,
            branch: 'Merkez'
        },
        custom: {
            enabled: true,
            url: 'https://www.periodya.com/xml.php?c=siparisler&xmlc=10a4cd8d5e',
            autoSync: false,
            syncInterval: 60,
            branch: 'Merkez'
        }
    });

    const [testResults, setTestResults] = useState<{ [key: string]: string }>({});
    const [stats, setStats] = useState<any>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
                body: JSON.stringify({
                    apiKey: eFaturaSettings.apiKey,
                    username: eFaturaSettings.username,
                    password: eFaturaSettings.password,
                    environment: eFaturaSettings.environment,
                    companyVkn: eFaturaSettings.companyVkn
                })
            });
            const data = await res.json();
            if (data.success) {
                setTestResults({
                    ...testResults,
                    efatura: `✅ Nilvera Bağlantısı Başarılı!`
                });
            } else {
                setTestResults({
                    ...testResults,
                    efatura: `❌ ${data.error}`
                });
            }
        } catch (error: any) {
            setTestResults({
                ...testResults,
                efatura: `❌ Bağlantı hatası: ${error.message}`
            });
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
                } else {
                    throw new Error(data.error || 'API Hatası');
                }
            } else {
                let config = { ...(marketplaceSettings as any)[marketplace] };

                // Hepsiburada için payload güvenliği: UI'daki username'in merchantId ile ezilmediğinden emin olalım
                if (marketplace === 'hepsiburada' && process.env.NODE_ENV !== 'production') {
                    console.log('[HB_DEBUG] Sending credentials:', {
                        merchantId: marketplaceSettings.hepsiburada.merchantId,
                        apiUser: marketplaceSettings.hepsiburada.username,
                        passwordExists: !!marketplaceSettings.hepsiburada.password
                    });
                }

                const response = await apiFetch('/api/integrations/marketplace/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: marketplace,
                        config: config
                    })
                });

                const data = await response.json();
                if (data.success) {
                    let msg = `✅ ${data.message || 'Bağlantı ve senkronizasyon başarılı!'}`;
                    if (data.errors && data.errors.length > 0) msg += `\n❌ ${data.errors.length} HATA OLUŞTU`;
                    setTestResults(prev => ({ ...prev, [marketplace]: msg }));
                } else {
                    throw new Error(data.error || 'Bağlantı doğrulanamadı');
                }
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
        } catch (error) {
            showError('Hata', 'Sunucu bağlantı hatası.');
            localStorage.setItem('periodya_efatura_settings', JSON.stringify(eFaturaSettings));
            localStorage.setItem('periodya_marketplace_settings', JSON.stringify(marketplaceSettings));
            localStorage.setItem('periodya_pos_settings', JSON.stringify(posSettings));
            showSuccess('Yerel Kayıt', '✅ Ayarlar tarayıcıya (yerel) kaydedildi.');
        }
        setIsSaving(false);
    };

    return (
        <div className="max-w-5xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-blue-600/10 rounded-[16px] text-2xl">🔌</span>
                        Entegrasyonlar
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-md">
                        E-Fatura, Ödeal ve Pazaryeri bağlantılarınızı bu panelden yönetebilir, senkronizasyon ayarlarınızı yapılandırabilirsiniz.
                    </p>
                </div>
                <button
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="h-10 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-[14px] font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm border border-transparent"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            KAYDEDİLİYOR
                        </>
                    ) : (
                        <><span>💾</span> AYARLARI KAYDET</>
                    )}
                </button>
            </div>

            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-white/5  rounded-[20px] border border-slate-200 dark:border-white/10 w-fit mb-10 ">
                {[
                    { id: 'efatura', label: 'E-Fatura (Nilvera)', icon: '📄' },
                    { id: 'marketplace', label: 'Pazaryerleri', icon: '🛒' },
                    { id: 'pos', label: 'Yazar Kasa POS', icon: '💳' },
                    { id: 'banking', label: 'Banka Entegrasyonu', icon: '🏦' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-2.5 rounded-[16px] text-xs font-black tracking-wider transition-all flex items-center gap-2.5 ${activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-sm '
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                    >
                        <span className="text-base">{tab.icon}</span>
                        <span>{tab.label.toUpperCase()}</span>
                    </button>
                ))}
            </div>



            {/* E-Fatura Tab */}
            {activeTab === 'efatura' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 relative">
                        {/* Decorative Background Glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-200 dark:border-white/5 pb-8 mb-8">
                            <div className="w-14 h-14 rounded-[20px]  flex items-center justify-center text-3xl  border border-slate-200 dark:border-white/5">
                                📄
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">E-Fatura Entegrasyonu</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Nilvera GİB uyumlu e-fatura servis sağlayıcı ayarları</p>
                            </div>
                            <div className="sm:ml-auto">
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${eFaturaSettings.environment === 'production'
                                    ? 'bg-blue-600/10 text-blue-600 dark:text-blue-500 border-blue-500/20'
                                    : 'bg-slate-800/10 text-amber-500 border-amber-500/20'
                                    }`}>
                                    {eFaturaSettings.environment === 'production' ? '🚀 Canlı Ortam' : '🧪 Test Ortamı'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Left Column: Core Setup */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Çalışma Ortamı Seçimi</label>
                                    <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-black/20 rounded-[16px] border border-slate-200 dark:border-white/5">
                                        {['test', 'production'].map((env) => (
                                            <button
                                                key={env}
                                                onClick={() => setEFaturaSettings({ ...eFaturaSettings, environment: env })}
                                                className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${eFaturaSettings.environment === env
                                                    ? (env === 'production' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-white shadow-sm')
                                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-white/5'
                                                    }`}
                                            >
                                                {env === 'production' ? 'Canlı Ortam' : 'Test Ortamı'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Şirket VKN / TCKN</label>
                                        <EnterpriseInput value={eFaturaSettings.companyVkn} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, companyVkn: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Şirket Ünvanı</label>
                                        <EnterpriseInput placeholder="Fatura başlığı..." value={eFaturaSettings.companyTitle} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, companyTitle: e.target.value })} />
                                    </div>
                                </div>

                                <div className="p-5 bg-blue-600/5 border border-primary/10 rounded-[20px] relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600/30" />
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl opacity-50">💡</div>
                                        <div>
                                            <div className="text-[11px] font-black text-primary uppercase tracking-widest">Önemli Hatırlatma</div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                Bilgileri Nilvera panelindeki "Şirket Bilgileri" alanıyla birebir aynı doldurmalısınız. Yanlış VKN kullanımı fatura reddine sebep olabilir.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">API Adresi</label>
                                    <EnterpriseInput value={eFaturaSettings.apiUrl} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, apiUrl: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">API Key (Opsiyonel)</label>
                                    <EnterpriseInput placeholder="🔑 Opsiyonel anahtar" value={eFaturaSettings.apiKey} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, apiKey: e.target.value })} />
                                </div>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/5"></div></div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white dark:bg-[#0f172a] px-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">VEYA KULLANICI BİLGİLERİ</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Kullanıcı Adı</label>
                                        <EnterpriseInput placeholder="test01@nilvera.com" value={eFaturaSettings.username} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, username: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Portal Şifresi</label>
                                        <EnterpriseInput type="password" placeholder="••••••••" value={eFaturaSettings.password} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, password: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 mt-10 border-t border-slate-200 dark:border-white/5">
                            <label className="flex items-center gap-5 p-5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/50 dark:bg-white/[0.05] rounded-[20px] border border-slate-200 dark:border-white/5 cursor-pointer transition-all select-none group">
                                <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${eFaturaSettings.autoSend ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${eFaturaSettings.autoSend ? 'left-7' : 'left-1'}`} />
                                </div>
                                <input type="checkbox" className="hidden" checked={eFaturaSettings.autoSend} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, autoSend: e.target.checked })} />
                                <div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">Otomatik Gönderim {eFaturaSettings.autoSend && <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-blue-600" />}</div>
                                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">Satış tamamlandığında faturayı otomatik oluşturur.</div>
                                </div>
                            </label>
                            <label className="flex items-center gap-5 p-5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/50 dark:bg-white/[0.05] rounded-[20px] border border-slate-200 dark:border-white/5 cursor-pointer transition-all select-none group">
                                <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${eFaturaSettings.autoApprove ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${eFaturaSettings.autoApprove ? 'left-7' : 'left-1'}`} />
                                </div>
                                <input type="checkbox" className="hidden" checked={eFaturaSettings.autoApprove} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, autoApprove: e.target.checked })} />
                                <div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">Otomatik Onay</div>
                                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">Gelen faturaları otomatik olarak yanıtla/onayla.</div>
                                </div>
                            </label>
                        </div>

                        <div className="mt-10">
                            <button
                                onClick={testEFaturaConnection}
                                disabled={isTesting}
                                className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none"
                            >
                                {isTesting ? (
                                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="text-lg group-hover:rotate-12 transition-transform">🔍</span>
                                        BAĞLANTIYI ŞİMDİ TEST ET
                                    </>
                                )}
                            </button>
                            {testResults.efatura && (
                                <div className={`mt-5 p-5 rounded-[20px] border animate-in zoom-in-95 flex items-center gap-4 ${testResults.efatura.includes('✅') ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-500' : 'bg-red-50 dark:bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${testResults.efatura.includes('✅') ? 'bg-blue-600/20' : 'bg-red-500/20'}`}>
                                        {testResults.efatura.includes('✅') ? '✓' : '!'}
                                    </div>
                                    <span className="font-bold text-sm tracking-wide">{testResults.efatura.replace('✅ ', '').replace('❌ ', '')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* POS Tab */}
            {
                activeTab === 'pos' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-8 relative overflow-hidden border border-slate-200 dark:border-white/10">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-200 dark:border-white/5 pb-8 mb-4">
                                <div className="w-14 h-14 rounded-[20px]  flex items-center justify-center text-3xl  border border-slate-200 dark:border-white/5">💳</div>
                                <div className="text-center sm:text-left">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Ödeal Yazar Kasa POS</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Ödeme sistemleri ve yazar kasa POS entegrasyonu</p>
                                </div>
                                <div className="sm:ml-auto">
                                    <span className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-blue-600/10 text-blue-600 dark:text-blue-500 border border-blue-500/20 shadow-sm">
                                        Durum: AKTİF
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Ödeal API Token (Canlı)</label>
                                    <EnterpriseInput placeholder="Od_Live_••••••••••••" value={posSettings.apiKey} onChange={(e) => setPosSettings({ ...posSettings, apiKey: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Terminal / Cihaz Seri No</label>
                                    <EnterpriseInput placeholder="9988XXXX" value={posSettings.terminalId} onChange={(e) => setPosSettings({ ...posSettings, terminalId: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500/40" />
                                <label className="flex items-center gap-5 cursor-pointer select-none group">
                                    <div className={`w-12 h-6 rounded-full relative transition-all duration-300 shrink-0 ${posSettings.autoReceipt ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${posSettings.autoReceipt ? 'left-7' : 'left-1'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={posSettings.autoReceipt} onChange={(e) => setPosSettings({ ...posSettings, autoReceipt: e.target.checked })} />
                                    <div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">Otomatik Fiş Kes</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Başarılı ödeme sonrası otomatik döküm alır.</div>
                                    </div>
                                </label>
                                <label className="flex items-center gap-5 cursor-pointer select-none group">
                                    <div className={`w-12 h-6 rounded-full relative transition-all duration-300 shrink-0 ${posSettings.testMode ? 'bg-slate-800' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${posSettings.testMode ? 'left-7' : 'left-1'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={posSettings.testMode} onChange={(e) => setPosSettings({ ...posSettings, testMode: e.target.checked })} />
                                    <div>
                                        <div className="text-sm font-black text-amber-500">Geliştirici Modu</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Sanal bir işlem akışı simüle eder.</div>
                                    </div>
                                </label>
                            </div>

                            <div className="p-6 bg-slate-50/50 dark:bg-white/[0.02] rounded-[20px] text-[11px] text-slate-500 dark:text-slate-400 space-y-2 border border-slate-200 dark:border-white/5">
                                <div className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2 uppercase tracking-widest text-[10px]"><span>ℹ️</span> İşlem Akışı</div>
                                <p>• Satış POS ekranında "Ödeal POS" seçildiğinde tutar otomatik olarak cihaz ekranına düşer.</p>
                                <p>• Kart çekimi başarılı olduğu anda Periodya'da "Satış Onaylandı" durumuna geçer ve kasa kaydı oluşur.</p>
                                <p>• Cihaz üzerinden Z raporu ve EKÜ dökümleri için Ödeal panelini kullanınız.</p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Marketplace Tab */}
            {
                activeTab === 'marketplace' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 🚀 MARKETPLACE HEALTH KNOWLEDGE PANELS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Açık Alacaklar', val: `₺${stats?.financials?.openReceivables.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, sub: 'Tahsilat Bekleyen Brüt', color: 'primary', trend: '↑' },
                                { label: 'Askıda Settlement', val: `${stats?.financials?.pendingSettlements || 0} İşlem`, sub: 'Muhasebe bekleyenler', color: 'amber-500', trend: '⏳' },
                                { label: '24 Saatlik Sipariş', val: `${stats?.orders?.last24h || 0} Adet`, sub: 'Gerçek Zamanlı Akış', color: 'blue-500', trend: '📦' },
                                { label: 'Son Sync Status', val: stats?.configs?.some((c: any) => c.lastSync) ? new Date(Math.max(...stats.configs.filter((c: any) => c.lastSync).map((c: any) => new Date(c.lastSync).getTime()))).toLocaleTimeString('tr-TR') : 'Beklemede', sub: 'Bağlantı Aktif ✅', color: 'emerald-500', trend: '🔄' }
                            ].map((s, i) => (
                                <div key={i} className={`bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 border-l-4 border-l-${s.color} hover:translate-y-[-4px] transition-all cursor-default group relative overflow-hidden`}>
                                    <div className="absolute right-[-10%] top-[-10%] text-6xl opacity-5 group-hover:scale-110 transition-transform">{s.trend}</div>
                                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1.5">{s.label}</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white mb-1">{s.val}</div>
                                    <div className={`text-[10px] text-${s.color} font-bold opacity-80`}>{s.sub}</div>
                                </div>
                            ))}
                        </div>

                        {/* Integration Hub Banner */}
                        <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 group">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-3xl shadow-lg border border-slate-200 dark:border-white/10 group-hover:rotate-[360deg] transition-all duration-700">🛰️</div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-wide">Enterprise Marketplace Control</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed max-w-sm">Tüm pazaryeri akışları, muhasebe entegrasyonu ve FIFO maliyet katmanları gerçek zamanlı olarak izlenmektedir.</p>
                                </div>
                            </div>
                            <button onClick={fetchStats} className="px-6 py-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-200 dark:bg-slate-700 rounded-[20px] text-[10px] font-black tracking-widest text-slate-900 dark:text-white transition-all border border-slate-200 dark:border-white/10 active:scale-95">
                                VERİLERİ TAZELE 🔄
                            </button>
                        </div>
                        <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm-plus p-6 space-y-4 border-l-4 border-l-primary/50">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">🏍️</div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Periodya E-Ticaret</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Özel XML entegrasyonu</p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" className="accent-blue-600 w-5 h-5 rounded-md" checked={marketplaceSettings.custom.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, custom: { ...marketplaceSettings.custom, enabled: e.target.checked } })} />
                                    <span className="font-bold text-sm text-slate-900 dark:text-white">Aktif</span>
                                </label>
                            </div>
                            {marketplaceSettings.custom.enabled && (
                                <div className="pt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">XML URL</label>
                                            <EnterpriseInput placeholder="https://site.com/xml.php" value={marketplaceSettings.custom.url} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, custom: { ...marketplaceSettings.custom, url: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">İşlem Deposu</label>
                                            <select className="w-full h-[44px] px-[12px] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-[12px] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none appearance-none cursor-pointer"
                                                value={marketplaceSettings.custom.branch || (branches[0]?.name || 'Merkez')}
                                                onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, custom: { ...marketplaceSettings.custom, branch: e.target.value } })}
                                            >
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.name} className="bg-[#1a1a1a]">{b.name}</option>
                                                ))}
                                                {branches.length === 0 && <option value="Merkez" className="bg-[#1a1a1a]">Merkez</option>}
                                            </select>
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-[16px] border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-200 dark:bg-slate-700 transition-all select-none">
                                        <input type="checkbox" className="accent-blue-600 w-5 h-5" checked={marketplaceSettings.custom.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, custom: { ...marketplaceSettings.custom, autoSync: e.target.checked } })} />
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">Otomatik Senkronizasyon</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">XML'den verileri otomatik çek</div>
                                        </div>
                                    </label>
                                    <div className="pt-2">
                                        <button onClick={() => testMarketplaceConnection('custom')} disabled={isTesting} className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none">
                                            {isTesting ? '⏳ Test Ediliyor...' : '📥 Verileri Çek ve Test Et'}
                                        </button>
                                        {testResults.custom && (
                                            <div className={`mt-3 p-3 rounded-lg text-sm font-bold ${testResults.custom.includes('✅') ? 'bg-blue-600/10 text-blue-600 dark:text-blue-500' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500'}`}>
                                                {testResults.custom}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 relative overflow-hidden group border border-slate-200 dark:border-white/10">
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-slate-50 dark:bg-slate-800/30 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[20px]  flex items-center justify-center text-3xl  border border-[#f27a1a]/10">
                                        🟠
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Trendyol</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide">Türkiye'nin lider pazaryeri platformu</p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-[16px] border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-200 dark:bg-slate-700 transition-all group/toggle">
                                    <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${marketplaceSettings.trendyol.enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${marketplaceSettings.trendyol.enabled ? 'left-5.5' : 'left-0.5'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={marketplaceSettings.trendyol.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, enabled: e.target.checked } })} />
                                    <span className="font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">{marketplaceSettings.trendyol.enabled ? 'AKTİF' : 'PASİF'}</span>
                                </label>
                            </div>

                            {marketplaceSettings.trendyol.enabled && (
                                <div className="pt-8 mt-8 border-t border-slate-200 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">API Key</label>
                                            <EnterpriseInput value={marketplaceSettings.trendyol.apiKey} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, apiKey: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">API Secret</label>
                                            <EnterpriseInput type="password" value={marketplaceSettings.trendyol.apiSecret} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, apiSecret: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Supplier ID</label>
                                            <EnterpriseInput value={marketplaceSettings.trendyol.supplierId} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, supplierId: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">İşlem Deposu</label>
                                            <select className="w-full h-[44px] px-[12px] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-[12px] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none appearance-none cursor-pointer"
                                                value={marketplaceSettings.trendyol.branch || (branches[0]?.name || 'Merkez')}
                                                onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, branch: e.target.value } })}
                                            >
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.name} className="bg-[#1a1a1a]">{b.name}</option>
                                                ))}
                                                {branches.length === 0 && <option value="Merkez" className="bg-[#1a1a1a]">Merkez</option>}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-slate-50/50 dark:bg-white/[0.02] rounded-[20px] border border-slate-200 dark:border-white/5">
                                        <label className="flex items-center gap-4 cursor-pointer select-none">
                                            <div className={`w-11 h-5 rounded-full relative transition-all duration-300 ${marketplaceSettings.trendyol.autoSync ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${marketplaceSettings.trendyol.autoSync ? 'left-6.5' : 'left-0.5'}`} />
                                            </div>
                                            <input type="checkbox" className="hidden" checked={marketplaceSettings.trendyol.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, autoSync: e.target.checked } })} />
                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-tighter">OTOMATİK SENKRONİZASYON</span>
                                        </label>

                                        <button onClick={() => testMarketplaceConnection('trendyol')} disabled={isTesting} className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-[16px] font-black text-[10px] tracking-widest transition-all shadow-sm flex items-center gap-3 active:scale-95 disabled:opacity-50 group/btn">
                                            {isTesting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>🔍</span>}
                                            BAĞLANTIYI TEST ET
                                        </button>
                                    </div>

                                    {testResults.trendyol && (
                                        <div className={`mt-4 p-4 rounded-[16px] border flex items-center gap-3 animate-in zoom-in-95 ${testResults.trendyol.includes('✅') ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-500' : 'bg-red-50 dark:bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500'}`}>
                                            <span className="text-sm font-bold tracking-tight">{testResults.trendyol}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 relative overflow-hidden group border border-slate-200 dark:border-white/10">
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#ff6000]/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[20px]  flex items-center justify-center text-3xl  border border-[#ff6000]/10">
                                        🟧
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Hepsiburada</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide">Teknoloji ve yaşam odaklı pazaryeri</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {marketplaceSettings.hepsiburada.enabled && (
                                        <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/10 border border-amber-500/20 rounded-lg cursor-pointer">
                                            <input type="checkbox" className="accent-amber-500 w-3.5 h-3.5" checked={(marketplaceSettings.hepsiburada as any).isTest || false} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, isTest: e.target.checked } as any })} />
                                            <span className="text-[10px] font-black text-amber-500">SANDBOX</span>
                                        </label>
                                    )}
                                    <label className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-[16px] border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-200 dark:bg-slate-700 transition-all">
                                        <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${marketplaceSettings.hepsiburada.enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${marketplaceSettings.hepsiburada.enabled ? 'left-5.5' : 'left-0.5'}`} />
                                        </div>
                                        <input type="checkbox" className="hidden" checked={marketplaceSettings.hepsiburada.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, enabled: e.target.checked } })} />
                                        <span className="font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">{marketplaceSettings.hepsiburada.enabled ? 'AKTİF' : 'PASİF'}</span>
                                    </label>
                                </div>
                            </div>

                            {marketplaceSettings.hepsiburada.enabled && (
                                <div className="pt-8 mt-8 border-t border-slate-200 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Merchant ID (Portal)</label>
                                            <EnterpriseInput value={marketplaceSettings.hepsiburada.merchantId} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, merchantId: e.target.value } })} placeholder="f225561c-..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">API User (Portal)</label>
                                            <EnterpriseInput value={marketplaceSettings.hepsiburada.username || ''} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, username: e.target.value } })} placeholder="Portalda 'API Kullanıcısı' olarak geçer" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Secret Key (API)</label>
                                            <EnterpriseInput type="password" value={marketplaceSettings.hepsiburada.password} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, password: e.target.value } })} placeholder="DTSF5..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">İşlem Deposu</label>
                                            <select className="w-full h-[44px] px-[12px] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-[12px] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none appearance-none cursor-pointer"
                                                value={marketplaceSettings.hepsiburada.branch || (branches[0]?.name || 'Merkez')}
                                                onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, branch: e.target.value } })}
                                            >
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.name} className="bg-[#1a1a1a]">{b.name}</option>
                                                ))}
                                                {branches.length === 0 && <option value="Merkez" className="bg-[#1a1a1a]">Merkez</option>}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-slate-50/50 dark:bg-white/[0.02] rounded-[20px] border border-slate-200 dark:border-white/5">
                                        <label className="flex items-center gap-4 cursor-pointer select-none">
                                            <div className={`w-11 h-5 rounded-full relative transition-all duration-300 ${marketplaceSettings.hepsiburada.autoSync ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${marketplaceSettings.hepsiburada.autoSync ? 'left-6.5' : 'left-0.5'}`} />
                                            </div>
                                            <input type="checkbox" className="hidden" checked={marketplaceSettings.hepsiburada.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, autoSync: e.target.checked } })} />
                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-tighter">OTOMATİK SENKRONİZASYON</span>
                                        </label>

                                        <button onClick={() => testMarketplaceConnection('hepsiburada')} disabled={isTesting} className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-[16px] font-black text-[10px] tracking-widest transition-all shadow-sm flex items-center gap-3 active:scale-95 disabled:opacity-50">
                                            {isTesting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>🔍</span>}
                                            BAĞLANTIYI TEST ET
                                        </button>
                                    </div>

                                    {testResults.hepsiburada && (
                                        <div className={`mt-4 p-4 rounded-[16px] border flex items-center gap-3 animate-in zoom-in-95 ${testResults.hepsiburada.includes('✅') ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-500' : 'bg-red-50 dark:bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500'}`}>
                                            <span className="text-sm font-bold tracking-tight">{testResults.hepsiburada}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 relative overflow-hidden group border border-slate-200 dark:border-white/10">
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#603996]/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[20px]  flex items-center justify-center text-3xl  border border-[#603996]/10">
                                        🐞
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">N11</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide">Hayat Sana Gelir - Global pazaryeri ortağı</p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-[16px] border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-200 dark:bg-slate-700 transition-all">
                                    <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${marketplaceSettings.n11.enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${marketplaceSettings.n11.enabled ? 'left-5.5' : 'left-0.5'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={marketplaceSettings.n11.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, enabled: e.target.checked } })} />
                                    <span className="font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">{marketplaceSettings.n11.enabled ? 'AKTİF' : 'PASİF'}</span>
                                </label>
                            </div>

                            {marketplaceSettings.n11.enabled && (
                                <div className="pt-8 mt-8 border-t border-slate-200 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">API Application Key</label>
                                            <EnterpriseInput value={marketplaceSettings.n11.apiKey} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, apiKey: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">API Secret</label>
                                            <EnterpriseInput type="password" value={marketplaceSettings.n11.apiSecret} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, apiSecret: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">İşlem Deposu</label>
                                            <select className="w-full h-[44px] px-[12px] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-[12px] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none appearance-none cursor-pointer"
                                                value={marketplaceSettings.n11.branch || (branches[0]?.name || 'Merkez')}
                                                onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, branch: e.target.value } })}
                                            >
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.name} className="bg-[#1a1a1a]">{b.name}</option>
                                                ))}
                                                {branches.length === 0 && <option value="Merkez" className="bg-[#1a1a1a]">Merkez</option>}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-slate-50/50 dark:bg-white/[0.02] rounded-[20px] border border-slate-200 dark:border-white/5">
                                        <label className="flex items-center gap-4 cursor-pointer select-none">
                                            <div className={`w-11 h-5 rounded-full relative transition-all duration-300 ${marketplaceSettings.n11.autoSync ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${marketplaceSettings.n11.autoSync ? 'left-6.5' : 'left-0.5'}`} />
                                            </div>
                                            <input type="checkbox" className="hidden" checked={marketplaceSettings.n11.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, autoSync: e.target.checked } })} />
                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-tighter">OTOMATİK SENKRONİZASYON</span>
                                        </label>

                                        <button onClick={() => testMarketplaceConnection('n11')} disabled={isTesting} className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-[16px] font-black text-[10px] tracking-widest transition-all shadow-sm flex items-center gap-3 active:scale-95 disabled:opacity-50">
                                            {isTesting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>🔍</span>}
                                            BAĞLANTIYI TEST ET
                                        </button>
                                    </div>

                                    {testResults.n11 && (
                                        <div className={`mt-4 p-4 rounded-[16px] border flex items-center gap-3 animate-in zoom-in-95 ${testResults.n11.includes('✅') ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-500' : 'bg-red-50 dark:bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500'}`}>
                                            <span className="text-sm font-bold tracking-tight">{testResults.n11}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 relative overflow-hidden group border border-slate-200 dark:border-white/10">
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#232f3e]/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[20px]  flex items-center justify-center text-3xl  border border-[#232f3e]/10">
                                        🅰️
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Amazon TR</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide">Amazon Türkiye Marketplace</p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-[16px] border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-200 dark:bg-slate-700 transition-all">
                                    <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${marketplaceSettings.amazon.enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${marketplaceSettings.amazon.enabled ? 'left-5.5' : 'left-0.5'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={marketplaceSettings.amazon.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, enabled: e.target.checked } })} />
                                    <span className="font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">{marketplaceSettings.amazon.enabled ? 'AKTİF' : 'PASİF'}</span>
                                </label>
                            </div>

                            {marketplaceSettings.amazon.enabled && (
                                <div className="pt-8 mt-8 border-t border-slate-200 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Seller ID</label>
                                            <EnterpriseInput value={marketplaceSettings.amazon.sellerId} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, sellerId: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">MWS Auth Token</label>
                                            <EnterpriseInput type="password" value={marketplaceSettings.amazon.mwsAuthToken} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, mwsAuthToken: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Access Key</label>
                                            <EnterpriseInput value={marketplaceSettings.amazon.accessKey} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, accessKey: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Secret Key</label>
                                            <EnterpriseInput type="password" value={marketplaceSettings.amazon.secretKey} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, secretKey: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">İşlem Deposu</label>
                                            <select className="w-full h-[44px] px-[12px] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-[12px] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none appearance-none cursor-pointer"
                                                value={marketplaceSettings.amazon.branch || (branches[0]?.name || 'Merkez')}
                                                onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, branch: e.target.value } })}
                                            >
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.name} className="bg-[#1a1a1a]">{b.name}</option>
                                                ))}
                                                {branches.length === 0 && <option value="Merkez" className="bg-[#1a1a1a]">Merkez</option>}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-slate-50/50 dark:bg-white/[0.02] rounded-[20px] border border-slate-200 dark:border-white/5">
                                        <label className="flex items-center gap-4 cursor-pointer select-none">
                                            <div className={`w-11 h-5 rounded-full relative transition-all duration-300 ${marketplaceSettings.amazon.autoSync ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${marketplaceSettings.amazon.autoSync ? 'left-6.5' : 'left-0.5'}`} />
                                            </div>
                                            <input type="checkbox" className="hidden" checked={marketplaceSettings.amazon.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, autoSync: e.target.checked } })} />
                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-tighter">OTOMATİK SENKRONİZASYON</span>
                                        </label>

                                        <button onClick={() => testMarketplaceConnection('amazon')} disabled={isTesting} className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-[16px] font-black text-[10px] tracking-widest transition-all shadow-sm flex items-center gap-3 active:scale-95 disabled:opacity-50">
                                            {isTesting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>🔍</span>}
                                            BAĞLANTIYI TEST ET
                                        </button>
                                    </div>

                                    {testResults.amazon && (
                                        <div className={`mt-4 p-4 rounded-[16px] border flex items-center gap-3 animate-in zoom-in-95 ${testResults.amazon.includes('✅') ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-500' : 'bg-red-50 dark:bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500'}`}>
                                            <span className="text-sm font-bold tracking-tight">{testResults.amazon}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 relative overflow-hidden group border border-slate-200 dark:border-white/10">
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#006BFF]/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[20px]  flex items-center justify-center text-3xl  border border-[#006BFF]/10">
                                        🔵
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Pazarama</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide">İş Bankası iştiraki pazaryeri platformu</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {marketplaceSettings.pazarama.enabled && (
                                        <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg cursor-pointer">
                                            <input type="checkbox" className="accent-blue-500 w-3.5 h-3.5" checked={marketplaceSettings.pazarama.isTest} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, pazarama: { ...marketplaceSettings.pazarama, isTest: e.target.checked } })} />
                                            <span className="text-[10px] font-black text-blue-500">SANDBOX</span>
                                        </label>
                                    )}
                                    <label className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-[16px] border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-200 dark:bg-slate-700 transition-all">
                                        <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${marketplaceSettings.pazarama.enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${marketplaceSettings.pazarama.enabled ? 'left-5.5' : 'left-0.5'}`} />
                                        </div>
                                        <input type="checkbox" className="hidden" checked={marketplaceSettings.pazarama.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, pazarama: { ...marketplaceSettings.pazarama, enabled: e.target.checked } })} />
                                        <span className="font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">{marketplaceSettings.pazarama.enabled ? 'AKTİF' : 'PASİF'}</span>
                                    </label>
                                </div>
                            </div>

                            {marketplaceSettings.pazarama.enabled && (
                                <div className="pt-8 mt-8 border-t border-slate-200 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">App Key</label>
                                            <EnterpriseInput value={marketplaceSettings.pazarama.apiKey} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, pazarama: { ...marketplaceSettings.pazarama, apiKey: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">App Secret</label>
                                            <EnterpriseInput type="password" value={marketplaceSettings.pazarama.apiSecret} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, pazarama: { ...marketplaceSettings.pazarama, apiSecret: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">İşlem Deposu</label>
                                            <select className="w-full h-[44px] px-[12px] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-[12px] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none appearance-none cursor-pointer"
                                                value={marketplaceSettings.pazarama.branch || (branches[0]?.name || 'Merkez')}
                                                onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, pazarama: { ...marketplaceSettings.pazarama, branch: e.target.value } })}
                                            >
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.name} className="bg-[#1a1a1a]">{b.name}</option>
                                                ))}
                                                {branches.length === 0 && <option value="Merkez" className="bg-[#1a1a1a]">Merkez</option>}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-slate-50/50 dark:bg-white/[0.02] rounded-[20px] border border-slate-200 dark:border-white/5">
                                        <label className="flex items-center gap-4 cursor-pointer select-none">
                                            <div className={`w-11 h-5 rounded-full relative transition-all duration-300 ${marketplaceSettings.pazarama.autoSync ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${marketplaceSettings.pazarama.autoSync ? 'left-6.5' : 'left-0.5'}`} />
                                            </div>
                                            <input type="checkbox" className="hidden" checked={marketplaceSettings.pazarama.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, pazarama: { ...marketplaceSettings.pazarama, autoSync: e.target.checked } })} />
                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-tighter">OTOMATİK SENKRONİZASYON</span>
                                        </label>

                                        <button onClick={() => testMarketplaceConnection('pazarama')} disabled={isTesting} className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-[16px] font-black text-[10px] tracking-widest transition-all shadow-sm flex items-center gap-3 active:scale-95 disabled:opacity-50">
                                            {isTesting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>🔍</span>}
                                            BAĞLANTIYI TEST ET
                                        </button>
                                    </div>

                                    {testResults.pazarama && (
                                        <div className={`mt-4 p-4 rounded-[16px] border flex items-center gap-3 animate-in zoom-in-95 ${testResults.pazarama.includes('✅') ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-500' : 'bg-red-50 dark:bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500'}`}>
                                            <span className="text-sm font-bold tracking-tight">{testResults.pazarama}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            {/* Banking Tab */}
            {activeTab === 'banking' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <BankIntegrationOnboarding />
                </div>
            )}
        </div>
    )
}
