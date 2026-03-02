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
        <EnterprisePageShell
            title="Hesabım"
            description="Profil bilgilerinizi ve hesap güvenlik ayarlarınızı yönetin."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profil kartı */}
                <EnterpriseCard>
                    <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-200 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-2xl font-bold shrink-0">
                            {initials}
                        </div>
                        <div>
                            <div className="text-base font-semibold text-slate-900 dark:text-white">
                                {currentUser?.name || 'Yönetici'}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {currentUser?.role || 'Sistem Yöneticisi'}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <EnterpriseField label="KULLANICI ADI">
                            <EnterpriseInput
                                type="text"
                                readOnly
                                value={currentUser?.username || '-'}
                            />
                        </EnterpriseField>
                        <EnterpriseField label="ŞUBE">
                            <EnterpriseInput
                                type="text"
                                readOnly
                                value={currentUser?.branch || 'Merkez'}
                            />
                        </EnterpriseField>
                    </div>
                </EnterpriseCard>

                {/* Şifre değiştir */}
                <EnterpriseCard>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                        🔐 Şifre Değiştir
                    </p>
                    <div className="space-y-4">
                        <EnterpriseField label="MEVCUT ŞİFRE">
                            <EnterpriseInput
                                type="password"
                                value={profilePass.old}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setProfilePass({ ...profilePass, old: e.target.value })
                                }
                            />
                        </EnterpriseField>
                        <EnterpriseField label="YENİ ŞİFRE">
                            <EnterpriseInput
                                type="password"
                                value={profilePass.new}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setProfilePass({ ...profilePass, new: e.target.value })
                                }
                            />
                        </EnterpriseField>
                        <EnterpriseField label="YENİ ŞİFRE (TEKRAR)">
                            <EnterpriseInput
                                type="password"
                                value={profilePass.confirm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setProfilePass({ ...profilePass, confirm: e.target.value })
                                }
                            />
                        </EnterpriseField>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <EnterpriseButton variant="primary" onClick={handlePasswordChange}>
                                🔒 Şifreyi Güncelle
                            </EnterpriseButton>
                        </div>
                    </div>
                </EnterpriseCard>
            </div>
        </EnterprisePageShell>
    );
}
