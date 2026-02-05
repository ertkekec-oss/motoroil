
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export type GrowthSignal = {
    type: 'QUOTA_WARNING' | 'QUOTA_FULL' | 'TRIAL_ENDING' | 'TRIAL_EXPIRED' | 'PAST_DUE';
    message: string;
    cta: string;
    href: string;
    severity: 'warning' | 'error' | 'info';
};

export function GrowthBanner() {
    const [signal, setSignal] = useState<GrowthSignal | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSignals = async () => {
            try {
                const res = await fetch('/api/billing/overview');
                const data = await res.json();

                if (!data || data.error) return;

                const { status, endDate, limits } = data;
                const now = new Date();
                const end = new Date(endDate);
                const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                // 1. Trial/Status Check (Priority)
                if (status === 'SUSPENDED' || status === 'PAST_DUE') {
                    setSignal({
                        type: 'PAST_DUE',
                        message: 'Ödemeniz alınamadı veya hesabınız durduruldu. Kesintisiz hizmet için ödeme yönteminizi güncelleyin.',
                        cta: 'Ödemeyi Çöz',
                        href: '/billing',
                        severity: 'error'
                    });
                    return;
                }

                if (status === 'TRIAL') {
                    if (daysLeft <= 0) {
                        setSignal({
                            type: 'TRIAL_EXPIRED',
                            message: 'Deneme süreniz sona erdi. İşlemlerinize devam etmek için bir paket seçin.',
                            cta: 'Paket Seç',
                            href: '/billing',
                            severity: 'error'
                        });
                        return;
                    } else if (daysLeft <= 3) {
                        setSignal({
                            type: 'TRIAL_ENDING',
                            message: `Deneme sürenizin bitmesine ${daysLeft} gün kaldı. Verilerinizin kaybolmaması için paketinizi seçin.`,
                            cta: 'Hemen Yükselt',
                            href: '/billing',
                            severity: 'warning'
                        });
                        return;
                    }
                }

                // 2. Quota Check
                const docUsage = limits.monthly_documents;
                if (docUsage.limit > 0) {
                    const percent = (docUsage.used / docUsage.limit) * 100;
                    if (percent >= 100) {
                        setSignal({
                            type: 'QUOTA_FULL',
                            message: 'Aylık e-fatura limitiniz doldu! Yeni fatura kesmek için paketinizi yükseltin.',
                            cta: 'Limit Artır',
                            href: '/billing',
                            severity: 'error'
                        });
                    } else if (percent >= 80) {
                        setSignal({
                            type: 'QUOTA_WARNING',
                            message: `Aylık fatura limitinizin %${Math.round(percent)}'ini kullandınız. Sınırda kalmamak için paketinizi gözden geçirin.`,
                            cta: 'Paketleri İncele',
                            href: '/billing',
                            severity: 'warning'
                        });
                    }
                }
            } catch (err) {
                console.error('Growth Signal Error:', err);
            } finally {
                setLoading(false);
            }
        };

        checkSignals();
    }, []);

    if (loading || !signal) return null;

    const colors = {
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const iconColors = {
        warning: 'text-amber-500',
        error: 'text-red-500',
        info: 'text-blue-500'
    };

    return (
        <div className={`mb-6 p-4 rounded-xl border ${colors[signal.severity]} flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-500`}>
            <div className="flex items-center gap-3">
                <div className={iconColors[signal.severity]}>
                    {signal.severity === 'error' ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold">{signal.message}</p>
                </div>
            </div>
            <Link
                href={signal.href}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm whitespace-nowrap ${signal.severity === 'error' ? 'bg-red-600 text-white hover:bg-red-700' :
                        signal.severity === 'warning' ? 'bg-amber-600 text-white hover:bg-amber-700' :
                            'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
            >
                {signal.cta}
            </Link>
        </div>
    );
}
