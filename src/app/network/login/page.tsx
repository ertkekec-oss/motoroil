import React from 'react';
import LoginPanel from '@/components/login/LoginPanel';

export default function DealerNetworkLoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Bayi Portalı Girişi</h1>
                    <p className="text-sm text-slate-500 mt-2">Sadece Yetkili Bayiler İçin</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100">
                    <LoginPanel />
                </div>
            </div>
        </div>
    );
}
