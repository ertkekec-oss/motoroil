"use client";

import { useState } from 'react';
import { saveOtpConfig, testOtpProvider } from '@/services/otp/actions';

export default function NetgsmClient({ config }: { config: any }) {
    const [formData, setFormData] = useState({
        isEnabled: config?.isEnabled || false,
        apiUsername: config?.apiUsername || '',
        apiPasswordEncrypted: config?.apiPasswordEncrypted || '',
        sender: config?.sender || '',
        otpTemplate: config?.otpTemplate || 'Doğrulama kodunuz: {{code}}',
        codeLength: config?.codeLength || 6,
        ttlSeconds: config?.ttlSeconds || 180,
        cooldownSeconds: config?.cooldownSeconds || 60,
        maxDailyAttempts: config?.maxDailyAttempts || 5,
        testPhone: config?.testPhone || '',
    });

    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await saveOtpConfig('NETGSM', formData);
            if (res.success) {
                alert('Netgsm ayarları başarıyla kaydedildi.');
            } else {
                alert('Hata: ' + res.error);
            }
        } catch (error) {
            alert('Ağ hatası oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!formData.testPhone) {
            alert('Lütfen test numarası giriniz (Örn: 905XXXXXXXXX)');
            return;
        }

        if (!formData.apiUsername || !formData.apiPasswordEncrypted || !formData.sender) {
            setTestResult({ success: false, message: 'Lütfen API Kullanıcı Adı, Şifre ve Gönderici (Sender) alanlarını doldurup önce "Ayarları Kaydet" butonuna basınız.' });
            return;
        }

        // Save first so test uses latest values if we want true testing but let's test straight with save/read sequence.
        // Actually, our API does a findUnique on the DB so it's strictly testing what's applied. Wait, we should ask user to save first.
        setTesting(true);
        setTestResult(null);
        try {
            const res = await testOtpProvider('NETGSM', formData.testPhone, '123456');
            if (res.success) {
                setTestResult({ success: true, message: 'Test mesajı başarıyla gönderildi (Kod: 123456). Servis Yanıtı: ' + (res.raw || 'OK') });
            } else {
                setTestResult({ success: false, message: 'Test Başarısız: ' + res.error });
            }
        } catch (error: any) {
            setTestResult({ success: false, message: 'Test isteği ağda patladı.' });
        } finally {
            setTesting(false);
        }
    };

    const handleToggle = () => setFormData({ ...formData, isEnabled: !formData.isEnabled });

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
            <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Sağlayıcı Durumu (NETGSM)</h2>
                    <button
                        onClick={handleToggle}
                        style={{
                            padding: '6px 16px',
                            background: formData.isEnabled ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                            color: formData.isEnabled ? '#10b981' : 'var(--text-muted)',
                            border: `1px solid ${formData.isEnabled ? 'rgba(16,185,129,0.2)' : 'var(--border-color)'}`,
                            borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                        }}
                    >
                        {formData.isEnabled ? '🟢 AKTİF' : '⚫ PASİF'}
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>API Kullanıcı Adı</label>
                        <input
                            type="text"
                            name="apiUsername"
                            value={formData.apiUsername}
                            onChange={(e) => setFormData({ ...formData, apiUsername: e.target.value })}
                            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}
                            placeholder="Netgsm kullanıcı adı (numara vs.)"
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>API Şifresi</label>
                        <input
                            type="password"
                            name="apiPasswordEncrypted"
                            value={formData.apiPasswordEncrypted}
                            onChange={(e) => setFormData({ ...formData, apiPasswordEncrypted: e.target.value })}
                            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}
                            placeholder="Netgsm API Şifresi"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Gönderici Başlığı (Sender / Header)</label>
                        <input
                            type="text"
                            name="sender"
                            value={formData.sender}
                            onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}
                            placeholder="Örn: PERIODYA"
                        />
                    </div>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>OTP Kuralları (Mekanizma)</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Kod Uzunluğu</label>
                        <input
                            type="number"
                            name="codeLength"
                            value={formData.codeLength}
                            onChange={(e) => setFormData({ ...formData, codeLength: Number(e.target.value) })}
                            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Zaman Aşımı (sn)</label>
                        <input
                            type="number"
                            name="ttlSeconds"
                            value={formData.ttlSeconds}
                            onChange={(e) => setFormData({ ...formData, ttlSeconds: Number(e.target.value) })}
                            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Yeniden Gönderim Sınırı (sn)</label>
                        <input
                            type="number"
                            name="cooldownSeconds"
                            value={formData.cooldownSeconds}
                            onChange={(e) => setFormData({ ...formData, cooldownSeconds: Number(e.target.value) })}
                            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Günlük Limit (Kişi Başı)</label>
                        <input
                            type="number"
                            name="maxDailyAttempts"
                            value={formData.maxDailyAttempts}
                            onChange={(e) => setFormData({ ...formData, maxDailyAttempts: Number(e.target.value) })}
                            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Mesaj Şablonu (Tekil OTP Kısıtına Uygundur)</label>
                    <textarea
                        name="otpTemplate"
                        value={formData.otpTemplate}
                        onChange={(e) => setFormData({ ...formData, otpTemplate: e.target.value })}
                        style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', height: '80px', resize: 'none' }}
                        placeholder="Örn: Doğrulama kodunuz: {{code}}"
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Bilgi: <code>{`{{code}}`}</code> etiketi gönderim sırasında gerçek OTP ile değiştirilir. Future-ready: Çok özel Türkçe karakterlerden kaçınınız.
                    </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer' }}
                        className="hover:bg-blue-600 disabled:opacity-50"
                    >
                        {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                    </button>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>Test Araçları / Health Check</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Test Telefon Numarası</label>
                        <input
                            type="text"
                            name="testPhone"
                            value={formData.testPhone}
                            onChange={(e) => setFormData({ ...formData, testPhone: e.target.value })}
                            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}
                            placeholder="Örn: 905XXXXXXXXX"
                        />
                    </div>
                    <div>
                        <button
                            disabled={testing || !formData.testPhone}
                            onClick={handleTest}
                            style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                            className="hover:bg-white/10 disabled:opacity-50"
                        >
                            {testing ? 'Test Ediliyor...' : 'Test OTP Gönder'}
                        </button>
                    </div>
                </div>

                {testResult && (
                    <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: testResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${testResult.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        color: testResult.success ? '#10b981' : '#ef4444',
                        fontSize: '13px', fontWeight: 'bold'
                    }}>
                        {testResult.success ? '✅ ' : '❌ '}
                        {testResult.message}
                    </div>
                )}
            </div>
        </div>
    );
}
