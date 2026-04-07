"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminSignaturesPoliciesClient() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [policies, setPolicies] = useState({
        sequentialDefault: true,
        otpRequiredDefault: false,
        allowExternalSigners: true,
        allowDocumentDownload: true,
        retentionDays: 365,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/signatures/policies')
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setPolicies({
                        ...policies,
                        ...data
                    });
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/signatures/policies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(policies)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('İmza Politikaları başarıyla kaydedildi.');
                router.refresh();
            } else {
                toast.error(data.error || 'Kaydetme başarısız oldu.');
            }
        } catch (error) {
            toast.error('Sunucu bağlantı hatası.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/admin/signatures" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> İmza Yönetimine Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            İmza Politikaları
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Zarflar oluşturulurken veya işlenirken kullanılacak kurumsal davranış kuralları.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '32px' }}>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>Varsayılan Yapılandırmalar</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Toggle 1 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Sıralı İmza Varsayılan (Sequential Signing)</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Yeni zarf eklendiğinde imzacılara sıralı bildirim gitsin mi? Aksi takdirde paralel herkese aynı anda gider.</div>
                                </div>
                                <button
                                    onClick={() => setPolicies({ ...policies, sequentialDefault: !policies.sequentialDefault })}
                                    style={{ width: '48px', height: '28px', background: policies.sequentialDefault ? '#10b981' : 'var(--bg-card)', border: `2px solid ${policies.sequentialDefault ? '#10b981' : 'var(--border-color)'}`, borderRadius: '14px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <div style={{ position: 'absolute', top: '2px', left: policies.sequentialDefault ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }}></div>
                                </button>
                            </div>

                            {/* Toggle 2 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>OTP (Telefon) Doğrulaması Varsayılanı</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Her yeni imza zarfında güvenlik gereği SMS OTP talep edilsin. Kullanıcı arayüzde bunu override edebilir.</div>
                                </div>
                                <button
                                    onClick={() => setPolicies({ ...policies, otpRequiredDefault: !policies.otpRequiredDefault })}
                                    style={{ width: '48px', height: '28px', background: policies.otpRequiredDefault ? '#3b82f6' : 'var(--bg-card)', border: `2px solid ${policies.otpRequiredDefault ? '#3b82f6' : 'var(--border-color)'}`, borderRadius: '14px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <div style={{ position: 'absolute', top: '2px', left: policies.otpRequiredDefault ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }}></div>
                                </button>
                            </div>

                            {/* Dropdown 1 */}
                            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Dış İmzacı Yetkisi (External Signers)</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Sadece firma içi kullanıcılar mı, yoksa herhangi bir e-posta adresine zarf fırlatılabilsin mi?</div>
                                <select
                                    value={policies.allowExternalSigners ? 'true' : 'false'}
                                    onChange={(e) => setPolicies({ ...policies, allowExternalSigners: e.target.value === 'true' })}
                                    style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    <option value="true" style={{ background: '#1a1a1a' }}>İzin Ver (Herhangi bir e-posta)</option>
                                    <option value="false" style={{ background: '#1a1a1a' }}>Sadece Sistemdeki Kullanıcılar & Firmalar</option>
                                </select>
                            </div>

                            {/* Dropdown 2 */}
                            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Arşivleme / Elde Tutma (Retention) Kuralları</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Tamamlanan zarflar veri tabanında kaç gün indeksli kalsın? (Süresi dolanlar Glacier cold-storage'a atılır)</div>
                                <select
                                    value={policies.retentionDays}
                                    onChange={(e) => setPolicies({ ...policies, retentionDays: parseInt(e.target.value) })}
                                    style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    <option value="90" style={{ background: '#1a1a1a' }}>90 Gün (Kısa Dönem)</option>
                                    <option value="365" style={{ background: '#1a1a1a' }}>1 Yıl (Standart)</option>
                                    <option value="1825" style={{ background: '#1a1a1a' }}>5 Yıl (Vergi ve Finans Standardı)</option>
                                    <option value="3650" style={{ background: '#1a1a1a' }}>10 Yıl (Enterprise Uzun Dönem Arşiv)</option>
                                </select>
                            </div>

                        </div>

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{ padding: '12px 24px', background: 'white', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer' }}
                                className="hover:bg-gray-200 disabled:opacity-50"
                            >
                                {saving ? 'Kaydediliyor...' : 'Politikaları Uygula'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
