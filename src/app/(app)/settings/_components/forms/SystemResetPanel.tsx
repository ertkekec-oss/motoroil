import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseField,
    EnterpriseInput,
    EnterpriseButton,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// Sıfırlama handler'ı, fetch, showConfirm, showError → DOKUNULMADI.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

export default function SystemResetPanel(props: any) {
    const {
        resetOptions,
        setResetOptions,
        showSuccess,
        showError,
        showConfirm,
        currentUser,
    } = props;

    const resetModules = [
        { id: 'customers', label: 'Cariler' },
        { id: 'inventory', label: 'Envanter' },
        { id: 'ecommerce', label: 'E-Ticaret Satışları' },
        { id: 'pos', label: 'Mağaza Satışları' },
        { id: 'receivables', label: 'Alacaklar' },
        { id: 'payables', label: 'Borçlar' },
        { id: 'checks', label: 'Çekler' },
        { id: 'notes', label: 'Senetler' },
        { id: 'staff', label: 'Personel' },
        { id: 'branches', label: 'Şubeler' },
        { id: 'expenses', label: 'Giderler' },
    ];

    return (
        <EnterprisePageShell
            title="Sistem Sıfırlama"
            description="Seçilen modüllerdeki verileri kalıcı olarak temizleyin."
        >
            {/* Uyarı bandı */}
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">⚠️</span>
                <div>
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Kritik İşlem Uyarısı</p>
                    <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">
                        Bu işlem seçilen kategorilerdeki tüm verileri <strong>KALİCİ OLARAK</strong> silecektir.
                        Geri alınamaz. Devam etmeden önce yedek aldığınızdan emin olun.
                    </p>
                </div>
            </div>

            <EnterpriseCard>
                {/* Tam sıfırlama */}
                <label className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800/40 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors mb-5">
                    <input
                        type="checkbox"
                        className="w-4 h-4 accent-rose-600"
                        checked={resetOptions.all}
                        onChange={(e) => setResetOptions({ ...resetOptions, all: e.target.checked })}
                    />
                    <div>
                        <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">HER ŞEYİ SİL — Tam Sıfırlama</span>
                        <p className="text-xs text-rose-500 dark:text-rose-500 mt-0.5">Tüm modüller tek seferde temizlenir.</p>
                    </div>
                </label>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mb-5">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Veya Modül Seçin</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {resetModules.map((opt) => (
                            <label
                                key={opt.id}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${resetOptions.all || (resetOptions as any)[opt.id]
                                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400'
                                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 accent-rose-600 shrink-0"
                                    disabled={resetOptions.all}
                                    checked={resetOptions.all || (resetOptions as any)[opt.id]}
                                    onChange={(e) => setResetOptions({ ...resetOptions, [opt.id]: e.target.checked })}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Onay alanı */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                    <EnterpriseField
                        label='ONAYLAMAK İÇİN "ONAYLIYORUM" YAZIN'
                        hint="Sıfırlama butonu ancak bu alanı doğru doldurduğunuzda aktif olur."
                    >
                        <EnterpriseInput
                            type="text"
                            id="resetConfirmationInput"
                            placeholder="ONAYLIYORUM"
                        />
                    </EnterpriseField>
                    <div className="flex justify-end mt-4">
                        <EnterpriseButton
                            variant="danger"
                            disabled={!Object.values(resetOptions).some((v) => v)}
                            onClick={async () => {
                                const input = (document.getElementById('resetConfirmationInput') as HTMLInputElement).value;
                                if (input !== 'ONAYLIYORUM') {
                                    showError('Hata', 'Lütfen onay kutusuna ONAYLIYORUM yazın.');
                                    return;
                                }
                                showConfirm(
                                    'KRİTİK SİSTEM SIFIRLAMA',
                                    'Seçilen veriler kalıcı olarak silinecektir. Devam etmek istediğinizden emin misiniz?',
                                    async () => {
                                        try {
                                            const res = await fetch('/api/admin/reset-data', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    confirmation: input,
                                                    options: resetOptions,
                                                    currentUsername: currentUser?.username,
                                                }),
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                showSuccess('BAŞARILI', '✅ Seçilen veriler sıfırlandı.');
                                                setTimeout(() => window.location.reload(), 2000);
                                            } else {
                                                showError('Hata', 'İşlem hatası: ' + data.error);
                                            }
                                        } catch (e) {
                                            showError('Hata', 'Sunucu ile iletişim kurulamadı.');
                                        }
                                    }
                                );
                            }}
                        >
                            🔥 Seçili Verileri Sil & Sıfırla
                        </EnterpriseButton>
                    </div>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
