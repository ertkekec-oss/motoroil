
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                router.push('/login?registered=true');
            } else {
                setError(data.error || 'Kayıt sırasında bir hata oluştu.');
            }
        } catch (e) {
            setError('Sunucu bağlantısı kurulamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-deep)',
            padding: '20px'
        }}>
            <div className="card glass-plus" style={{
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: 'var(--shadow-premium)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Hemen Başlayın 🚀
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        14 günlük ücretsiz denemenizi saniyeler içinde başlatın.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: 'var(--text-muted)' }}>Ad Soyad</label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            style={{ width: '100%', padding: '12px' }}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Örn: Ahmet Yılmaz"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: 'var(--text-muted)' }}>E-Posta</label>
                            <input
                                type="email"
                                required
                                className="input-field"
                                style={{ width: '100%', padding: '12px' }}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="ahmet@sirket.com"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: 'var(--text-muted)' }}>WhatsApp No</label>
                            <input
                                type="tel"
                                required
                                className="input-field"
                                style={{ width: '100%', padding: '12px' }}
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="05XX XXX XX XX"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: 'var(--text-muted)' }}>Firma Adı</label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            style={{ width: '100%', padding: '12px' }}
                            value={formData.companyName}
                            onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="Örn: Periodya Teknoloji"
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: 'var(--text-muted)' }}>Şifre</label>
                        <input
                            type="password"
                            required
                            className="input-field"
                            style={{ width: '100%', padding: '12px' }}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '16px', fontWeight: 'bold', fontSize: '16px' }}
                    >
                        {loading ? 'Hesap Oluşturuluyor...' : 'Ücretsiz Denemeyi Başlat'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                    Zaten hesabınız var mı? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Giriş Yap</Link>
                </div>
            </div>
        </div>
    );
}
