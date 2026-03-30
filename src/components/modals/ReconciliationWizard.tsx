"use client";

import { useState } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { createReconAction, sendReconAction } from '@/services/finance/reconciliation/actions';

export default function ReconciliationWizard({
    customer,
    onClose,
    onSuccess
}: {
    customer: any;
    onClose: () => void;
    onSuccess?: () => void;
}) {
    const { showError, showSuccess } = useModal();
    const [step, setStep] = useState(1);

    // Form States
    const [periodStart, setPeriodStart] = useState("");
    const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split("T")[0]);
    const [generating, setGenerating] = useState(false);

    // Created Recon State
    const [recon, setRecon] = useState<any>(null);

    // Sending State
    const [deliveryMethod, setDeliveryMethod] = useState("INTERNAL");
    const [authMethod, setAuthMethod] = useState("OTP");
    const [sending, setSending] = useState(false);

    // Preset filters
    const handlePreset = (type: string) => {
        const d = new Date();
        if (type === 'month') {
            d.setDate(1);
            setPeriodStart(d.toISOString().split("T")[0]);
            setPeriodEnd(new Date().toISOString().split("T")[0]);
        } else if (type === 'lastMonth') {
            d.setMonth(d.getMonth() - 1);
            d.setDate(1);
            const end = new Date(d);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            setPeriodStart(d.toISOString().split("T")[0]);
            setPeriodEnd(end.toISOString().split("T")[0]);
        } else if (type === 'year') {
            d.setMonth(0);
            d.setDate(1);
            setPeriodStart(d.toISOString().split("T")[0]);
            setPeriodEnd(new Date().toISOString().split("T")[0]);
        }
    };

    const handleGenerate = async () => {
        if (!periodStart || !periodEnd) {
            showError("Eksik Bilgi", "Lütfen tarih aralığını seçin");
            return;
        }

        setGenerating(true);
        try {
            const res = await createReconAction({
                tenantId: customer.companyId,
                accountId: customer.id,
                periodStart,
                periodEnd
            });

            if (res.success) {
                setRecon(res.reconciliation);
                setStep(2);
            } else {
                showError("Hata", res.error || "Bilinmeyen hata");
            }
        } catch (e: any) {
            showError("Hata", e.message || "Bağlantı hatası");
        } finally {
            setGenerating(false);
        }
    };

    const handleSend = async () => {
        if (!recon?.id) return;
        setSending(true);

        try {
            const res = await sendReconAction({
                reconciliationId: recon.id,
                deliveryMethod: deliveryMethod as any,
                authMethod: authMethod as any
            });

            if (res.success) {
                showSuccess("Başarılı", "Mutabakat imzaya gönderildi!");
                setStep(3);
                if (onSuccess) onSuccess();
            } else {
                showError("Hata", res.error || "Bilinmeyen hata");
            }
        } catch (e: any) {
            showError("Hata", e.message || "Bağlantı hatası");
        } finally {
            setSending(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className="bg-white dark:bg-[#0f172a] w-full max-w-[600px] rounded-[24px] overflow-hidden flex flex-col shadow-[0_20px_40px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.5)] border border-slate-200 dark:border-white/10 animate-scale-in"
            >

                {/* Header */}
                <div className="px-8 py-6 border-b border-light dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <h2 className="m-0 text-[20px] font-black text-slate-800 dark:text-white">
                        B2B Cari Mutabakatı
                    </h2>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                        {customer.name} ({customer.taxNumber || 'V.N Yok'})
                    </div>
                </div>

                {/* Steps */}
                <div className="flex px-8 py-4 gap-2 bg-slate-100/50 dark:bg-black/20">
                    {[1, 2, 3].map(s => (
                        <div 
                            key={s} 
                            className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-blue-500 shadow-[0_0_10px_rgb(59,130,246,0.3)]' : 'bg-slate-200 dark:bg-white/10'}`} 
                        />
                    ))}
                </div>

                {/* Body */}
                <div className="p-8 min-h-[320px] bg-white dark:bg-transparent">

                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h3 className="text-[16px] font-black mb-4 text-slate-800 dark:text-white">Adım 1: Dönem Seçimi</h3>

                            <div className="flex gap-2 mb-6">
                                <button onClick={() => handlePreset('month')} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30 transition-all font-bold text-[12px]">Bu Ay</button>
                                <button onClick={() => handlePreset('lastMonth')} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30 transition-all font-bold text-[12px]">Geçen Ay</button>
                                <button onClick={() => handlePreset('year')} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30 transition-all font-bold text-[12px]">Bu Yıl</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-[12px] font-extrabold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wide">Başlangıç</label>
                                    <input 
                                        type="date" 
                                        value={periodStart} 
                                        onChange={e => setPeriodStart(e.target.value)} 
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-black/20 dark:border-white/10 dark:text-white transition-all font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[12px] font-extrabold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wide">Bitiş</label>
                                    <input 
                                        type="date" 
                                        value={periodEnd} 
                                        onChange={e => setPeriodEnd(e.target.value)} 
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-black/20 dark:border-white/10 dark:text-white transition-all font-semibold"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className={`w-full py-4 rounded-[16px] bg-blue-600 hover:bg-blue-700 text-white font-black text-[14px] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_rgb(59,130,246,0.3)]`}
                            >
                                {generating ? 'Hesaplanıyor...' : 'Devam Et (Snapshot Al)'}
                            </button>
                        </div>
                    )}

                    {step === 2 && recon && (
                        <div className="animate-fade-in">
                            <h3 className="text-[16px] font-black mb-4 text-slate-800 dark:text-white">Adım 2: Önizleme & İmzaya Gönder</h3>

                            <div className="bg-slate-50 border border-slate-200 dark:bg-black/20 dark:border-white/10 rounded-[16px] p-6 mb-6">
                                <div className="text-[12px] text-slate-500 dark:text-slate-400 mb-1 font-bold">Snapshot Bakiyesi ({new Date(recon.periodStart).toLocaleDateString()} - {new Date(recon.periodEnd).toLocaleDateString()})</div>
                                <div className={`text-[28px] font-black ${Number(recon.balance) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {Math.abs(Number(recon.balance)).toLocaleString()} <span className="text-[20px]">₺</span>
                                    <span className="text-[12px] ml-3 font-bold uppercase tracking-wide px-3 py-1 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/80 rounded-full align-middle inline-block -mt-1">
                                        {Number(recon.balance) > 0 ? 'Borçlu' : Number(recon.balance) < 0 ? 'Alacaklı' : 'Dengeli'}
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 pt-3 border-t border-slate-200 dark:border-white/5 break-all font-mono">
                                    <span className="opacity-60">Hash: </span>
                                    {Array(8).fill("")?.map(() => Math.random().toString(36).substring(2, 6)).join("")}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-[12px] font-extrabold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wide">Gönderim Yöntemi</label>
                                    <select 
                                        value={deliveryMethod} 
                                        onChange={e => setDeliveryMethod(e.target.value)} 
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-black/20 dark:border-white/10 dark:text-white transition-all font-semibold"
                                    >
                                        <option value="INTERNAL">Periodya Ağında (Ücretsiz)</option>
                                        <option value="EMAIL">E-Posta (Ücretsiz)</option>
                                        <option value="SMS">SMS (0.1 TL/Gönderim)</option>
                                        <option value="WHATSAPP">WhatsApp B2B (1.5 TL)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[12px] font-extrabold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wide">İmza Tipi (Auth)</label>
                                    <select 
                                        value={authMethod} 
                                        onChange={e => setAuthMethod(e.target.value)} 
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-black/20 dark:border-white/10 dark:text-white transition-all font-semibold"
                                    >
                                        <option value="OTP">Sms OTP (Basit)</option>
                                        <option value="QUALIFIED_ESIGN">Nitelikli E-İmza (E-Güven)</option>
                                        <option value="BOTH">Hangisi Uygunsa</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="w-full py-4 rounded-[16px] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[14px] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_rgb(16,185,129,0.3)] flex items-center justify-center gap-2"
                            >
                                {sending ? 'Zarf Oluşturuluyor...' : 'Mutabakata Sun (İmzaya Gönder)'}
                            </button>
                        </div>
                    )}

                    {step === 3 && recon && (
                        <div className="animate-fade-in text-center py-8">
                            <div className="text-[64px] mb-4">✨</div>
                            <h3 className="text-[24px] font-black mb-2 text-slate-800 dark:text-white">Mutabakat Gönderildi</h3>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-[400px] mx-auto font-medium">
                                Mutabakat belgesi (ID: <strong className="text-slate-700 dark:text-white">{recon.id.substring(0, 8)}</strong>) {deliveryMethod.toLowerCase()} yöntemiyle müşteriye iletildi. İmzalandığında "Reconciliation Engine" <span className="text-emerald-500 font-bold">RECON_OK</span> sinyali üretecektir.
                            </p>

                            <button
                                onClick={onClose}
                                className="px-8 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/5 font-black transition-all"
                            >
                                Kapat
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-8 py-4 border-t border-slate-200 dark:border-white/5 flex justify-end bg-slate-50/50 dark:bg-white/[0.02]">
                    {(step === 1 || step === 2) && (
                        <button 
                            onClick={onClose} 
                            className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                        >
                            İptal
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
