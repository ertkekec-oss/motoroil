"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MutabakatClientUI({ recon, token }: { recon: any, token: string }) {
    const router = useRouter();
    const [actionState, setActionState] = useState<'IDLE' | 'LOADING' | 'DISPUTE_FORM'>('IDLE');
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleAction = async (action: 'ACCEPT' | 'REJECT' | 'DISPUTE') => {
        if (action === 'DISPUTE' && actionState !== 'DISPUTE_FORM') {
            setActionState('DISPUTE_FORM');
            return;
        }

        setActionState('LOADING');
        try {
            let attachmentKey = null;

            if (action === 'DISPUTE' && file) {
                const formData = new FormData();
                formData.append('token', token);
                formData.append('file', file);

                const uploadRes = await fetch('/api/portal/reconciliation/upload-dispute', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    const e = await uploadRes.json();
                    throw new Error(e.error || 'Dosya yükleme başarısız');
                }
                const uploadData = await uploadRes.json();
                attachmentKey = uploadData.attachmentKey;
            }

            const res = await fetch('/api/portal/reconciliation/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    action,
                    note: action === 'DISPUTE' ? note : undefined,
                    attachmentKey
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'İşlem başarısız');
            }

            // Reload page to show completed state
            router.refresh();

        } catch (e: any) {
            alert(e.message || "Bir hata oluştu.");
            setActionState(action === 'DISPUTE' ? 'DISPUTE_FORM' : 'IDLE');
        }
    };

    const isCompleted = ['SIGNED', 'REJECTED', 'DISPUTED', 'VOID'].includes(recon.status);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Sayın {recon.account.name},</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Aşağıda detayları bulunan dönem için cari hesap bakiyeniz sistemimize yansımıştır. Lütfen bakiyeyi kontrol ederek mutabakat durumunuzu bildiriniz.
                </p>
            </div>

            {/* Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cari Kodu</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{recon.accountId.substring(0, 8)}</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mutabakat Dönemi</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {new Date(recon.periodStart).toLocaleDateString('tr-TR')} - {new Date(recon.periodEnd).toLocaleDateString('tr-TR')}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bakiye Durumu</div>
                        <div className={`text-xl font-bold font-mono ${(recon.balance || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {Math.abs(Number(recon.balance || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            <span className="text-sm ml-1 font-medium">{Number(recon.balance || 0) > 0 ? '(Borç)' : '(Alacak)'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {!isCompleted ? (
                <>
                    {actionState === 'DISPUTE_FORM' ? (
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">İtiraz Detayları</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Açıklama / İtiraz Nedeni</label>
                                <textarea
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white"
                                    rows={4}
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Lütfen mutabık olmama nedeninizi açıklayınız..."
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ek Dosya (İsteğe Bağlı, Max 10MB)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleAction('DISPUTE')}
                                    className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition-colors shadow-lg shadow-amber-500/20"
                                >
                                    İtirazı Gönder
                                </button>
                                <button
                                    onClick={() => setActionState('IDLE')}
                                    className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center border-t border-slate-200 dark:border-slate-700 pt-8">
                            <button
                                onClick={() => handleAction('ACCEPT')}
                                disabled={actionState === 'LOADING'}
                                className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                <span>✅</span> Mutabıkız (Onayla)
                            </button>

                            <button
                                onClick={() => handleAction('DISPUTE')}
                                disabled={actionState === 'LOADING'}
                                className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-slate-800 disabled:opacity-50 border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-500 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <span>⚠️</span> İtiraz Et
                            </button>

                            <button
                                onClick={() => handleAction('REJECT')}
                                disabled={actionState === 'LOADING'}
                                className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-slate-800 disabled:opacity-50 border-2 border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-500 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <span>❌</span> Mutabık Değiliz
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-8 text-center">
                    <div className={`inline-flex items-center justify-center text-center gap-2 px-6 py-4 rounded-xl border font-bold ${recon.status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            recon.status === 'DISPUTED' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                recon.status === 'REJECTED' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                    'bg-slate-500/10 text-slate-600 border-slate-500/20'
                        }`}>
                        <span>{recon.status === 'SIGNED' ? '✅' : recon.status === 'DISPUTED' ? '⚠️' : recon.status === 'REJECTED' ? '❌' : 'ℹ️'}</span>
                        Bu mutabakat süreci tamamlanmıştır
                        ({recon.status === 'SIGNED' ? 'Onaylandı' : recon.status === 'DISPUTED' ? 'İtiraz Edildi' : recon.status === 'REJECTED' ? 'Reddedildi' : 'İptal'}).
                    </div>
                </div>
            )}
        </div>
    );
}
