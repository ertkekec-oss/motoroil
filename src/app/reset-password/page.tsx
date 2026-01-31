
"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const token = searchParams.get('token');

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
                body: JSON.stringify({ id, token, password })
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
        <div style={{ padding: '40px' }} className="animate-fade-in-up">
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '20px', textAlign: 'center' }}>Yeni Şifre Belirle</h1>
            <form onSubmit={handleReset} className="flex flex-col gap-4 max-w-sm mx-auto">
                <div>
                    <label className="text-white/60 text-xs font-bold block mb-1">Yeni Şifre</label>
                    <input
                        type="password"
                        required
                        className="input-field w-full p-3"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="****"
                    />
                </div>
                <div>
                    <label className="text-white/60 text-xs font-bold block mb-1">Şifre Tekrar</label>
                    <input
                        type="password"
                        required
                        className="input-field w-full p-3"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="****"
                    />
                </div>
                <button type="submit" className="btn btn-primary w-full py-3 mt-4 font-bold text-white bg-blue-600 rounded-xl">
                    Şifreyi Güncelle
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
