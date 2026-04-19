import { useState, useEffect } from 'react';
import { Globe, Palette, Link as LinkIcon, Save, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function CustomDomainPanel() {
    const { showSuccess, showError } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [config, setConfig] = useState({
        tenantSlug: '',
        b2bCustomDomain: '',
        primaryColor: '#2563EB',
        logoUrl: ''
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setIsFetching(true);
        try {
            const res = await fetch('/api/admin/tenant/portal-config');
            const data = await res.json();
            if (res.ok) {
                setConfig({
                    tenantSlug: data.tenantSlug || '',
                    b2bCustomDomain: data.b2bCustomDomain || '',
                    primaryColor: data.primaryColor || '#2563EB',
                    logoUrl: data.logoUrl || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/tenant/portal-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantSlug: config.tenantSlug.toLowerCase(),
                    b2bCustomDomain: config.b2bCustomDomain.toLowerCase(),
                    primaryColor: config.primaryColor,
                    logoUrl: config.logoUrl
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                showSuccess('Başarılı', 'B2B Portal görünüm ve alan adı ayarlarınız başarıyla kaydedildi.');
            } else {
                showError('Hata', data.error || 'Ayarlar kaydedilemedi.');
            }
        } catch (error) {
            showError('Hata', 'Sunucuya bağlanılamadı.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3 relative z-10">
                    <Palette className="w-7 h-7 text-indigo-500" />
                    B2B Portal White-Label & Tasarım
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl relative z-10">
                    B2B ağınızı ve bayi portalınızı kendi kurumsal kimliğinizle giydirin. Hem görünümü (logo, renk) hem de erişim linklerinizi ayarlayabilirsiniz.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    
                    {/* TASARIM BÖLÜMÜ */}
                    <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-slate-400" /> Görsel Tercihler
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Kurumsal Renk (Ana Tema)</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        value={config.primaryColor}
                                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                        className="h-12 w-16 p-1 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900"
                                    />
                                    <input 
                                        type="text" 
                                        value={config.primaryColor}
                                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                        className="h-12 flex-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Firma Logosu (URL)</label>
                                <input 
                                    type="text" 
                                    placeholder="https://..."
                                    value={config.logoUrl}
                                    onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                                    className="h-12 w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                                {config.logoUrl && (
                                    <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center h-24">
                                        <img src={config.logoUrl} alt="Logo Önizleme" className="max-h-full max-w-full object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DOMAIN BÖLÜMÜ */}
                    <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400" /> Alan Adı ve Erişim
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Periodya Ağ Uzantısı (Slug)</label>
                                <div className="flex relative">
                                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-r border-dashed">
                                        https://
                                    </span>
                                    <input 
                                        type="text" 
                                        placeholder="motoroil"
                                        value={config.tenantSlug}
                                        onChange={(e) => setConfig({ ...config, tenantSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        className="h-12 flex-1 w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 px-3 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="inline-flex items-center px-4 rounded-r-xl border border-l-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-l border-dashed">
                                        .periodya.com
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2">Bu, platform içerisindeki standart B2B bayi giriş adresinizdir.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Kendi Özel Alan Adınız</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <LinkIcon className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="orn: b2b.sirketim.com"
                                        value={config.b2bCustomDomain}
                                        onChange={(e) => setConfig({ ...config, b2bCustomDomain: e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '') })}
                                        className="h-12 w-full pl-11 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-lg p-3 mt-3 text-[11px] text-indigo-700 dark:text-indigo-400 leading-relaxed font-medium">
                                    Özel alan adınızı bağlamak için, DNS yönetim panelinizden <strong>cname.vercel-dns.com</strong> adresine bir <strong className="font-mono">CNAME</strong> kaydı oluşturmalısınız.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:-translate-y-0 flex items-center justify-center min-w-[200px]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <Save className="w-5 h-5 mr-2" /> Değişiklikleri Kaydet
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
