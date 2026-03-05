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
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>

            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--bg-card, #1e293b)', width: '100%', maxWidth: '600px',
                borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))'
            }} className="animate-scale-in">

                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', background: 'var(--bg-panel, rgba(255,255,255,0.02))' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main, white)' }}>
                        B2B Kari Mutabakat Sihirbazı
                    </h2>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
                        {customer.name} ({customer.taxNumber || 'V.N Yok'})
                    </div>
                </div>

                {/* Steps */}
                <div style={{ display: 'flex', padding: '16px 32px', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{ flex: 1, height: '4px', background: s <= step ? '#3b82f6' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'background 0.3s' }} />
                    ))}
                </div>

                {/* Body */}
                <div style={{ padding: '32px', minHeight: '320px' }}>

                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main, white)' }}>Adım 1: Dönem Seçimi</h3>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                                <button onClick={() => handlePreset('month')} className="btn" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid currentColor' }}>Bu Ay</button>
                                <button onClick={() => handlePreset('lastMonth')} className="btn" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid currentColor' }}>Geçen Ay</button>
                                <button onClick={() => handlePreset('year')} className="btn" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid currentColor' }}>Bu Yıl</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '8px' }}>Başlangıç</label>
                                    <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', colorScheme: 'dark' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '8px' }}>Bitiş</label>
                                    <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', colorScheme: 'dark' }} />
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#3b82f6', color: 'white', fontWeight: '800', border: 'none', opacity: generating ? 0.7 : 1, cursor: generating ? 'not-allowed' : 'pointer' }}
                            >
                                {generating ? 'Hesaplanıyor ve Snapshot Üretiliyor...' : 'Devam Et (Snapshot Al)'}
                            </button>
                        </div>
                    )}

                    {step === 2 && recon && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main, white)' }}>Adım 2: Önizleme & İmzaya Gönder</h3>

                            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>Snapshot Bakiyesi ({new Date(recon.periodStart).toLocaleDateString()} - {new Date(recon.periodEnd).toLocaleDateString()})</div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: Number(recon.balance) > 0 ? '#ef4444' : '#10b981' }}>
                                    {Math.abs(Number(recon.balance)).toLocaleString()} <span style={{ fontSize: '16px' }}>₺</span>
                                    <span style={{ fontSize: '12px', marginLeft: '8px', fontWeight: '600', textTransform: 'uppercase', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                        {Number(recon.balance) > 0 ? 'Borçlu' : Number(recon.balance) < 0 ? 'Alacaklı' : 'Dengeli'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', wordBreak: 'break-all' }}>
                                    <span style={{ opacity: 0.6 }}>Hash: </span>
                                    {Array(8).fill("").map(() => Math.random().toString(36).substring(2, 6)).join("")}
                                    {/* Mock Hash visual */}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '8px' }}>Gönderim Yöntemi</label>
                                    <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)' }}>
                                        <option value="INTERNAL">Periodya Ağında (Ücretsiz)</option>
                                        <option value="EMAIL">E-Posta (Ücretsiz)</option>
                                        <option value="SMS">SMS (0.1 TL/Gönderim)</option>
                                        <option value="WHATSAPP">WhatsApp B2B (1.5 TL)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '8px' }}>İmza Tipi (Auth)</label>
                                    <select value={authMethod} onChange={e => setAuthMethod(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)' }}>
                                        <option value="OTP">Sms OTP (Basit)</option>
                                        <option value="QUALIFIED_ESIGN">Nitelikli E-İmza (E-Güven)</option>
                                        <option value="BOTH">Hangisi Uygunsa</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={sending}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#10b981', color: 'white', fontWeight: '800', border: 'none', opacity: sending ? 0.7 : 1, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {sending ? 'Mutabakat Zarfı Oluşturuluyor...' : 'Mutabakata Sun (İmzaya Gönder)'}
                            </button>
                        </div>
                    )}

                    {step === 3 && recon && (
                        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main, white)' }}>Mutabakat Gönderildi</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted, #94a3b8)', marginBottom: '24px', lineHeight: '1.5' }}>
                                Mutabakat belgesi (ID: <strong>{recon.id.substring(0, 8)}</strong>) {deliveryMethod.toLowerCase()} yöntemiyle müşteriye iletildi. İmzalandığında "Reconciliation Engine" <span style={{ color: '#10b981' }}>RECON_OK</span> sinyali üretecektir.
                            </p>

                            <button
                                onClick={onClose}
                                style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer' }}
                            >
                                Kapat
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Controls if needed */}
                <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-panel, rgba(255,255,255,0.02))' }}>
                    {(step === 1 || step === 2) && (
                        <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted, #94a3b8)', fontWeight: '600', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px' }} className="hover:bg-white/5">İptal</button>
                    )}
                </div>

            </div>
        </div>
    );
}
