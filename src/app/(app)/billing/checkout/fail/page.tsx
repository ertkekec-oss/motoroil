"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { EnterprisePageShell, EnterpriseButton } from "@/components/ui/enterprise";
import { XCircle } from 'lucide-react';

export default function CheckoutFailPage() {
    const router = useRouter();

    return (
        <EnterprisePageShell>
            <div className="max-w-2xl mx-auto py-20 animate-slide-up flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-xl animate-scale-in">
                    <XCircle className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-black text-rose-600 dark:text-rose-500 mb-2 tracking-tight">Ödeme Reddedildi!</h1>
                <p className="text-slate-500 text-lg mb-8">Ödeme işlemi bankanız veya altyapı sağlayıcısı tarafından reddedildi veya iptal ettiniz. Ücret çekimi yapılmamıştır.</p>

                <EnterpriseButton
                    variant="secondary"
                    onClick={() => router.push('/billing')}
                    className="w-48"
                >
                    Paketlere Geri Dön
                </EnterpriseButton>
            </div>
        </EnterprisePageShell>
    );
}
