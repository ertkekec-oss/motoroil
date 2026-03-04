import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className="w-full h-10 px-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/10 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 dark:focus:border-white/30 transition-all shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-200"
        />
    );
}

function ERPField({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
            <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">{label}</label>
            {children}
        </div>
    );
}

function ERPBlock({ title, description, children, action }: { title?: string, description?: string, children: React.ReactNode, action?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] mb-6">
            {(title || description || action) && (
                <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-100 dark:border-white/5">
                    <div>
                        {title && <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">{title}</h3>}
                        {description && <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}

export default function AccountPanel(props: any) {
    const {
        users,
        currentUser,
        profilePass,
        setProfilePass,
        handlePasswordChange,
    } = props;

    const initials =
        users?.find((u: any) => u.name === (currentUser?.name || ''))?.name
            ?.substring(0, 1)
            .toUpperCase() || 'A';

    return (
        <div className="max-w-4xl animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">Kullanıcı Hesabı</h2>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Sistem yetki seviyeniz, profil kimliğiniz ve güvenlik yönetiminiz.</p>
            </div>

            {/* Bölüm 1: Profil Bilgileri */}
            <ERPBlock
                title="Profil Bilgileri"
                description="Kişisel kullanıcı bilgileriniz ve sistem erişim kimliğiniz."
            >
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Avatar Kümeli */}
                    <div className="flex flex-col items-center justify-center gap-3 shrink-0">
                        <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 dark:border-white/5 flex items-center justify-center text-2xl font-bold text-slate-900 dark:text-white shadow-sm">
                            {initials}
                        </div>
                        <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-widest border border-slate-200 dark:border-white/5">
                            {currentUser?.role || 'Yetkili Kullanıcı'}
                        </span>
                    </div>

                    {/* Form Alanları */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ERPField label="Ad Soyad">
                            <ERPInput
                                type="text"
                                disabled
                                value={currentUser?.name || 'Yönetici'}
                            />
                        </ERPField>
                        <ERPField label="Sistem Kullanıcı Adı">
                            <ERPInput
                                type="text"
                                disabled
                                value={currentUser?.username || '-'}
                            />
                        </ERPField>
                        <ERPField label="Bağlı Şube / Lokasyon">
                            <ERPInput
                                type="text"
                                disabled
                                value={currentUser?.branch || 'Merkez'}
                            />
                        </ERPField>
                        <ERPField label="Yetki Seviyesi">
                            <ERPInput
                                type="text"
                                disabled
                                value={currentUser?.role || 'Sistem Yöneticisi'}
                            />
                        </ERPField>
                    </div>
                </div>
            </ERPBlock>

            {/* Bölüm 2: Güvenlik Ayarları */}
            <ERPBlock
                title="Güvenlik Politikası"
                description="Erişim şifrenizi güçlü ve benzersiz standartlara göre güncelleyin."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ERPField label="Geçerli Şifre">
                        <ERPInput
                            type="password"
                            placeholder="Mevcut şifreniz"
                            value={profilePass.old}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setProfilePass({ ...profilePass, old: e.target.value })
                            }
                        />
                    </ERPField>

                    {/* Boş hücre veya direkt yeni şifreye geçiş */}
                    <div className="hidden md:block"></div>

                    <ERPField label="Yeni Şifre">
                        <ERPInput
                            type="password"
                            placeholder="Yeni güvenli şifre"
                            value={profilePass.new}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setProfilePass({ ...profilePass, new: e.target.value })
                            }
                        />
                    </ERPField>
                    <ERPField label="Yeni Şifre (Tekrar)">
                        <ERPInput
                            type="password"
                            placeholder="Yeni şifreyi doğrulayın"
                            value={profilePass.confirm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setProfilePass({ ...profilePass, confirm: e.target.value })
                            }
                        />
                    </ERPField>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 flex justify-end">
                    <button
                        onClick={handlePasswordChange}
                        className="h-10 px-5 bg-slate-900 dark:bg-white border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-white/20"
                    >
                        🔒 Şifreyi Güncelle
                    </button>
                </div>
            </ERPBlock>

            {/* Bölüm 3: Rol ve Sistem Bilgisi (Read Only) */}
            <div className="p-4 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                    🛡️
                </div>
                <div>
                    <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white">Sistem İzolasyonu ve Yetkiler</h4>
                    <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        Kullanıcı hesabınız çalıştığınız modüllerde tamamen izoledir. Veriye erişim sınıfınız, <strong className="font-semibold text-slate-900 dark:text-white">Kurumsal Sistem Yöneticisi</strong> kuralları çerçevesinde belirlenmiştir. Rol tanımlarını değiştirmek için Ana Yetki sayfasına başvurunuz.
                    </p>
                </div>
            </div>
        </div>
    );
}
