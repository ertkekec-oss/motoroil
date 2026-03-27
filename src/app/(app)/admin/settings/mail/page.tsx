"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, CheckCircle2, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { EnterprisePageShell, EnterpriseCard, EnterpriseInput, EnterpriseButton, EnterpriseSectionHeader } from '@/components/ui/enterprise';

export default function AdminMailSettingsPage() {
    const [smtpSettings, setSmtpSettings] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        fetch('/api/admin/settings/mail')
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setSmtpSettings({ email: data.email || '', password: data.password || '' });
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch global mail settings", err);
                setIsLoading(false);
            });
    }, []);

    const saveSmtpSettings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/settings/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(smtpSettings)
            });

            if (res.ok) {
                toast.success('Sistem mail ayarları başarıyla kaydedildi.');
            } else {
                toast.error('Ayarlar kaydedilirken bir hata oluştu.');
            }
        } catch (e) {
            toast.error('Sunucuya bağlanılamadı.');
        } finally {
            setIsLoading(false);
        }
    };

    const testConnection = async () => {
        setIsTesting(true);
        try {
            const res = await fetch('/api/admin/settings/mail/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(smtpSettings)
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Bağlantı başarılı! Sistem mail sunucusuna ulaşabiliyor.');
            } else {
                toast.error(data.error || 'Bağlantı hatası: Bilgilerinizi kontrol edin.');
            }
        } catch (e) {
            toast.error('Sunucu test edilemedi. Ağa ulaşılamıyor olabilir.');
        } finally {
            setIsTesting(false);
        }
    };

    const isConfigured = !!smtpSettings?.email;

    return (
        <EnterprisePageShell
            title="Mail Motoru Sunucu Ayarları"
            description="Uygulamanın varsayılan mail altyapısı konfigürasyonu. Kiracılar kendi ayarlarını devre dışı bırakırsa sistem bu SMTP Gateway'i kullanır."
            actions={
                <EnterpriseButton onClick={saveSmtpSettings} disabled={isLoading} variant="primary">
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Konfigürasyonu Kaydet
                </EnterpriseButton>
            }
        >
            {isLoading && !smtpSettings.email && !smtpSettings.password ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 w-full rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                    <span className="text-sm font-bold tracking-widest uppercase mb-1">Cihaz Anahtarları Okunuyor...</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">SMTP Ağ geçidi konfigürasyonu kontrol ediliyor</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Form Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <EnterpriseCard className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none transition-all duration-500"></div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-white/5 pb-6">
                                <EnterpriseSectionHeader 
                                    title="SMTP Gateway (Simple Mail Transfer Protocol)" 
                                    subtitle="Google Workspace, Microsoft Outlook veya yetkili SMTP port geçidi." 
                                />
                                <div>
                                    {isConfigured ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-md text-[10px] font-black uppercase tracking-widest flex-shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> SUNUCU AKTİF
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-md text-[10px] font-black uppercase tracking-widest flex-shrink-0">
                                            <Activity className="w-3.5 h-3.5" /> AYAR YOK
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <EnterpriseInput
                                    label="Gönderici Ana E-Posta Kimliği"
                                    hint="Varsayılan uygulamanın SMTP yetkili şirket hesabı."
                                    required
                                    type="email"
                                    placeholder="ornek@sirketiniz.com"
                                    value={smtpSettings?.email || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpSettings({ ...smtpSettings, email: e.target.value })}
                                    disabled={isLoading}
                                />

                                <EnterpriseInput
                                    label="Uygulama API Şifresi"
                                    hint="Güvenlik sekmesinden oluşturulan 16 haneli erişim kodu."
                                    required
                                    type="password"
                                    placeholder="•••• •••• •••• ••••"
                                    value={smtpSettings?.password || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                                    disabled={isLoading}
                                />
                            </div>
                        </EnterpriseCard>
                    </div>

                    {/* Sidebar / Helpers */}
                    <div className="lg:col-span-1 space-y-6">
                        <EnterpriseCard className="text-center overflow-hidden flex flex-col items-center">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 text-indigo-500 dark:text-indigo-400 shadow-sm z-10">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest z-10 mb-2">Kurumsal Uyum Uyarısı</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed z-10 text-balance">
                                Güvenlik nedeniyle kişisel giriş şifrenizi kullanmayınız. Lütfen hizmet sağlayıcınızın kontrol panelinden oluşturulmuş <strong className="text-slate-700 dark:text-slate-300">Uygulama İzin Kodunu</strong> temin edip giriniz.
                            </p>
                        </EnterpriseCard>

                        <EnterpriseCard className="bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20">
                            <h3 className="text-[11px] font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Çıkış Sınaması
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-5">
                                Ayarları kaydettikten sonra sistemin kendi içerisinden mail çıkışı yapıp yapamadığını test edin.
                            </p>
                            
                            <EnterpriseButton 
                                variant="secondary" 
                                className="w-full justify-center"
                                onClick={testConnection} 
                                disabled={!smtpSettings?.email || !smtpSettings?.password || isTesting}
                            >
                                {isTesting ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Sınanıyor...</>
                                ) : (
                                    <>Bağlantıyı Test Et</>
                                )}
                            </EnterpriseButton>
                        </EnterpriseCard>
                    </div>

                </div>
            )}
        </EnterprisePageShell>
    );
}
