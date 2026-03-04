import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPSwitch({ checked, onChange, label, description }: { checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string, description?: string }) {
    return (
        <label className="flex items-start justify-between cursor-pointer p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0">
            <div className="flex-1 pr-8">
                <span className="block text-[14px] font-semibold text-slate-900 dark:text-white">{label}</span>
                {description && <span className="block mt-1 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{description}</span>}
            </div>
            <div className="relative inline-flex items-center h-6 rounded-full w-11 shrink-0 mt-0.5">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-900 dark:focus:ring-white/20 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
            </div>
        </label>
    );
}

function ERPBlock({ title, description, children }: { title?: string, description?: string, children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] mb-6 overflow-hidden">
            {(title || description) && (
                <div className="p-6 pb-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50">
                    {title && <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">{title}</h3>}
                    {description && <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
                </div>
            )}
            <div>{children}</div>
        </div>
    );
}

export default function NotificationSettingsPanel(props: any) {
    const {
        notifSettings,
        setNotifSettings,
        saveNotifSettings,
    } = props;

    const notifications = [
        {
            id: 'notif_on_delete',
            label: 'Veri Silme Protokol İhlali',
            description: 'Sistemden kalıcı bir kayıt veya doküman silindiğinde, kurumsal admin e-posta adresine anons/ikaz gönderilir.',
        },
        {
            id: 'notif_on_approval',
            label: 'Yarı Yetkili Onay İstasyonu',
            description: 'Alt personeller veri deklare ettiğinde yayınlamak için merkeze onay zorunluluğu uyarısı (Push/Mail) düşer.',
        },
    ];

    return (
        <div className="max-w-5xl mx-auto w-full p-8 pt-10 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">Olay İkaz / Geri Bildirim Ağı</h2>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Hayati işlem döngülerinde ve risk izleme ekranlarında yöneticinin alacağı sistem trigger'ları.</p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                    <button
                        onClick={saveNotifSettings}
                        className="h-10 px-6 bg-slate-900 dark:bg-white border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-white/20 flex items-center gap-2"
                    >
                        <span>💾</span> İzleme Ağını Senkronize Et
                    </button>
                </div>
            </div>

            <ERPBlock
                title="İzin Akışları (Notification Matrix)"
                description="Modülde aktif olan uyarı döngülerinin durumları aşağıda tabloya dökülmüştür."
            >
                <div className="flex flex-col">
                    {notifications.map((notif) => (
                        <ERPSwitch
                            key={notif.id}
                            checked={(notifSettings as any)[notif.id] ?? true}
                            onChange={(e) => setNotifSettings({ ...notifSettings, [notif.id]: e.target.checked })}
                            label={notif.label}
                            description={notif.description}
                        />
                    ))}
                </div>
            </ERPBlock>

            <div className="mt-6 p-4 border border-emerald-100 bg-emerald-50 text-emerald-800 rounded-xl text-[13px] leading-relaxed flex items-start gap-3">
                <span className="text-base shrink-0">🛡️</span>
                <div>
                    <strong className="font-semibold block mb-0.5">Sistem İzolayonu ve Güvenlik</strong>
                    Bu ihbarların tamamı, Mail Motoru ayarlarında tanımlanmış olan e-posta lokasyonuna güvenli bir şekilde iletilir. Eğer iletiler ulaşmıyorsa, mail ağ Geçidi (SMTP) erişiminizi kontrol edin.
                </div>
            </div>
        </div>
    );
}
