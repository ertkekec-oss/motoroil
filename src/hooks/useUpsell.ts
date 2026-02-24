
"use client";

import { useCallback } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useRouter } from 'next/navigation';

// Keep a global cache for billing overview to avoid redundant fetches
let cachedUpsellData: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useUpsell() {
    const { showConfirm } = useModal();
    const router = useRouter();

    const checkUpsell = useCallback((source: string): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const now = Date.now();
                let data = cachedUpsellData;

                if (!data || (now - lastFetchTime > CACHE_DURATION)) {
                    const res = await fetch('/api/billing/overview');
                    data = await res.json();
                    cachedUpsellData = data;
                    lastFetchTime = now;
                }

                if (data.upsellSignal?.shouldTrigger) {
                    const { type, message, cta, targetPlanId, priority } = data.upsellSignal;

                    // Log the impression
                    await fetch('/api/analytics/upsell', {
                        method: 'POST',
                        body: JSON.stringify({
                            type,
                            source,
                            targetPlanId,
                            converted: false
                        })
                    });

                    // If Priority is high (>=8), show contextual modal
                    if (priority >= 8) {
                        showConfirm(
                            'Kapasite Artırımı Zamanı! 🚀',
                            message,
                            async () => {
                                // Log conversion attempt
                                await fetch('/api/analytics/upsell', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        type,
                                        source,
                                        targetPlanId,
                                        converted: true
                                    })
                                });
                                router.push(`/billing?target=${targetPlanId}&source=${source}`);
                                resolve(false); // Stop original action
                            },
                            cta,
                            'Şimdi Değil',
                            () => {
                                resolve(true); // User said no, continue original action
                            }
                        );
                        return;
                    }
                }
                resolve(true); // Continue with original action
            } catch (e) {
                console.error("Upsell check failed", e);
                resolve(true);
            }
        });
    }, [showConfirm, router]);

    return { checkUpsell };
}
