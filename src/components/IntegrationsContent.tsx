'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import BankIntegrationOnboarding from './Banking/BankIntegrationOnboarding';
import { apiFetch } from '@/lib/api-client';
import {
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseCard,
    EnterpriseButton,
    EnterpriseField,
    EnterprisePageShell,
    EnterpriseSwitch,
} from "@/components/ui/enterprise";

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ active, activeLabel = 'Aktif', inactiveLabel = 'Pasif' }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${active
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {active ? activeLabel : inactiveLabel}
        </span>
    );
}

function TestResultBanner({ result }: { result?: string }) {
    if (!result) return null;
    const ok = result.includes('✅');
    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 ${ok
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'
            }`}>
            <span className="text-base shrink-0">{ok ? '✅' : '❌'}</span>
            <span>{result.replace('✅', '').replace('❌', '').trim()}</span>
        </div>
    );
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{label}</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
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

// ─── Tab Navigation ──────────────────────────────────────────────────────────

type TabId = 'efatura' | 'marketplace' | 'pos' | 'banking';

const TABS: { id: TabId; icon: string; label: string; desc: string; color: string }[] = [
    { id: 'efatura', icon: '📄', label: 'E-Fatura', desc: 'Nilvera GİB Entegrasyonu', color: 'blue' },
    { id: 'marketplace', icon: '🛒', label: 'Pazaryerleri', desc: 'Trendyol, n11, Amazon…', color: 'orange' },
    { id: 'pos', icon: '💳', label: 'Yazar Kasa POS', desc: 'Ödeal POS Entegrasyonu', color: 'violet' },
    { id: 'banking', icon: '🏦', label: 'Banka Entegrasyonu', desc: 'XML / MT940 / SFTP', color: 'emerald' },
];

const tabColorMap: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400',
    orange: 'border-orange-500 bg-orange-500/5 text-orange-600 dark:text-orange-400',
    violet: 'border-violet-500 bg-violet-500/5 text-violet-600 dark:text-violet-400',
    emerald: 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
};

function TabNav({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (id: TabId) => void }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`group flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${isActive
                            ? `${tabColorMap[tab.color]} shadow-sm`
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                    >
                        <span className={`text-2xl shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>{tab.icon}</span>
                        <div>
                            <div className={`font-semibold text-sm ${isActive ? '' : 'text-slate-700 dark:text-slate-200'}`}>{tab.label}</div>
                            <div className={`text-[10px] mt-0.5 ${isActive ? 'opacity-80' : 'text-slate-400 dark:text-slate-500'}`}>{tab.desc}</div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ─── E-Fatura Tab ─────────────────────────────────────────────────────────────

function EFaturaTab({ settings, onChange, onTest, isTesting, testResult }: any) {
    return (
        <div className="animate-in fade-in duration-200 space-y-6">
            {/* Header Card */}
            <EnterpriseCard>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-2xl shrink-0">📄</div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">E-Fatura Entegrasyonu</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Nilvera aracılığıyla GİB uyumlu e-fatura gönderimi</p>
                        </div>
                    </div>
                    <StatusBadge
                        active={settings.environment === 'production'}
                        activeLabel="Canlı Ortam"
                        inactiveLabel="Test Ortamı"
                    />
                </div>

                {/* Environment Toggle */}
                <div className="mb-6">
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Çalışma Ortamı</label>
                    <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        {[
                            { value: 'test', label: '🧪 Test Ortamı' },
                            { value: 'production', label: '🚀 Canlı Ortam' },
                        ].map(env => (
                            <button
                                key={env.value}
                                onClick={() => onChange({ ...settings, environment: env.value })}
                                className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition-all ${settings.environment === env.value
                                    ? env.value === 'production'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-900 dark:bg-slate-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {env.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Form Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Şirket Bilgileri */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Şirket Bilgileri</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <EnterpriseField label="Şirket VKN / TCKN">
                                <EnterpriseInput
                                    placeholder="1234567890"
                                    value={settings.companyVkn}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...settings, companyVkn: e.target.value })}
                                />
                            </EnterpriseField>
                            <EnterpriseField label="Şirket Ünvanı">
                                <EnterpriseInput
                                    placeholder="Firma A.Ş."
                                    value={settings.companyTitle}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...settings, companyTitle: e.target.value })}
                                />
                            </EnterpriseField>
                        </div>
                        <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                <strong>⚠️ Önemli:</strong> VKN/TCKN bilgisi Nilvera panelindeki &quot;Şirket Bilgileri&quot; ile birebir aynı olmalıdır. Yanlış VKN fatura reddine neden olur.
                            </p>
                        </div>
                    </div>

                    {/* API Bağlantısı */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">API Bağlantısı</h3>
                        <EnterpriseField label="API Adresi">
                            <EnterpriseInput
                                value={settings.apiUrl}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...settings, apiUrl: e.target.value })}
                            />
                        </EnterpriseField>
                        <EnterpriseField label="API Key (Opsiyonel)">
                            <EnterpriseInput
                                placeholder="Opsiyonel API anahtarı"
                                value={settings.apiKey}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...settings, apiKey: e.target.value })}
                            />
                        </EnterpriseField>

                        <SectionDivider label="Kullanıcı Bilgileri" />

                        <div className="grid grid-cols-2 gap-4">
                            <EnterpriseField label="Kullanıcı Adı">
                                <EnterpriseInput
                                    placeholder="ornek@firma.com"
                                    value={settings.username}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...settings, username: e.target.value })}
                                />
                            </EnterpriseField>
                            <EnterpriseField label="Portal Şifresi">
                                <EnterpriseInput
                                    type="password"
                                    placeholder="••••••••"
                                    value={settings.password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...settings, password: e.target.value })}
                                />
                            </EnterpriseField>
                        </div>
                    </div>
                </div>
            </EnterpriseCard>

            {/* Otomasyon Ayarları */}
            <EnterpriseCard>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Otomasyon Ayarları</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <EnterpriseSwitch
                        checked={settings.autoSend}
                        onChange={(e) => onChange({ ...settings, autoSend: e.target.checked })}
                        label="Otomatik Gönderim"
                        description="Satış tamamlandığında faturayı otomatik oluşturur."
                    />
                    <EnterpriseSwitch
                        checked={settings.autoApprove}
                        onChange={(e) => onChange({ ...settings, autoApprove: e.target.checked })}
                        label="Otomatik Onay"
                        description="Gelen faturaları otomatik olarak yanıtla/onayla."
                    />
                </div>
            </EnterpriseCard>

            {/* Test & Action */}
            <EnterpriseCard>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Bağlantı Testi</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">API kimlik bilgilerinizi doğrulamak için testi çalıştırın.</p>
                    </div>
                    <EnterpriseButton variant="secondary" onClick={onTest} disabled={isTesting}>
                        {isTesting
                            ? <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Test Ediliyor...</>
                            : <>🔍 Bağlantıyı Test Et</>
                        }
                    </EnterpriseButton>
                </div>
                <TestResultBanner result={testResult} />
            </EnterpriseCard>
        </div>
    );
}

// ─── Marketplace Tab ──────────────────────────────────────────────────────────

const MARKETPLACE_CONFIGS = [
    {
        key: 'custom', icon: '🏍️', title: 'Periodya E-Ticaret', desc: 'Özel XML entegrasyonu',
        fields: (settings: any, branches: any[], onChange: Function) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EnterpriseField label="XML URL">
                    <EnterpriseInput placeholder="https://site.com/xml.php" value={settings.url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ url: e.target.value })} />
                </EnterpriseField>
                <EnterpriseField label="İşlem Deposu">
                    <BranchSelect value={settings.branch || 'Merkez'} onChange={(e) => onChange({ branch: e.target.value })} branches={branches} />
                </EnterpriseField>
            </div>
        )
    },
    {
        key: 'trendyol', icon: '🟠', title: 'Trendyol', desc: "Türkiye'nin lider pazaryeri",
        fields: (settings: any, branches: any[], onChange: Function) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { label: 'API Key', field: 'apiKey', type: 'text' },
                    { label: 'API Secret', field: 'apiSecret', type: 'password' },
                    { label: 'Supplier ID', field: 'supplierId', type: 'text' },
                ].map(({ label, field, type }) => (
                    <EnterpriseField key={field} label={label}>
                        <EnterpriseInput type={type} value={settings[field] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ [field]: e.target.value })} />
                    </EnterpriseField>
                ))}
                <EnterpriseField label="İşlem Deposu">
                    <BranchSelect value={settings.branch || 'Merkez'} onChange={(e) => onChange({ branch: e.target.value })} branches={branches} />
                </EnterpriseField>
            </div>
        )
    },
    {
        key: 'hepsiburada', icon: '🟧', title: 'Hepsiburada', desc: 'Teknoloji ve yaşam pazaryeri',
        fields: (settings: any, branches: any[], onChange: Function) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { label: 'Merchant ID', field: 'merchantId', placeholder: 'f225561c-...', type: 'text' },
                    { label: 'API User', field: 'username', placeholder: 'Portal API Kullanıcısı', type: 'text' },
                    { label: 'Secret Key', field: 'password', placeholder: 'DTSF5...', type: 'password' },
                ].map(({ label, field, placeholder, type }) => (
                    <EnterpriseField key={field} label={label}>
                        <EnterpriseInput type={type} placeholder={placeholder} value={settings[field] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ [field]: e.target.value })} />
                    </EnterpriseField>
                ))}
                <EnterpriseField label="İşlem Deposu">
                    <BranchSelect value={settings.branch || 'Merkez'} onChange={(e) => onChange({ branch: e.target.value })} branches={branches} />
                </EnterpriseField>
            </div>
        )
    },
    {
        key: 'n11', icon: '🐞', title: 'N11', desc: 'Hayat Sana Gelir - Global pazaryeri',
        fields: (settings: any, branches: any[], onChange: Function) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { label: 'API Application Key', field: 'apiKey', type: 'text' },
                    { label: 'API Secret', field: 'apiSecret', type: 'password' },
                ].map(({ label, field, type }) => (
                    <EnterpriseField key={field} label={label}>
                        <EnterpriseInput type={type} value={settings[field] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ [field]: e.target.value })} />
                    </EnterpriseField>
                ))}
                <EnterpriseField label="İşlem Deposu">
                    <BranchSelect value={settings.branch || 'Merkez'} onChange={(e) => onChange({ branch: e.target.value })} branches={branches} />
                </EnterpriseField>
            </div>
        )
    },
    {
        key: 'amazon', icon: '🅰️', title: 'Amazon TR', desc: 'Amazon Türkiye Marketplace',
        fields: (settings: any, branches: any[], onChange: Function) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { label: 'Seller ID', field: 'sellerId', type: 'text' },
                    { label: 'MWS Auth Token', field: 'mwsAuthToken', type: 'password' },
                    { label: 'Access Key', field: 'accessKey', type: 'text' },
                    { label: 'Secret Key', field: 'secretKey', type: 'password' },
                ].map(({ label, field, type }) => (
                    <EnterpriseField key={field} label={label}>
                        <EnterpriseInput type={type} value={settings[field] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ [field]: e.target.value })} />
                    </EnterpriseField>
                ))}
                <EnterpriseField label="İşlem Deposu">
                    <BranchSelect value={settings.branch || 'Merkez'} onChange={(e) => onChange({ branch: e.target.value })} branches={branches} />
                </EnterpriseField>
            </div>
        )
    },
    {
        key: 'pazarama', icon: '🔵', title: 'Pazarama', desc: 'İş Bankası iştiraki pazaryeri',
        fields: (settings: any, branches: any[], onChange: Function) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { label: 'App Key', field: 'apiKey', type: 'text' },
                    { label: 'App Secret', field: 'apiSecret', type: 'password' },
                ].map(({ label, field, type }) => (
                    <EnterpriseField key={field} label={label}>
                        <EnterpriseInput type={type} value={settings[field] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ [field]: e.target.value })} />
                    </EnterpriseField>
                ))}
                <EnterpriseField label="İşlem Deposu">
                    <BranchSelect value={settings.branch || 'Merkez'} onChange={(e) => onChange({ branch: e.target.value })} branches={branches} />
                </EnterpriseField>
            </div>
        )
    },
];

function MarketplaceTab({ settings, onChange, onTest, isTesting, testResults, stats, onRefreshStats, branches }: any) {
    const activeCount = MARKETPLACE_CONFIGS.filter(m => (settings as any)[m.key]?.enabled).length;

    return (
        <div className="animate-in fade-in duration-200 space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Açık Alacaklar', value: `₺${stats?.financials?.openReceivables?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) ?? '—'}`, icon: '💰', sub: 'Tahsilat Bekleyen' },
                    { label: 'Askıda Settlement', value: `${stats?.financials?.pendingSettlements || 0} İşlem`, icon: '⏳', sub: 'Muhasebe Bekleyen' },
                    { label: '24 Saatlik Sipariş', value: `${stats?.orders?.last24h || 0} Adet`, icon: '📦', sub: 'Gerçek Zamanlı' },
                    { label: 'Aktif Entegrasyon', value: `${activeCount} / ${MARKETPLACE_CONFIGS.length}`, icon: '🔗', sub: 'Pazaryeri Bağlı' },
                ].map((s, i) => (
                    <EnterpriseCard key={i} className="!p-4">
                        <div className="flex items-start justify-between mb-2">
                            <span className="text-xl">{s.icon}</span>
                        </div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">{s.value}</div>
                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{s.sub}</div>
                    </EnterpriseCard>
                ))}
            </div>

            {/* Refresh Bar */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>🛰️</span>
                    <span className="font-medium">Pazaryeri verileri gerçek zamanlı izleniyor.</span>
                </div>
                <EnterpriseButton variant="secondary" onClick={onRefreshStats}>
                    🔄 Verileri Tazele
                </EnterpriseButton>
            </div>

            {/* Marketplace Cards */}
            {MARKETPLACE_CONFIGS.map(({ key, icon, title, desc, fields }) => {
                const mktSettings = (settings as any)[key] || {};
                const enabled = mktSettings.enabled ?? false;
                return (
                    <EnterpriseCard key={key}>
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0">
                                    {icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <StatusBadge active={enabled} />
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={enabled}
                                        onChange={(e) => onChange({ ...settings, [key]: { ...mktSettings, enabled: e.target.checked } })}
                                    />
                                    <div className="w-10 h-5.5 bg-slate-200 dark:bg-slate-700 peer-checked:bg-slate-900 dark:peer-checked:bg-white rounded-full relative transition-colors duration-200">
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 shadow transition-all duration-200 ${enabled ? 'left-5' : 'left-0.5'}`} />
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Expanded Form */}
                        {enabled && (
                            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-5 animate-in fade-in duration-200">
                                {fields(mktSettings, branches, (partial: any) => onChange({ ...settings, [key]: { ...mktSettings, ...partial } }))}

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <EnterpriseSwitch
                                        checked={mktSettings.autoSync ?? false}
                                        onChange={(e) => onChange({ ...settings, [key]: { ...mktSettings, autoSync: e.target.checked } })}
                                        label="Otomatik Senkronizasyon"
                                        description="Belirli aralıklarla siparişleri çeker."
                                        className="flex-1 !py-2.5"
                                    />
                                    <EnterpriseButton variant="secondary" onClick={() => onTest(key)} disabled={isTesting}>
                                        {isTesting ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Test...</> : <>🔍 Bağlantıyı Test Et</>}
                                    </EnterpriseButton>
                                </div>
                                <TestResultBanner result={testResults[key]} />
                            </div>
                        )}
                    </EnterpriseCard>
                );
            })}
        </div>
    );
}

// ─── POS Tab ──────────────────────────────────────────────────────────────────

function POSTab({ settings, onChange }: any) {
    return (
        <div className="animate-in fade-in duration-200 space-y-6">
            <EnterpriseCard>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center text-2xl shrink-0">💳</div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Ödeal Yazar Kasa POS</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ödeme sistemleri ve yazar kasa POS entegrasyonu</p>
                        </div>
                    </div>
                    <StatusBadge active={true} activeLabel="Aktif" />
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">API Kimlik Bilgileri</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <EnterpriseField label="Ödeal API Token (Canlı)">
                                <EnterpriseInput
                                    placeholder="Od_Live_••••••••••••"
                                    value={settings.apiKey}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...settings, apiKey: e.target.value })}
                                />
                            </EnterpriseField>
                            <EnterpriseField label="Terminal / Cihaz Seri No">
                                <EnterpriseInput
                                    placeholder="9988XXXX"
                                    value={settings.terminalId}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...settings, terminalId: e.target.value })}
                                />
                            </EnterpriseField>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">POS Davranış Ayarları</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <EnterpriseSwitch
                                checked={settings.autoReceipt}
                                onChange={(e) => onChange({ ...settings, autoReceipt: e.target.checked })}
                                label="Otomatik Fiş Kes"
                                description="Başarılı ödeme sonrası otomatik döküm alır."
                            />
                            <EnterpriseSwitch
                                checked={settings.testMode}
                                onChange={(e) => onChange({ ...settings, testMode: e.target.checked })}
                                label="Geliştirici Modu"
                                description="Sanal bir işlem akışı simüle eder."
                            />
                        </div>
                    </div>
                </div>
            </EnterpriseCard>

            {/* İşlem Akışı Bilgisi */}
            <EnterpriseCard>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">ℹ️ POS Entegrasyon Akışı</h3>
                <div className="space-y-3">
                    {[
                        { step: '1', text: 'Satış POS ekranında "Ödeal POS" seçildiğinde tutar otomatik olarak cihaz ekranına düşer.' },
                        { step: '2', text: 'Kart çekimi başarılı olduğu anda Periodya\'da "Satış Onaylandı" durumuna geçer ve kasa kaydı oluşur.' },
                        { step: '3', text: 'Cihaz üzerinden Z raporu ve EKÜ dökümleri için Ödeal panelini kullanınız.' },
                    ].map(item => (
                        <div key={item.step} className="flex items-start gap-3">
                            <span className="mt-0.5 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {item.step}
                            </span>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.text}</p>
                        </div>
                    ))}
                </div>
            </EnterpriseCard>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
        custom: { enabled: true, url: 'https://www.periodya.com/xml.php?c=siparisler&xmlc=10a4cd8d5e', autoSync: false, syncInterval: 60, branch: 'Merkez' }
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

    return (
        <EnterprisePageShell
            title="Entegrasyonlar"
            description="E-Fatura, pazaryeri, POS ve banka bağlantılarınızı bu panelden yönetin."
            actions={
                <EnterpriseButton variant="primary" onClick={saveSettings} disabled={isSaving}>
                    {isSaving
                        ? <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Kaydediliyor</>
                        : <>💾 Ayarları Kaydet</>
                    }
                </EnterpriseButton>
            }
        >
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

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
                <div className="animate-in fade-in duration-200">
                    <BankIntegrationOnboarding />
                </div>
            )}
        </EnterprisePageShell>
    );
}
