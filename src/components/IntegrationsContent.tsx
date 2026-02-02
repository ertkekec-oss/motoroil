import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function IntegrationsContent() {
    const { showSuccess, showError } = useModal();
    const [activeTab, setActiveTab] = useState<'efatura' | 'marketplace' | 'pos'>('efatura');

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

    // ... (rest of the code)

    {/* Nilvera Fields */ }
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">API Key (Opsiyonel)</label>
                                <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" placeholder="Varsa API Key giriniz" value={eFaturaSettings.apiKey} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, apiKey: e.target.value })} />
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                                <div className="relative flex justify-center"><span className="bg-[#0f172a] px-2 text-xs text-white/40">VEYA KULLANICI BİLGİLERİ</span></div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Kullanıcı Adı</label>
                                <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none" placeholder="örn: test01@nilvera.com" value={eFaturaSettings.username} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, username: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Şifre</label>
                                <input type="password" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none" placeholder="Nilvera portal şifresi" value={eFaturaSettings.password} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, password: e.target.value })} />
                            </div>

    {/* Hidden legacy field just in case */ }
    <input type="hidden" value={eFaturaSettings.apiSecret} />


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
            syncInterval: 15 // minutes
        },
        hepsiburada: {
            enabled: false,
            merchantId: '',
            username: '',
            password: '',
            autoSync: false,
            syncInterval: 15,
            isTest: false
        },
        n11: {
            enabled: false,
            apiKey: '',
            apiSecret: '',
            autoSync: false,
            syncInterval: 15
        },
        amazon: {
            enabled: false,
            sellerId: '',
            mwsAuthToken: '',
            accessKey: '',
            secretKey: '',
            autoSync: false,
            syncInterval: 30
        },
        custom: {
            enabled: true,
            url: 'https://www.periodya.com.tr/xml.php?c=siparisler&xmlc=10a4cd8d5e',
            autoSync: false,
            syncInterval: 60
        }
    });

    const [testResults, setTestResults] = useState<{ [key: string]: string }>({});
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const testEFaturaConnection = async () => {
        setIsTesting(true);
        setTestResults({ ...testResults, efatura: '⏳ Bağlantı test ediliyor...' });

        try {
            const res = await fetch('/api/integrations/nilvera/test', {
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
                const response = await fetch('/api/integrations/ecommerce/sync', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    setTestResults(prev => ({ ...prev, [marketplace]: `✅ Bağlantı başarılı! ${data.count} sipariş bulundu.` }));
                } else {
                    throw new Error(data.error || 'API Hatası');
                }
            } else {
                const config = (marketplaceSettings as any)[marketplace];
                const response = await fetch('/api/integrations/marketplace/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: marketplace, config: config })
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

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/integrations/settings/save');
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
    }, []);

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/integrations/settings/save', {
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
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white">🔌 Entegrasyonlar</h2>
                    <p className="text-sm text-white/40 font-bold mt-1">E-Fatura, Ödeal ve Pazaryeri Bağlantıları</p>
                </div>
                <button
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="h-12 px-6 bg-primary hover:bg-primary/80 text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2"
                >
                    {isSaving ? 'KAYDEDİLİYOR...' : '💾 AYARLARI KAYDET'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
                {[
                    { id: 'efatura', label: '📄 E-Fatura (Nilvera)', icon: '📄' },
                    { id: 'marketplace', label: '🛒 Pazaryerleri', icon: '🛒' },
                    { id: 'pos', label: '💳 Yazar Kasa POS', icon: '💳' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* E-Fatura Tab */}
            {activeTab === 'efatura' && (
                <div className="card glass p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shadow-inner">
                            📄
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">E-Fatura Entegrasyonu (Nilvera)</h3>
                            <p className="text-sm text-white/40 mt-1">GİB uyumlu e-fatura servis sağlayıcı ayarları</p>
                        </div>
                        <div className="ml-auto">
                            <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${eFaturaSettings.environment === 'production' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                {eFaturaSettings.environment === 'production' ? '🚀 CANLI ORTAM' : '🧪 TEST ORTAMI'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Çalışma Ortamı</label>
                                <div className="flex gap-4 p-1 bg-white/5 rounded-xl border border-white/5">
                                    {['test', 'production'].map((env) => (
                                        <button
                                            key={env}
                                            onClick={() => setEFaturaSettings({ ...eFaturaSettings, environment: env })}
                                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${eFaturaSettings.environment === env ? (env === 'production' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20') : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                        >
                                            {env === 'production' ? 'Canlı Ortam' : 'Test Ortamı'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Common Fields */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Şirket VKN / TCKN</label>
                                <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono tracking-wider" value={eFaturaSettings.companyVkn} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, companyVkn: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Şirket Ünvanı</label>
                                <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none" placeholder="Fatura başlığı için şirket adı" value={eFaturaSettings.companyTitle} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, companyTitle: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Nilvera Fields */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">API Adresi</label>
                                <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={eFaturaSettings.apiUrl} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, apiUrl: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">API Key (Opsiyonel)</label>
                                <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" placeholder="Varsa API Key giriniz" value={eFaturaSettings.apiKey} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, apiKey: e.target.value })} />
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                                <div className="relative flex justify-center"><span className="bg-[#0f172a] px-2 text-xs text-white/40">VEYA KULLANICI BİLGİLERİ</span></div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Kullanıcı Adı</label>
                                <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none" placeholder="örn: test01@nilvera.com" value={eFaturaSettings.username} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, username: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Şifre</label>
                                <input type="password" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none" placeholder="Nilvera portal şifresi" value={eFaturaSettings.password} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, password: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-white/5">
                        <label className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all select-none group">
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${eFaturaSettings.autoSend ? 'bg-primary' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${eFaturaSettings.autoSend ? 'left-7' : 'left-1'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={eFaturaSettings.autoSend} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, autoSend: e.target.checked })} />
                            <div>
                                <div className="text-sm font-bold text-white">Otomatik Gönderim</div>
                                <div className="text-xs text-white/40">Satış tamamlandığında faturayı otomatik oluştur ve gönder.</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all select-none group">
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${eFaturaSettings.autoApprove ? 'bg-primary' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${eFaturaSettings.autoApprove ? 'left-7' : 'left-1'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={eFaturaSettings.autoApprove} onChange={(e) => setEFaturaSettings({ ...eFaturaSettings, autoApprove: e.target.checked })} />
                            <div>
                                <div className="text-sm font-bold text-white">Otomatik Onay</div>
                                <div className="text-xs text-white/40">Gelen faturaları otomatik olarak onayla ve kaydet.</div>
                            </div>
                        </label>
                    </div>

                    <div className="pt-4">
                        <button onClick={testEFaturaConnection} disabled={isTesting} className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                            {isTesting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '🔍 BAĞLANTIYI TEST ET'}
                        </button>
                        {testResults.efatura && (
                            <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 ${testResults.efatura.includes('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                <span className="text-2xl">{testResults.efatura.includes('✅') ? '✅' : '❌'}</span>
                                <span className="font-bold text-sm">{testResults.efatura.replace('✅ ', '').replace('❌ ', '')}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* POS Tab */}
            {activeTab === 'pos' && (
                <div className="card glass p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shadow-inner">💳</div>
                        <div>
                            <h3 className="text-xl font-black text-white">Ödeal Yazar Kasa POS</h3>
                            <p className="text-sm text-white/40 mt-1">Ödeme sistemleri ve yazar kasa POS entegrasyonu</p>
                        </div>
                        <div className="ml-auto">
                            <span className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">AKTİF</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Ödeal API Key</label>
                            <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" placeholder="Od_Live_..." value={posSettings.apiKey} onChange={(e) => setPosSettings({ ...posSettings, apiKey: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Terminal / Cihaz ID</label>
                            <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" placeholder="Örn: 99887766" value={posSettings.terminalId} onChange={(e) => setPosSettings({ ...posSettings, terminalId: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                        <label className="flex items-center gap-4 cursor-pointer select-none group">
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${posSettings.autoReceipt ? 'bg-primary' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${posSettings.autoReceipt ? 'left-7' : 'left-1'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={posSettings.autoReceipt} onChange={(e) => setPosSettings({ ...posSettings, autoReceipt: e.target.checked })} />
                            <div>
                                <div className="text-sm font-bold text-white">Otomatik Yazar Kasa Fişi Kes</div>
                                <div className="text-xs text-white/40">Satış onaylandığında POS cihazına otomatik "Fiş Kes" sinyali gönder.</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-4 cursor-pointer select-none group">
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${posSettings.testMode ? 'bg-amber-500' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${posSettings.testMode ? 'left-7' : 'left-1'}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={posSettings.testMode} onChange={(e) => setPosSettings({ ...posSettings, testMode: e.target.checked })} />
                            <div>
                                <div className="text-sm font-bold text-amber-500">Test Modu (Simülasyon)</div>
                                <div className="text-xs text-white/40">Fiziki cihaz olmadan API akışını simüle et.</div>
                            </div>
                        </label>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl text-xs text-white/60 space-y-2">
                        <div className="font-bold text-white flex items-center gap-2"><span>ℹ️</span> Nasıl Çalışır?</div>
                        <p>1. Satış ekranında kredi kartı ile ödeme seçildiğinde "Ödeal POS'a Gönder" butonu aktifleşir.</p>
                        <p>2. Tutar ve sepet içeriği otomatik olarak cihazınıza saniyeler içinde iletilir.</p>
                        <p>3. Ödeme tamamlandığında cihaz yazar kasa fişini basar ve sistemimizde satış otomatik onaylanır.</p>
                    </div>
                </div>
            )}

            {/* Marketplace Tab */}
            {activeTab === 'marketplace' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="card glass-plus p-6 space-y-6 border-l-4 border-l-primary/50">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">🏍️</div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Periodya E-Ticaret</h3>
                                    <p className="text-xs text-white/40 mt-1">Özel XML entegrasyonu</p>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" className="accent-primary w-5 h-5 rounded-md" checked={marketplaceSettings.custom.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, custom: { ...marketplaceSettings.custom, enabled: e.target.checked } })} />
                                <span className="font-bold text-sm text-white">Aktif</span>
                            </label>
                        </div>
                        {marketplaceSettings.custom.enabled && (
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">XML URL</label>
                                    <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" placeholder="https://site.com/xml.php" value={marketplaceSettings.custom.url} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, custom: { ...marketplaceSettings.custom, url: e.target.value } })} />
                                </div>
                                <label className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all select-none">
                                    <input type="checkbox" className="accent-primary w-5 h-5" checked={marketplaceSettings.custom.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, custom: { ...marketplaceSettings.custom, autoSync: e.target.checked } })} />
                                    <div>
                                        <div className="text-sm font-bold text-white">Otomatik Senkronizasyon</div>
                                        <div className="text-xs text-white/40">XML'den verileri otomatik çek</div>
                                    </div>
                                </label>
                                <div className="pt-2">
                                    <button onClick={() => testMarketplaceConnection('custom')} disabled={isTesting} className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm tracking-widest transition-all">
                                        {isTesting ? '⏳ Test Ediliyor...' : '📥 Verileri Çek ve Test Et'}
                                    </button>
                                    {testResults.custom && (
                                        <div className={`mt-3 p-3 rounded-lg text-sm font-bold ${testResults.custom.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {testResults.custom}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card glass p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">🟠</div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Trendyol</h3>
                                    <p className="text-xs text-white/40 mt-1">Türkiye'nin en büyük e-ticaret platformu</p>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" className="accent-primary w-5 h-5 rounded-md" checked={marketplaceSettings.trendyol.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, enabled: e.target.checked } })} />
                                <span className="font-bold text-sm text-white">Aktif</span>
                            </label>
                        </div>
                        {marketplaceSettings.trendyol.enabled && (
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">API Key</label>
                                    <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.trendyol.apiKey} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, apiKey: e.target.value } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">API Secret</label>
                                    <input type="password" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.trendyol.apiSecret} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, apiSecret: e.target.value } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Supplier ID</label>
                                    <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.trendyol.supplierId} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, supplierId: e.target.value } })} />
                                </div>
                                <label className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all select-none">
                                    <input type="checkbox" className="accent-primary w-5 h-5" checked={marketplaceSettings.trendyol.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, trendyol: { ...marketplaceSettings.trendyol, autoSync: e.target.checked } })} />
                                    <div>
                                        <div className="text-sm font-bold text-white">Otomatik Senkronizasyon</div>
                                        <div className="text-xs text-white/40">Siparişleri otomatik olarak sisteme aktar</div>
                                    </div>
                                </label>
                                <div className="pt-2">
                                    <button onClick={() => testMarketplaceConnection('trendyol')} disabled={isTesting} className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm tracking-widest transition-all">
                                        {isTesting ? '⏳ Test Ediliyor...' : '🔍 Bağlantıyı Test Et'}
                                    </button>
                                    {testResults.trendyol && (
                                        <div className={`mt-3 p-3 rounded-lg text-sm font-bold ${testResults.trendyol.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {testResults.trendyol}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card glass p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">🟧</div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Hepsiburada</h3>
                                    <p className="text-xs text-white/40 mt-1">Teknoloji ve elektronik pazaryeri</p>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" className="accent-primary w-5 h-5 rounded-md" checked={marketplaceSettings.hepsiburada.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, enabled: e.target.checked } })} />
                                <span className="font-bold text-sm text-white">Aktif</span>
                            </label>
                        </div>
                        {marketplaceSettings.hepsiburada.enabled && (
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <label className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg cursor-pointer w-fit">
                                    <input type="checkbox" className="accent-amber-500 w-4 h-4" checked={(marketplaceSettings.hepsiburada as any).isTest || false} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, isTest: e.target.checked } as any })} />
                                    <span className="text-xs font-bold text-amber-500">Test Ortamı (Sandbox)</span>
                                </label>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Merchant ID</label>
                                    <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.hepsiburada.merchantId} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, merchantId: e.target.value } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">API Kullanıcı Adı</label>
                                    <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" placeholder="Genellikle Merchant ID" value={marketplaceSettings.hepsiburada.username} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, username: e.target.value } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">API Şifresi</label>
                                    <input type="password" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.hepsiburada.password} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, password: e.target.value } })} />
                                </div>
                                <label className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all select-none">
                                    <input type="checkbox" className="accent-primary w-5 h-5" checked={marketplaceSettings.hepsiburada.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, hepsiburada: { ...marketplaceSettings.hepsiburada, autoSync: e.target.checked } })} />
                                    <div>
                                        <div className="text-sm font-bold text-white">Otomatik Senkronizasyon</div>
                                        <div className="text-xs text-white/40">Siparişleri otomatik olarak sisteme aktar</div>
                                    </div>
                                </label>
                                <div className="pt-2">
                                    <button onClick={() => testMarketplaceConnection('hepsiburada')} disabled={isTesting} className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm tracking-widest transition-all">
                                        {isTesting ? '⏳ Test Ediliyor...' : '🔍 Bağlantıyı Test Et'}
                                    </button>
                                    {testResults.hepsiburada && (
                                        <div className={`mt-3 p-3 rounded-lg text-sm font-bold ${testResults.hepsiburada.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {testResults.hepsiburada}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card glass p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">🐞</div>
                                <div>
                                    <h3 className="text-lg font-black text-white">N11</h3>
                                    <p className="text-xs text-white/40 mt-1">Hayat sana gelir</p>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" className="accent-primary w-5 h-5 rounded-md" checked={marketplaceSettings.n11.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, enabled: e.target.checked } })} />
                                <span className="font-bold text-sm text-white">Aktif</span>
                            </label>
                        </div>
                        {marketplaceSettings.n11.enabled && (
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">API Key</label>
                                    <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.n11.apiKey} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, apiKey: e.target.value } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">API Secret</label>
                                    <input type="password" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.n11.apiSecret} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, apiSecret: e.target.value } })} />
                                </div>
                                <label className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all select-none">
                                    <input type="checkbox" className="accent-primary w-5 h-5" checked={marketplaceSettings.n11.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, n11: { ...marketplaceSettings.n11, autoSync: e.target.checked } })} />
                                    <div>
                                        <div className="text-sm font-bold text-white">Otomatik Senkronizasyon</div>
                                        <div className="text-xs text-white/40">Siparişleri otomatik olarak sisteme aktar</div>
                                    </div>
                                </label>
                                <div className="pt-2">
                                    <button onClick={() => testMarketplaceConnection('n11')} disabled={isTesting} className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm tracking-widest transition-all">
                                        {isTesting ? '⏳ Test Ediliyor...' : '🔍 Bağlantıyı Test Et'}
                                    </button>
                                    {testResults.n11 && (
                                        <div className={`mt-3 p-3 rounded-lg text-sm font-bold ${testResults.n11.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {testResults.n11}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card glass p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">🅰️</div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Amazon TR</h3>
                                    <p className="text-xs text-white/40 mt-1">Amazon Türkiye Pazaryeri</p>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" className="accent-primary w-5 h-5 rounded-md" checked={marketplaceSettings.amazon.enabled} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, enabled: e.target.checked } })} />
                                <span className="font-bold text-sm text-white">Aktif</span>
                            </label>
                        </div>
                        {marketplaceSettings.amazon.enabled && (
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Seller ID</label>
                                    <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.amazon.sellerId} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, sellerId: e.target.value } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">MWS Auth Token</label>
                                    <input type="password" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.amazon.mwsAuthToken} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, mwsAuthToken: e.target.value } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Access Key</label>
                                    <input type="text" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.amazon.accessKey} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, accessKey: e.target.value } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Secret Key</label>
                                    <input type="password" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono" value={marketplaceSettings.amazon.secretKey} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, secretKey: e.target.value } })} />
                                </div>
                                <label className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all select-none">
                                    <input type="checkbox" className="accent-primary w-5 h-5" checked={marketplaceSettings.amazon.autoSync} onChange={(e) => setMarketplaceSettings({ ...marketplaceSettings, amazon: { ...marketplaceSettings.amazon, autoSync: e.target.checked } })} />
                                    <div>
                                        <div className="text-sm font-bold text-white">Otomatik Senkronizasyon</div>
                                        <div className="text-xs text-white/40">Siparişleri otomatik olarak sisteme aktar</div>
                                    </div>
                                </label>
                                <div className="pt-2">
                                    <button onClick={() => testMarketplaceConnection('amazon')} disabled={isTesting} className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm tracking-widest transition-all">
                                        {isTesting ? '⏳ Test Ediliyor...' : '🔍 Bağlantıyı Test Et'}
                                    </button>
                                    {testResults.amazon && (
                                        <div className={`mt-3 p-3 rounded-lg text-sm font-bold ${testResults.amazon.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {testResults.amazon}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
