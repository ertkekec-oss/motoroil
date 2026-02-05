
"use client";

import { useCallback } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useRouter } from 'next/navigation';

export function useUpsell() {
    const { showConfirm } = useModal();
    const router = useRouter();

    const checkUpsell = useCallback((source: string): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const res = await fetch('/api/billing/overview');
                const data = await res.json();

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
