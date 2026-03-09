"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EnterprisePageShell } from "@/components/ui/enterprise";
import { Verified } from 'lucide-react';

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams?.get('token');

    useEffect(() => {
        if (!token) return;

        // As a fallback/demo, we finalize on client return if backend webhook hasn't processed it yet
        fetch('/api/billing/checkout/finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        }).then(() => {
            setTimeout(() => {
                router.push('/billing');
            }, 3000);
        });

    }, [token, router]);

    return (
        <EnterprisePageShell>
            <div className="max-w-2xl mx-auto py-20 animate-slide-up flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl animate-scale-in">
                    <Verified className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Ödeme Tamamlandı!</h1>
                <p className="text-slate-500 text-lg">Ödemeniz PayTR aracılığıyla başarıyla işlendi ve tahsil edildi.<br />Paket yüklemeleriniz yapılıyor, yönlendiriliyorsunuz...</p>
            </div>
        </EnterprisePageShell>
    );
}
