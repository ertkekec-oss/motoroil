'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import BankIntegrationOnboarding from './Banking/BankIntegrationOnboarding';
import { apiFetch } from '@/lib/api-client';

// ─── ZERO LOGIC CHANGE ───────────────────────────────────────────────────────
// Yalnızca UI/UX Financial Control (ERP) mantığına çevrildi.
// State, API requestler, handler'lar BİREBİR aynıdır.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared UI Primitives ─────────────────────────────────────────────────────

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className="w-full h-10 px-3 bg-white dark:bg-[#020617] border border-slate-300 dark:border-white/10 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
        />
    );
}

function ERPSelect(props: any) {
    return (
        <select
            {...props}
            className="w-full h-10 px-3 bg-white dark:bg-[#020617] border border-slate-300 dark:border-white/10 rounded-lg text-[14px] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
        />
    );
}

function ERPField({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
            <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400 transition-colors">{label}</label>
            {children}
        </div>
    );
}

function ERPBlock({ title, children, aside }: { title?: string, children: React.ReactNode, aside?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)]">
            {(title || aside) && (
                <div className="flex items-center justify-between mb-6">
                    {title && <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">{title}</h3>}
                    {aside && <div>{aside}</div>}
                </div>
            )}
            {children}
        </div>
    );
}

function ERPSwitch({ checked, onChange, label, description }: any) {
    return (
        <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative inline-flex items-center mt-0.5">
                <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
                <div className="w-9 h-5 bg-slate-200 peer-checked:bg-slate-900 dark:bg-white rounded-full transition-colors duration-200">
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#0B1220] shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
            </div>
            <div>
                <p className="text-[14px] font-medium text-slate-900 dark:text-white group-hover:text-black transition-colors">{label}</p>
                {description && <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
        </label>
    );
}

function TestResultBanner({ result }: { result?: string }) {
    if (!result) return null;
    const ok = result.includes('✅');
    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-[13px] font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 ${ok
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-50 dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 border-slate-300 dark:border-white/10'
            }`}>
            <span className="text-base shrink-0">{ok ? '✅' : 'ℹ️'}</span>
            <span>{result.replace('✅', '').replace('❌', '').trim()}</span>
        </div>
    );
}

// ── Tab Nav / Strip ──────────────────────────────────────────────────────────

type TabId = 'efatura' | 'marketplace' | 'pos' | 'banking';

const TABS: { id: TabId; label: string; desc: string }[] = [
    { id: 'efatura', label: 'E-Fatura', desc: 'Nilvera GİB Entegrasyonu' },
    { id: 'marketplace', label: 'Pazaryerleri', desc: 'Trendyol, N11, Amazon...' },
    { id: 'pos', label: 'Yazar Kasa POS', desc: 'Ödeal POS Entegrasyonu' },
    { id: 'banking', label: 'Banka Entegrasyonu', desc: 'XML / MT940 / SFTP' },
];

function NavStrip({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (id: TabId) => void }) {
    return (
        <div className="flex bg-white dark:bg-[#0B1220] px-8 pt-2">
            {TABS?.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative px-6 py-4 flex flex-col items-start gap-0.5 transition-colors focus:outline-none ${isActive ? '' : 'hover:bg-slate-50'
                            }`}
                    >
                        <span className={`text-[14px] font-semibold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{tab.label}</span>
                        <span className="text-[12px] text-slate-400 dark:text-slate-500">{tab.desc}</span>
                        {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-t-sm" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ── E-Fatura Tab ─────────────────────────────────────────────────────────────

function EFaturaTab({ settings, onChange, onTest, isTesting, testResult }: any) {
    return (
        <div className="max-w-5xl mx-auto w-full px-8 py-8 space-y-6 animate-in fade-in duration-300">
            {/* Ozet Strip */}
            <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-8">
                    <div>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Entegrasyon</p>
                        <p className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" /> Nilvera E-Fatura
                        </p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Ortam</p>
                        <p className="text-[14px] font-medium text-slate-700 dark:text-slate-200">{settings.environment === 'production' ? 'Canlı Ortam' : 'Test Ortamı'}</p>
                    </div>
                </div>
                <button
                    onClick={onTest}
                    disabled={isTesting}
                    className="h-9 px-4 bg-white dark:bg-[#0B1220] border border-slate-300 dark:border-white/10 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
                >
                    {isTesting ? 'Test Ediliyor...' : 'Bağlantı Testi'}
                </button>
            </div>

            {testResult && <TestResultBanner result={testResult} />}

            {/* Çalışma Ortamı */}
            <ERPBlock title="Çalışma Ortamı">
                <div className="flex p-1 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl w-fit">
                    {[
                        { value: 'test', label: 'Test Ortamı' },
                        { value: 'production', label: 'Canlı Ortam' },
                    ]?.map(env => (
                        <button
                            key={env.value}
                            onClick={() => onChange({ ...settings, environment: env.value })}
                            className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${settings.environment === env.value
                                ? 'bg-white dark:bg-[#0B1220] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5/60'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            {env.label}
                        </button>
                    ))}
                </div>
            </ERPBlock>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Şirket Bilgileri */}
                <ERPBlock title="Şirket Bilgileri">
                    <div className="space-y-4">
                        <ERPField label="Şirket VKN / TCKN">
                            <ERPInput
                                placeholder="1234567890"
                                value={settings.companyVkn}
                                onChange={(e: any) => onChange({ ...settings, companyVkn: e.target.value })}
                            />
                        </ERPField>
                        <ERPField label="Şirket Ünvanı">
                            <ERPInput
                                placeholder="Firma A.Ş."
                                value={settings.companyTitle}
                                onChange={(e: any) => onChange({ ...settings, companyTitle: e.target.value })}
                            />
                        </ERPField>
                        <div className="mt-2 p-3.5 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl">
                            <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                <span className="font-semibold text-slate-900 dark:text-white">Bilgi:</span> VKN/TCKN bilgisi GİB portalındaki ile birebir aynı olmalıdır. Değişiklikler fatura senkronizasyonunu etkileyebilir.
                            </p>
                        </div>
                    </div>
                </ERPBlock>

                <div className="space-y-6">
                    {/* Kullanıcı Kimliği */}
                    <ERPBlock title="Portal Kullanıcı Kimliği">
                        <div className="space-y-4">
                            <ERPField label="Kullanıcı Adı">
                                <ERPInput
                                    placeholder="ornek@firma.com"
                                    value={settings.username}
                                    onChange={(e: any) => onChange({ ...settings, username: e.target.value })}
                                />
                            </ERPField>
                            <ERPField label="Portal Şifresi">
                                <ERPInput
                                    type="password"
                                    placeholder="••••••••"
                                    value={settings.password}
                                    onChange={(e: any) => onChange({ ...settings, password: e.target.value })}
                                />
                            </ERPField>
                        </div>
                    </ERPBlock>

                    {/* API Bağlantısı (Gizlenebilir, Compact) */}
                    <div className="bg-white dark:bg-[#0B1220] border text-sm border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.02)]">
                        <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-4">Gelişmiş API Ayarları</h4>
                        <div className="space-y-4">
                            <ERPField label="API Uç Noktası (Endpoint)">
                                <ERPInput
                                    value={settings.apiUrl}
                                    onChange={(e: any) => onChange({ ...settings, apiUrl: e.target.value })}
                                />
                            </ERPField>
                            <ERPField label="API Key (Opsiyonel)">
                                <ERPInput
                                    type="password"
                                    placeholder="Opsiyonel özel token"
                                    value={settings.apiKey}
                                    onChange={(e: any) => onChange({ ...settings, apiKey: e.target.value })}
                                />
                            </ERPField>
                        </div>
                    </div>
                </div>
            </div>

            {/* Otomasyon */}
            <ERPBlock title="Otomasyon Yapılandırması">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ERPSwitch
                        checked={settings.autoSend}
                        onChange={(e: any) => onChange({ ...settings, autoSend: e.target.checked })}
                        label="Otomatik Gönderim"
                        description="Satış tamamlandığında faturayı otomatik kuyruğa alır."
                    />
                    <ERPSwitch
                        checked={settings.autoApprove}
                        onChange={(e: any) => onChange({ ...settings, autoApprove: e.target.checked })}
                        label="Gelen Fatura Onayı"
                        description="Satın alma faturalarını varsayılan olarak kabul eder."
                    />
                </div>
            </ERPBlock>
        </div>
    );
}

// ── Pazaryeri Tab ────────────────────────────────────────────────────────────

const MARKETPLACE_CONFIGS = [
    { key: 'custom', title: 'Periodya E-Ticaret', method: 'XML Ops', fields: ['url', 'branch'] },
    { key: 'trendyol', title: 'Trendyol', method: 'API Auth', fields: ['apiKey', 'apiSecret', 'supplierId', 'branch'] },
    { key: 'hepsiburada', title: 'Hepsiburada', method: 'Merchant API', fields: ['merchantId', 'username', 'password', 'branch'] },
    { key: 'n11', title: 'N11', method: 'SOAP / REST', fields: ['apiKey', 'apiSecret', 'branch'] },
    { key: 'amazon', title: 'Amazon TR', method: 'SP-API', fields: ['sellerId', 'mwsAuthToken', 'accessKey', 'secretKey', 'branch'] },
    { key: 'pazarama', title: 'Pazarama', method: 'OAuth', fields: ['apiKey', 'apiSecret', 'branch'] },
];

function MarketplaceTab({ settings, onChange, onTest, isTesting, testResults, stats, onRefreshStats, branches }: any) {
    const activeCount = MARKETPLACE_CONFIGS.filter(m => (settings as any)[m.key]?.enabled).length;
    const [activeConfigObj, setActiveConfigObj] = useState<any>(null);

    return (
        <div className="max-w-6xl mx-auto w-full px-8 py-8 space-y-8 animate-in fade-in duration-300">
            {/* Ozet / Dashboard Strip */}
            <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/5 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50">
                    <div>
                        <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Çoklu Kanal (Omnichannel) İzleme</p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Sipariş verileri asenkron senkronize edilir.</p>
                    </div>
                    <button onClick={onRefreshStats} className="text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0B1220] px-3 py-1.5 rounded-lg shadow-sm">
                        Verileri Tazele 🔄
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-white/5">
                    {[
                        { val: `₺${stats?.financials?.openReceivables?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) ?? '—'}`, label: 'Açık Alacaklar' },
                        { val: `${stats?.financials?.pendingSettlements || 0}`, label: 'Bekleyen Settlement' },
                        { val: `${stats?.orders?.last24h || 0}`, label: '24s Sipariş' },
                        { val: `${activeCount} / ${MARKETPLACE_CONFIGS.length}`, label: 'Bağlı Kanal' },
                    ]?.map((s, i) => (
                        <div key={i} className="p-5 md:p-6 flex flex-col items-center text-center">
                            <p className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">{s.val}</p>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Kanal Konfigürasyonları - Grid Formati */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MARKETPLACE_CONFIGS?.map(ch => {
                    const mktSettings = (settings as any)[ch.key] || {};
                    const enabled = mktSettings.enabled ?? false;

                    return (
                        <div key={ch.key} className={`bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-200 ${enabled ? 'ring-1 ring-blue-500/20 shadow-blue-500/5' : 'hover:border-slate-300 dark:hover:border-white/10'}`}>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[20px] shadow-sm ${enabled ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-slate-100 dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5'}`}>
                                        {ch.title.substring(0, 1)}
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <ERPSwitch
                                            checked={enabled}
                                            onChange={(e: any) => { onChange({ ...settings, [ch.key]: { ...mktSettings, enabled: e.target.checked } }); }}
                                        />
                                    </div>
                                </div>
                                <div className="mb-8">
                                    <h4 className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight">{ch.title}</h4>
                                    <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">{ch.method}</span>
                                </div>
                                
                                <div className="mt-auto pt-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <span className={`text-[12px] font-bold flex items-center gap-2 ${enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                        <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                                        {enabled ? 'Bağlantı Aktif' : 'Pasif'}
                                    </span>
                                    <button
                                        onClick={() => setActiveConfigObj(ch)}
                                        className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                                    >
                                        Yapılandır <span>&rarr;</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Config Modal */}
            {activeConfigObj && (() => {
                const ch = activeConfigObj;
                const mktSettings = (settings as any)[ch.key] || {};
                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6" onClick={() => setActiveConfigObj(null)}>
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-[#0B1220]">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                                        {ch.title.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">{ch.title} Yapılandırması</h3>
                                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{ch.method} Portalı Bağlantı Ayarları</p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveConfigObj(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors text-slate-700 dark:text-white">✕</button>
                            </div>
                            
                            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {ch.fields.includes('url') && (
                                        <div className="col-span-1 md:col-span-2"><ERPField label="XML URL">
                                            <ERPInput value={mktSettings.url || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, url: e.target.value } })} />
                                        </ERPField></div>
                                    )}
                                    {ch.fields.includes('apiKey') && (
                                        <ERPField label="API Key / Application Key">
                                            <ERPInput type="password" value={mktSettings.apiKey || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, apiKey: e.target.value } })} />
                                        </ERPField>
                                    )}
                                    {ch.fields.includes('apiSecret') && (
                                        <ERPField label="API Secret / App Secret">
                                            <ERPInput type="password" value={mktSettings.apiSecret || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, apiSecret: e.target.value } })} />
                                        </ERPField>
                                    )}
                                    {ch.fields.includes('supplierId') && (
                                        <ERPField label="Supplier ID">
                                            <ERPInput value={mktSettings.supplierId || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, supplierId: e.target.value } })} />
                                        </ERPField>
                                    )}
                                    {ch.fields.includes('merchantId') && (
                                        <ERPField label="Merchant ID">
                                            <ERPInput value={mktSettings.merchantId || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, merchantId: e.target.value } })} />
                                        </ERPField>
                                    )}
                                    {ch.fields.includes('username') && (
                                        <ERPField label="API Kullanıcısı">
                                            <ERPInput value={mktSettings.username || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, username: e.target.value } })} />
                                        </ERPField>
                                    )}
                                    {ch.fields.includes('password') && (
                                        <ERPField label="Secret Key / Parola">
                                            <ERPInput type="password" value={mktSettings.password || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, password: e.target.value } })} />
                                        </ERPField>
                                    )}
                                    {ch.fields.includes('sellerId') && (
                                        <ERPField label="Seller ID">
                                            <ERPInput value={mktSettings.sellerId || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, sellerId: e.target.value } })} />
                                        </ERPField>
                                    )}
                                    {ch.fields.includes('mwsAuthToken') && (
                                        <ERPField label="MWS Auth Token">
                                            <ERPInput type="password" value={mktSettings.mwsAuthToken || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, mwsAuthToken: e.target.value } })} />
                                        </ERPField>
                                    )}
                                    {ch.fields.includes('accessKey') && (
                                        <ERPField label="Access Key">
                                            <ERPInput value={mktSettings.accessKey || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, accessKey: e.target.value } })} />
                                        </ERPField>
                                    )}
                                    {ch.fields.includes('secretKey') && (
                                        <ERPField label="Secret Key">
                                            <ERPInput type="password" value={mktSettings.secretKey || ''} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, secretKey: e.target.value } })} />
                                        </ERPField>
                                    )}
                                    {ch.fields.includes('branch') && (
                                        <ERPField label="İşlem Deposu (Envanter)">
                                            <ERPSelect value={mktSettings.branch || 'Merkez'} onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, branch: e.target.value } })}>
                                                {branches?.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                                                {branches.length === 0 && <option value="Merkez">Merkez</option>}
                                            </ERPSelect>
                                        </ERPField>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl">
                                    <div className="flex gap-4 items-start">
                                        <div className="mt-1 text-slate-400">⚡</div>
                                        <ERPSwitch
                                            checked={mktSettings.autoSync ?? false}
                                            onChange={(e: any) => onChange({ ...settings, [ch.key]: { ...mktSettings, autoSync: e.target.checked } })}
                                            label="Arka Plan Sync."
                                            description="Siparişleri otomatik tarar."
                                        />
                                    </div>
                                    <button
                                        onClick={() => onTest(ch.key)}
                                        disabled={isTesting}
                                        className="shrink-0 h-10 px-5 bg-white dark:bg-[#0B1220] border border-slate-300 dark:border-white/10 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 transition-colors shadow-sm"
                                    >
                                        {isTesting ? 'Sınanıyor...' : 'Bağlantıyı Doğrula'}
                                    </button>
                                </div>
                                {testResults[ch.key] && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <TestResultBanner result={testResults[ch.key]} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0B1220] flex justify-end gap-3">
                                <button onClick={() => setActiveConfigObj(null)} className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[14px] font-semibold transition-colors shadow-sm">
                                    Tamam, Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

// ── POS Tab ──────────────────────────────────────────────────────────────────

function POSTab({ settings, onChange }: any) {
    return (
        <div className="max-w-5xl mx-auto w-full px-8 py-8 space-y-6 animate-in fade-in duration-300">
            {/* Ozet Strip */}
            <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-8">
                <div>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Terminal</p>
                    <p className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" /> Ödeal POS
                    </p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Durum</p>
                    <p className="text-[14px] font-medium text-slate-700 dark:text-slate-200">Aktif İşlemde</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kimlik Blok */}
                <ERPBlock title="Cihaz Bağlantı Noktası">
                    <div className="space-y-4">
                        <ERPField label="API İletişim Anahtarı (Live Token)">
                            <ERPInput
                                type="password"
                                placeholder="Od_Live_••••"
                                value={settings.apiKey}
                                onChange={(e: any) => onChange({ ...settings, apiKey: e.target.value })}
                            />
                        </ERPField>
                        <ERPField label="Cihaz Seri No / Terminal ID">
                            <ERPInput
                                placeholder="TR9988XXXX"
                                value={settings.terminalId}
                                onChange={(e: any) => onChange({ ...settings, terminalId: e.target.value })}
                            />
                        </ERPField>
                    </div>
                </ERPBlock>

                <ERPBlock title="İşlem Politikaları">
                    <div className="space-y-6">
                        <ERPSwitch
                            checked={settings.autoReceipt}
                            onChange={(e: any) => onChange({ ...settings, autoReceipt: e.target.checked })}
                            label="Otomatik Fiş Üretimi"
                            description="Başarılı tahsilatta cihaza anında yazdırma emri gönder."
                        />
                        <ERPSwitch
                            checked={settings.testMode}
                            onChange={(e: any) => onChange({ ...settings, testMode: e.target.checked })}
                            label="Simülasyon Modu"
                            description="Test kartları ile kapalı devre işlem. (Finansal yansımaz)"
                        />
                    </div>
                </ERPBlock>
            </div>

            {/* Bilgi Kutusu */}
            <div className="border border-slate-200 dark:border-white/5 rounded-2xl p-6 bg-slate-50/50 space-y-3">
                <h4 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-2">POS İşlem Akış Dizini</h4>
                <div className="grid gap-2">
                    <p className="text-[14px] text-slate-600 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">1.</strong> Satış ekranında tutar cihaza yansıtılır.</p>
                    <p className="text-[14px] text-slate-600 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">2.</strong> Banka onay kodu sisteme döner, açık fatura/tahsilat kapanır.</p>
                    <p className="text-[14px] text-slate-600 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">3.</strong> Cihaz Z raporu mutabakatını sağlayınız.</p>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function IntegrationsContent() {
    const { showSuccess, showError } = useModal();
    const [activeTab, setActiveTab] = useState<TabId>('efatura');

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
        custom: { enabled: true, url: 'https://www.periodya.com/xml.php?c=siparisler', autoSync: false, syncInterval: 60, branch: 'Merkez' }
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
                body: JSON.stringify({ apiKey: eFaturaSettings.apiKey, username: eFaturaSettings.username, password: eFaturaSettings.password, environment: eFaturaSettings.environment, companyVkn: eFaturaSettings.companyVkn })
            });
            const data = await res.json();
            setTestResults({ ...testResults, efatura: data.success ? '✅ Nilvera Sağlıklı Bağlantı Doğrulandı.' : `❌ ${data.error}` });
        } catch (error: any) {
            setTestResults({ ...testResults, efatura: `❌ Bağlantı hatası: ${error.message}` });
        }
        setIsTesting(false);
    };

    const testMarketplaceConnection = async (marketplace: string) => {
        setIsTesting(true);
        setTestResults(prev => ({ ...prev, [marketplace]: '⏳ Sistem sorgulanıyor...' }));
        try {
            if (marketplace === 'custom') {
                const response = await apiFetch('/api/integrations/ecommerce/sync', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    setTestResults(prev => ({ ...prev, [marketplace]: `✅ Entegrasyon Başarılı. XML Bağlantısı sağlandı.` }));
                } else throw new Error(data.error || 'API İletişim Hatası');
            } else {
                const config = { ...(marketplaceSettings as any)[marketplace] };
                const response = await apiFetch('/api/integrations/marketplace/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: marketplace, config })
                });
                const data = await response.json();
                if (data.success) {
                    let msg = `✅ ${data.message || 'Bağlantı ve senkronizasyon başarılı.'}`;
                    if (data.errors?.length > 0) msg += `\n❌ ${data.errors.length} İstisna Kaydı Oluştu`;
                    setTestResults(prev => ({ ...prev, [marketplace]: msg }));
                } else throw new Error(data.error || 'Geçersiz Kimlik Bilgileri');
            }
        } catch (error: any) {
            setTestResults(prev => ({ ...prev, [marketplace]: `❌ Hata: ${error.message || 'Erişim engellendi'}` }));
        }
        setIsTesting(false);
    };

    const fetchStats = async () => {
        try {
            const res = await apiFetch('/api/integrations/marketplace/stats');
            const data = await res.json();
            if (data.success) setStats(data.stats);
        } catch (e) { console.error('Stats fetch error:', e); }
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
                showSuccess('Başarılı', 'Kurumsal yapılandırma kaydedildi.');
                localStorage.setItem('periodya_efatura_settings', JSON.stringify(eFaturaSettings));
                localStorage.setItem('periodya_marketplace_settings', JSON.stringify(marketplaceSettings));
                localStorage.setItem('periodya_pos_settings', JSON.stringify(posSettings));
            } else {
                showError('Yapılandırma Hatası', data.error);
            }
        } catch {
            showError('Hata', 'Sunucu bağlantı kesintisi.');
            localStorage.setItem('periodya_efatura_settings', JSON.stringify(eFaturaSettings));
            localStorage.setItem('periodya_marketplace_settings', JSON.stringify(marketplaceSettings));
            localStorage.setItem('periodya_pos_settings', JSON.stringify(posSettings));
            showSuccess('Tamamlandı', 'Çevrimdışı kayıt oluşturuldu.');
        }
        setIsSaving(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-transparent">
            {/* Header */}
            <header className="bg-white dark:bg-[#0B1220] border-b border-slate-200 dark:border-white/5 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Sistem Entegrasyonları</h1>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-0.5">Ticari servis yönetim ve bağlantı merkezi.</p>
                </div>
                <button
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="h-10 px-5 bg-slate-900 dark:bg-white rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    {isSaving ? 'İşleniyor...' : 'Ayarları Kaydet'}
                </button>
            </header>

            {/* Content */}
            <main>
                {/* Horizontal Navigation Strip */}
                <NavStrip activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Tab Views */}
                <div className="py-2">
                    {activeTab === 'efatura' && (
                        <EFaturaTab
                            settings={eFaturaSettings}
                            onChange={setEFaturaSettings}
                            onTest={testEFaturaConnection}
                            isTesting={isTesting}
                            testResult={testResults.efatura}
                        />
                    )}
                    {activeTab === 'marketplace' && (
                        <MarketplaceTab
                            settings={marketplaceSettings}
                            onChange={setMarketplaceSettings}
                            onTest={testMarketplaceConnection}
                            isTesting={isTesting}
                            testResults={testResults}
                            stats={stats}
                            onRefreshStats={fetchStats}
                            branches={branches}
                        />
                    )}
                    {activeTab === 'pos' && (
                        <POSTab settings={posSettings} onChange={setPosSettings} />
                    )}
                    {activeTab === 'banking' && (
                        <div className="max-w-5xl mx-auto w-full px-8 py-8 animate-in fade-in duration-300">
                            <BankIntegrationOnboarding />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
