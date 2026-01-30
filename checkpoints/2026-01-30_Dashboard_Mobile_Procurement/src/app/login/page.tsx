"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Eğer zaten giriş yapılmışsa ana sayfaya yönlendir
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(username, password);

            if (success) {
                router.push('/');
            } else {
                setError('Kullanıcı adı veya şifre hatalı!');
            }
        } catch (err) {
            setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
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
                padding: '50px 40px',
                maxWidth: '420px',
                width: '100%',
                boxShadow: 'var(--shadow-premium)',
            }}>
                {/* Logo & Title */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '56px', marginBottom: '12px' }}>🏍️</div>
                    <h1 style={{
                        fontSize: '42px',
                        marginBottom: '8px',
                        letterSpacing: '-2px',
                        fontWeight: 'bold'
                    }}>
                        MOTOR<span style={{ color: 'var(--primary)' }}>OIL</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
                        Bisiklet & Motosiklet Yönetim Sistemi
                    </p>
                    <div style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid var(--primary)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'var(--primary)',
                        marginTop: '8px'
                    }}>
                        🔒 Güvenli Giriş
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            fontWeight: '500'
                        }}>
                            Kullanıcı Adı
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Kullanıcı adınızı girin"
                            required
                            autoFocus
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-rich)',
                                borderRadius: '10px',
                                color: 'var(--text-main)',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.3s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.border = '1px solid var(--primary)';
                                e.target.style.background = 'rgba(255,255,255,0.12)';
                            }}
                            onBlur={(e) => {
                                e.target.style.border = '1px solid rgba(255,255,255,0.15)';
                                e.target.style.background = 'rgba(255,255,255,0.08)';
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            fontWeight: '500'
                        }}>
                            Şifre
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Şifrenizi girin"
                            required
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-rich)',
                                borderRadius: '10px',
                                color: 'var(--text-main)',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.3s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.border = '1px solid var(--primary)';
                                e.target.style.background = 'rgba(255,255,255,0.12)';
                            }}
                            onBlur={(e) => {
                                e.target.style.border = '1px solid rgba(255,255,255,0.15)';
                                e.target.style.background = 'rgba(255,255,255,0.08)';
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '14px 16px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid var(--danger)',
                            borderRadius: '10px',
                            color: 'var(--danger)',
                            fontSize: '13px',
                            marginBottom: '24px',
                            textAlign: 'center',
                            fontWeight: '500'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: loading ? 'var(--text-muted)' : 'linear-gradient(135deg, var(--primary) 0%, #E64A00 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s',
                            boxShadow: loading ? 'none' : '0 4px 20px rgba(102, 126, 234, 0.4)',
                            transform: loading ? 'scale(1)' : 'scale(1)',
                        }}
                        onMouseOver={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.5)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
                            }
                        }}
                    >
                        {loading ? '🔄 Giriş yapılıyor...' : '🚀 Giriş Yap'}
                    </button>
                </form>

                {/* Demo Credentials - Only in development */}
                {process.env.NODE_ENV === 'development' && (
                    <div style={{
                        marginTop: '32px',
                        padding: '16px',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid var(--warning)',
                        borderRadius: '10px',
                        fontSize: '11px',
                        color: 'var(--text-muted)'
                    }}>
                        <div style={{
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'var(--warning)',
                            fontSize: '12px'
                        }}>
                            🔧 Demo Hesaplar (Development)
                        </div>
                        <div style={{ lineHeight: '1.8' }}>
                            <div><strong>Admin:</strong> admin / admin123</div>
                            <div><strong>Kadıköy:</strong> kadikoy / kadikoy123</div>
                            <div><strong>Beşiktaş:</strong> besiktas / besiktas123</div>
                            <div><strong>İzmir:</strong> izmir / izmir123</div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                }}>
                    © 2026 MotorOil - Tüm hakları saklıdır
                </div>
            </div>
        </div>
    );
}
