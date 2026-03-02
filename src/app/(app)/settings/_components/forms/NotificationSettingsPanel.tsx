import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseButton,
    EnterpriseSwitch,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

export default function NotificationSettingsPanel(props: any) {
    const {
        notifSettings,
        setNotifSettings,
        saveNotifSettings,
    } = props;

    const notifications = [
        {
            id: 'notif_on_delete',
            label: 'Kritik Silme İşlemleri',
            description: 'Bir kayıt silindiğinde Admin e-postasına bildirim gönderilir.',
        },
        {
            id: 'notif_on_approval',
            label: 'Yeni Ürün Onay Talebi',
            description: 'Personel ürün eklediğinde yönetici onay gereksinimi bildirilir.',
        },
    ];

    return (
        <EnterprisePageShell
            title="Bildirim Ayarları"
            description="Sistem olaylarına ilişkin bildirim tercihlerinizi yönetin."
        >
            <EnterpriseCard>
                <div className="space-y-3 mb-6">
                    {notifications.map((notif) => (
                        <EnterpriseSwitch
                            key={notif.id}
                            checked={(notifSettings as any)[notif.id] ?? true}
                            onChange={(e) => setNotifSettings({ ...notifSettings, [notif.id]: e.target.checked })}
                            label={notif.label}
                            description={notif.description}
                        />
                    ))}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-5 flex justify-end">
                    <EnterpriseButton variant="primary" onClick={saveNotifSettings}>
                        💾 Değişiklikleri Kaydet
                    </EnterpriseButton>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
