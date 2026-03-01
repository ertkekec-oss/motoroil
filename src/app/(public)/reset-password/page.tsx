
"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const token = searchParams.get('token');
    const type = searchParams.get('type') || 'STAFF';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const { showSuccess, showError } = useModal();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirm) {
            showError('Hata', 'Şifreler eşleşmiyor.');
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, token, type, password })
            });

            if (res.ok) {
                showSuccess('Başarılı', 'Şifreniz güncellendi. Giriş yapabilirsiniz.');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                showError('Hata', 'İşlem başarısız oldu.');
            }
        } catch (error) {
            showError('Hata', 'Sunucu hatası.');
        }
    };

    if (!id || !token) {
        return <div className="text-white text-center p-10">Geçersiz bağlantı.</div>;
    }

    return (
        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm-plus animate-scale-up" style={{
            width: '100%', maxWidth: '440px',
            padding: '50px 40px',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'var(--shadow-premium)'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔑</div>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: '900',
                    color: 'white',
                    marginBottom: '8px',
                    letterSpacing: '-1px'
                }}>Yeni Şifre</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Hesabınız için yeni ve güvenli bir şifre belirleyin.</p>
            </div>

            <form onSubmit={handleReset} className="flex flex-col gap-6">
                <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '500' }}>Yeni Şifre</label>
                    <input
                        type="password"
                        required
                        className="input-field"
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: 'white',
                            boxSizing: 'border-box'
                        }}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '500' }}>Şifre Tekrar</label>
                    <input
                        type="password"
                        required
                        className="input-field"
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: 'white',
                            boxSizing: 'border-box'
                        }}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '16px',
                        marginTop: '10px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #E64A00 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(255, 87, 34, 0.4)',
                        transition: 'all 0.3s'
                    }}
                >
                    Şifreyi Güncelle ve Giriş Yap
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#050510]">
            <Suspense fallback={<div className="text-white">Yükleniyor...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
