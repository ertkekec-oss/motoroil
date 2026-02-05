
import prisma from './prisma';
import { sendAutomationMessage } from './comm-service';
import { calculateUpsellSignal } from './upsell-engine';

export async function runDailyAutomation() {
    console.log("[AUTOMATION] Başlıyor...");
    const results = {
        onboarding: 0,
        trialEnd: 0,
        churn: 0,
        growth: 0
    };

    const tenants = await (prisma as any).tenant.findMany({
        include: {
            subscription: { include: { plan: true } },
            users: { select: { email: true, lastActiveAt: true } },
            _count: { select: { growthEvents: true } }
        }
    });

    const now = new Date();

    for (const tenant of tenants) {
        try {
            const ownerEmail = tenant.ownerEmail;
            const customerName = tenant.name;
            const phone = tenant.phone;

            // 1. ONBOARDING CHECK
            const createdAt = new Date(tenant.createdAt);
            const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24));

            if (daysSinceSignup === 1) { // Kayıttan 1 gün sonra
                const invoiceCount = await (prisma as any).salesInvoice.count({
                    where: { company: { tenantId: tenant.id } }
                });

                if (invoiceCount === 0) {
                    await sendAutomationMessage('ONBOARDING_WELCOME', { tenantId: tenant.id, email: ownerEmail, customerName }, [], 'EMAIL');
                    await logGrowthEvent(tenant.id, 'ONBOARDING_SENT');
                    results.onboarding++;
                }
            }

            // 2. TRIAL ENDING CHECK
            if (tenant.subscription && tenant.status === 'TRIAL') {
                const endDate = new Date(tenant.subscription.endDate);
                const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

                if (daysLeft === 5 || daysLeft === 2) {
                    await sendAutomationMessage('TRIAL_ENDING', { tenantId: tenant.id, email: ownerEmail, customerName }, [daysLeft]);
                    await logGrowthEvent(tenant.id, 'TRIAL_REMINDER_SENT', { daysLeft });
                    results.trialEnd++;
                }
            }

            // 3. CHURN PREVENTION (INACTIVITY)
            // En son aktif olan kullanıcıyı bul
            const lastActive = tenant.users.reduce((latest: Date | null, user: any) => {
                if (!user.lastActiveAt) return latest;
                const d = new Date(user.lastActiveAt);
                return (!latest || d > latest) ? d : latest;
            }, null);

            if (lastActive) {
                const daysInactive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));
                if (daysInactive === 7 || daysInactive === 14) {
                    await sendAutomationMessage('CHURN_WE_MISS_YOU', { tenantId: tenant.id, email: ownerEmail, customerName }, []);
                    await logGrowthEvent(tenant.id, `INACTIVITY_${daysInactive}D`);
                    results.churn++;
                }
            }

            // 4. GROWTH & UPSELL SIGNALS
            const signal = await calculateUpsellSignal(tenant.id, 'AUTOMATION');
            if (signal?.shouldTrigger && signal.priority >= 7) {
                // Sadece yüksek öncelikli büyüme sinyallerinde mail at
                await sendAutomationMessage('GROWTH_SIGNAL', { tenantId: tenant.id, email: ownerEmail, customerName }, [20]); // Örn %20 büyüme
                await logGrowthEvent(tenant.id, 'GROWTH_SIGNAL_SENT', signal);
                results.growth++;
            }

        } catch (e) {
            console.error(`[AUTOMATION] Error for tenant ${tenant.id}:`, e);
        }
    }

    console.log("[AUTOMATION] Tamamlandı:", results);
    return results;
}

async function logGrowthEvent(tenantId: string, type: string, payload?: any) {
    return await (prisma as any).growthEvent.create({
        data: {
            tenantId,
            type,
            payload,
            status: 'SENT'
        }
    });
}
