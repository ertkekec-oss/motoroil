import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseField,
    EnterpriseInput,
    EnterpriseButton,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

export default function MailSettingsPanel(props: any) {
    const {
        smtpSettings,
        setSmtpSettings,
        saveSmtpSettings,
    } = props;

    const isConfigured = !!smtpSettings?.email;

    return (
        <EnterprisePageShell
            title="Mail Ayarları"
            description="SMTP sunucu yapılandırması ve bildirim e-postası ayarları."
        >
            <EnterpriseCard>
                {/* Durum rozeti */}
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">📧 Mail Sunucu Ayarları (SMTP)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Personel şifreleri ve bildirimlerin gönderileceği mail hesabı.
                        </p>
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${isConfigured
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        {isConfigured ? '✓ Yapılandırıldı' : 'Ayarlanmadı'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EnterpriseField
                        label="GÖNDERİCİ E-POSTA"
                        hint="Gmail veya kurumsal e-posta adresiniz."
                    >
                        <EnterpriseInput
                            type="email"
                            placeholder="ornek@gmail.com"
                            value={smtpSettings?.email || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setSmtpSettings({ ...smtpSettings, email: e.target.value })
                            }
                        />
                    </EnterpriseField>
                    <EnterpriseField
                        label="UYGULAMA ŞİFRESİ"
                        hint="Gmail için: Hesabım > Güvenlik > Uygulama Şifreleri (16 hane)."
                    >
                        <EnterpriseInput
                            type="password"
                            placeholder="**** **** **** ****"
                            value={smtpSettings?.password || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setSmtpSettings({ ...smtpSettings, password: e.target.value })
                            }
                        />
                    </EnterpriseField>
                </div>

                <div className="flex justify-end pt-5 mt-5 border-t border-slate-200 dark:border-slate-800">
                    <EnterpriseButton variant="primary" onClick={saveSmtpSettings}>
                        💾 Kaydet
                    </EnterpriseButton>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
