"use client";

import LoginPanel from '@/components/login/LoginPanel';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#080911]">
            <div className="w-full max-w-md bg-[#0d0f1a] rounded-3xl shadow-2xl border border-white/5 overflow-hidden">
                <LoginPanel />
            </div>
        </div>
    );
}
