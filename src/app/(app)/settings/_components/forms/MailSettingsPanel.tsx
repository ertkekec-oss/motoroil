import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className={`w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 ${props.className || ''}`}
        />
    );
}

function ERPField({ label, hint, children }: { label: string, hint?: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
            <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-slate-500 uppercase tracking-widest transition-colors">{label}</label>
                {hint && <span className="text-[11px] text-slate-400 font-medium">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function ERPBlock({ title, description, badge, children }: { title?: string, description?: string, badge?: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] mb-6">
            {(title || description || badge) && (
                <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-100">
                    <div>
                        {title && <h3 className="text-[16px] font-semibold text-slate-900">{title}</h3>}
                        {description && <p className="text-[14px] text-slate-500 mt-1">{description}</p>}
                    </div>
                    {badge && <div>{badge}</div>}
                </div>
            )}
            {children}
        </div>
    );
}

export default function MailSettingsPanel(props: any) {
    const {
        smtpSettings,
        setSmtpSettings,
        saveSmtpSettings,
    } = props;

    const isConfigured = !!smtpSettings?.email;

    return (
        <div className="max-w-4xl animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 tracking-tight">Mail Motoru Sunucu Ayarları</h2>
                    <p className="text-[14px] text-slate-500 mt-1">E-arşivler, bildirimler ve B2B evrak matrisi için kullanılacak iletişim ağı.</p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                    <button
                        onClick={saveSmtpSettings}
                        className="h-10 px-6 bg-slate-900 border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 flex items-center gap-2"
                    >
                        <span>💾</span> Konfigürasyonu Kaydet
                    </button>
                </div>
            </div>

            {/* Block */}
            <ERPBlock
                title="SMTP (Simple Mail Transfer Protocol) Ayarları"
                description="Google, Outlook veya SMTP erişimli kurumsal sunucunuzun port geçidi yetkileri."
                badge={
                    <span className={`inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-widest rounded border ${isConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {isConfigured ? '✓ SUNUCU AKTİF' : 'AYAR YAPILMADI'}
                    </span>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ERPField
                        label="GÖNDERİCİ ANA E-POSTA KİMLİĞİ"
                        hint="SMTP yetkili hesap adresi (Örn: bilgi@firma.com)"
                    >
                        <ERPInput
                            type="email"
                            placeholder="ornek@sirketiniz.com"
                            value={smtpSettings?.email || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setSmtpSettings({ ...smtpSettings, email: e.target.value })
                            }
                        />
                    </ERPField>
                    <div className="flex flex-col gap-2 relative">
                        <ERPField
                            label="UYGULAMA API ŞİFRESİ"
                            hint="Google Security -> App Passwords"
                        >
                            <ERPInput
                                type="password"
                                placeholder="•••• •••• •••• ••••"
                                value={smtpSettings?.password || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setSmtpSettings({ ...smtpSettings, password: e.target.value })
                                }
                            />
                        </ERPField>
                        {!isConfigured && (
                            <p className="absolute -bottom-6 right-0 text-[11px] text-slate-400 font-medium">Bu şifre 16 karakterli API app kodudur.</p>
                        )}
                    </div>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-lg">
                        <strong className="text-[12px] font-semibold text-slate-800 uppercase tracking-widest block mb-1">Kurumsal Uyum Uyarısı</strong>
                        <p className="text-[12px] text-slate-600 leading-relaxed">
                            Güvenlik nedeniyle kişisel ("Gmail" giriş şifrenizi) kullanmayınız. Lütfen hizmet sağlayıcınızın kontrol panelinden oluşturulmuş <strong>Uygulama İzin Kodunu</strong> temin edip giriniz.
                        </p>
                    </div>

                    <button className="h-10 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50" disabled={!isConfigured}>
                        📬 Bağlantıyı Sınama Testi
                    </button>
                </div>
            </ERPBlock>
        </div>
    );
}
