"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
    LayoutGrid, CreditCard, Truck, MessageSquare, Mail, 
    CheckCircle2, XCircle, Settings, Plus, Info, ExternalLink, ShieldCheck, Zap
} from 'lucide-react';
import { 
    EnterprisePageShell, EnterpriseCard, EnterpriseButton, 
    EnterpriseInput, EnterpriseSectionHeader 
} from '@/components/ui/enterprise';

type IntegrationData = {
    id?: string;
    category: string;
    providerCode: string;
    name: string;
    isActive: boolean;
    isGlobalDefault: boolean;
    credentials: any;
    settings?: any;
};

const APP_STORE_ITEMS = [
    {
        id: 'paytr_hub',
        category: 'PAYMENT',
        providerCode: 'PAYTR_HUB',
        name: 'PayTR (Periodya Hub)',
        description: 'B2B Hub pazar yeri operasyonları, komisyonlar, kargo gönderileri ve cüzdan bakiye yüklemeleri için kullanılan ana B2B ödeme geçidi.',
        icon: <CreditCard className="w-8 h-8 text-indigo-500" />,
        color: 'indigo',
        isNative: true, // we handle it here
    },
    {
        id: 'paytr_saas',
        category: 'PAYMENT',
        providerCode: 'PAYTR_SAAS',
        name: 'PayTR (SaaS & Paket)',
        description: 'Müşterilerinizin SaaS paketlerini (Pro, Enterprise), e-fatura kontörlerini ve SMS paketlerini satın alabilmesi için kendi gelir ödeme kanalınız.',
        icon: <CreditCard className="w-8 h-8 text-emerald-500" />,
        color: 'emerald',
        isNative: true,
    },
    {
        id: 'kolaygelsin',
        category: 'SHIPPING',
        providerCode: 'KOLAYGELSIN',
        name: 'KolayGelsin Kargo',
        description: 'Global kargo entegrasyonu. Sistemde bir kargo firması "Global Default" seçildiğinde tüm otomatik gönderiler ve desi yönetimi buradan geçer.',
        icon: <Truck className="w-8 h-8 text-orange-500" />,
        color: 'orange',
        isNative: true,
    },
    {
        id: 'netgsm',
        category: 'SMS',
        providerCode: 'NETGSM',
        name: 'NetGSM OTP & SMS',
        description: 'İmza zarflarında OTP (Tek Kullanımlık Şifre) doğrulaması ve tüm BA/BS Finansal Mutabakat onaylamaları için SMS servis ağı.',
        icon: <MessageSquare className="w-8 h-8 text-blue-500" />,
        color: 'blue',
        isNative: false, // route to old
        legacyUrl: '/admin/signatures/providers/netgsm'
    },
    {
        id: 'gmail',
        category: 'EMAIL',
        providerCode: 'GMAIL',
        name: 'Mail Motoru (SMTP)',
        description: 'Tüm sistem maillerini (Faturalar, Uyarılar, Sistem Kayıtları) yöneten ana çıkış kapısı. Google Workspace veya Microsoft 365 kullanmanız önerilir.',
        icon: <Mail className="w-8 h-8 text-rose-500" />,
        color: 'rose',
        isNative: false, // route to old
        legacyUrl: '/admin/settings/mail'
    }
];

export default function IntegrationsHub() {
    const router = useRouter();
    const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal State
    const [activeModal, setActiveModal] = useState<any>(null);
    const [formData, setFormData] = useState<IntegrationData | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchIntegrations = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/admin/integrations');
            if (res.ok) {
                const data = await res.json();
                setIntegrations(data.integrations || []);
            }
        } catch (e) {
            console.error("Failed to load integrations", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const getIntegrationData = (providerCode: string) => {
        return integrations.find(i => i.providerCode === providerCode);
    };

    const handleOpenManage = (item: typeof APP_STORE_ITEMS[0]) => {
        if (!item.isNative) {
            router.push(item.legacyUrl!);
            return;
        }

        const existing = getIntegrationData(item.providerCode);
        setActiveModal(item);
        
        if (existing) {
            setFormData(existing);
        } else {
            setFormData({
                category: item.category,
                providerCode: item.providerCode,
                name: item.name,
                isActive: false,
                isGlobalDefault: item.category === 'SHIPPING' ? true : false,
                credentials: { merchant_id: '', merchant_key: '', merchant_salt: '' },
                settings: {}
            });
        }
    };

    const handleSave = async () => {
        if (!formData) return;
        
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success('Entegrasyon ayarları başarıyla kaydedildi.');
                setActiveModal(null);
                fetchIntegrations();
            } else {
                toast.error('Ayarlar kaydedilirken hata oluştu.');
            }
        } catch(e) {
            toast.error('Sunucu hatası.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <EnterprisePageShell
            title="Entegrasyon Hub (Switchboard)"
            description="Periodya ağınızın tüm dış dünya (Ödeme, Kargo, İletişim, Vergi vb.) bağlarını güvenle tek noktadan yönetin."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative">
                
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-[#0f172a]/50 backdrop-blur-sm rounded-3xl min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                {APP_STORE_ITEMS.map((item) => {
                    const dbData = item.isNative ? getIntegrationData(item.providerCode) : null;
                    const isConfigured = item.isNative ? !!dbData?.id : true; // We assume legacy ones are configured, or we can't tell here easily without pinging them. Alternatively we let legacy routes handle their own status.
                    const isActive = item.isNative ? dbData?.isActive : true;

                    return (
                        <EnterpriseCard key={item.id} className="flex flex-col h-full relative overflow-hidden group">
                            {/* App Card Visual Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${item.color}-50 dark:bg-${item.color}-500/10 border border-${item.color}-100 dark:border-${item.color}-500/20 shadow-sm`}>
                                    {item.icon}
                                </div>
                                <div className="flex flex-col items-end">
                                    {item.isNative ? (
                                        isActive ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold text-[10px] rounded-full uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">
                                                <CheckCircle2 className="w-3 h-3" /> CANLI API AKTİF
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px] rounded-full uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                                <XCircle className="w-3 h-3" /> YAPILANDIRILIYOR
                                            </span>
                                        )
                                    ) : (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold text-[10px] rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-500/20">
                                            <ExternalLink className="w-3 h-3" /> Ayrı Modül
                                        </span>
                                    )}

                                    {item.category === 'SHIPPING' && dbData?.isGlobalDefault && (
                                        <span className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                                            ★ GLOBAL DEFAULT
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{item.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed flex-grow">
                                {item.description}
                            </p>

                            <div className="mt-auto border-t border-slate-100 dark:border-white/5 pt-5">
                                <button 
                                    onClick={() => handleOpenManage(item)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-[#1e293b]/50 dark:hover:bg-[#1e293b] dark:text-slate-300 transition-all border border-slate-200 dark:border-white/5"
                                >
                                    {item.isNative ? <Settings className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                                    Ayarları Yönet
                                </button>
                            </div>
                        </EnterpriseCard>
                    );
                })}

            </div>

            {/* Config Modal Drawer Concept */}
            {activeModal && formData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {activeModal.icon}
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{activeModal.name} Konfigürasyonu</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Gizli API anahtarlarını güvenli biçimde girin.</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-5">
                             
                             {/* Shared Status Toggles */}
                             <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                 <div>
                                     <h4 className="text-sm font-bold text-slate-900 dark:text-white">Gerçek Ortam (Live)</h4>
                                     <p className="text-xs text-slate-500 dark:text-slate-400">Aktif edildiğinde sistem canlı işlemlere izin verir.</p>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                     <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                     />
                                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                                 </label>
                             </div>

                             {activeModal.category === 'SHIPPING' && (
                                 <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
                                    <div>
                                        <h4 className="text-sm font-bold text-orange-900 dark:text-orange-400">Global Varsayılan Mı?</h4>
                                        <p className="text-xs text-orange-700 dark:text-orange-300">Tüm kargo operasyonları bu servis üzerinden akmaya zorlanır.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                           type="checkbox" 
                                           className="sr-only peer" 
                                           checked={formData.isGlobalDefault}
                                           onChange={(e) => setFormData({...formData, isGlobalDefault: e.target.checked})}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-orange-900/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                                    </label>
                                </div>
                             )}

                             {/* Dynamic Form Fields based on Category */}
                             {activeModal.category === 'PAYMENT' && (
                                 <div className="space-y-4">
                                     <EnterpriseInput 
                                        label="Merchant ID (Mağaza No)" 
                                        required 
                                        value={formData.credentials?.merchant_id || ''}
                                        onChange={(e: any) => setFormData({...formData, credentials: {...formData.credentials, merchant_id: e.target.value}})}
                                     />
                                     <EnterpriseInput 
                                        label="Merchant Key (Güvenlik Anahtarı)" 
                                        type="password"
                                        required 
                                        value={formData.credentials?.merchant_key || ''}
                                        onChange={(e: any) => setFormData({...formData, credentials: {...formData.credentials, merchant_key: e.target.value}})}
                                     />
                                     <EnterpriseInput 
                                        label="Merchant Salt (Tuzlama Anahtarı)" 
                                        type="password"
                                        required 
                                        value={formData.credentials?.merchant_salt || ''}
                                        onChange={(e: any) => setFormData({...formData, credentials: {...formData.credentials, merchant_salt: e.target.value}})}
                                     />
                                 </div>
                             )}

                             {activeModal.category === 'SHIPPING' && (
                                 <div className="space-y-4">
                                      <EnterpriseInput 
                                        label="API Endpoint (REST)" 
                                        required 
                                        value={formData.credentials?.endpoint || 'https://api.kolaygelsin.com.tr'}
                                        onChange={(e: any) => setFormData({...formData, credentials: {...formData.credentials, endpoint: e.target.value}})}
                                     />
                                     <EnterpriseInput 
                                        label="Yetkilendirme Token (Bearer)" 
                                        type="password"
                                        required 
                                        value={formData.credentials?.token || ''}
                                        onChange={(e: any) => setFormData({...formData, credentials: {...formData.credentials, token: e.target.value}})}
                                     />
                                 </div>
                             )}

                        </div>

                        {/* Modal Actions */}
                        <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex gap-3 justify-end">
                            <EnterpriseButton variant="secondary" onClick={() => setActiveModal(null)}>İptal</EnterpriseButton>
                            <EnterpriseButton variant="primary" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </EnterpriseButton>
                        </div>
                    </div>
                </div>
            )}
        </EnterprisePageShell>
    );
}
