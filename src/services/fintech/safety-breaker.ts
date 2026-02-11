import prisma from '@/lib/prisma';
import { EventBus } from './event-bus';

export class SafetyBreaker {
    private static readonly SUSPENSE_LIMIT = 50000; // 50.000 TL
    private static readonly FAILED_EVENT_LIMIT = 10;

    /**
     * Checks system health and triggers safety breaker if necessary.
     */
    static async checkHealth(companyId: string) {
        // 1. Check Suspense Account Balance (397.01)
        const suspenseAccount = await (prisma as any).account.findFirst({
            where: { companyId, code: '397.01' }
        });
        const suspenseBalance = Math.abs(Number(suspenseAccount?.balance || 0));

        // 2. Check Failed Events (Recent)
        const failedEvents = await (prisma as any).domainEvent.count({
            where: {
                companyId,
                eventType: { contains: 'FAILED' },
                createdAt: { gte: new Date(Date.now() - 3600000) } // Last 1 hour
            }
        });

        if (suspenseBalance > this.SUSPENSE_LIMIT || failedEvents > this.FAILED_EVENT_LIMIT) {
            await this.triggerBreaker(companyId, { suspenseBalance, failedEvents });
            return false;
        }

        return true;
    }

    private static async triggerBreaker(companyId: string, reason: any) {
        console.warn(`[SAFETY_BREAKER] TRIGGERED for company ${companyId}. Disabling autopilots.`);

        // Disable all pricing autopilots
        await (prisma as any).pricingAutopilotConfig.updateMany({
            where: { companyId },
            data: { enabled: false }
        });

        // Log to Audit
        await (prisma as any).fintechAudit.create({
            data: {
                companyId,
                who: 'system',
                action: 'SYSTEM_SAFETY_BREAKER_TRIGGERED',
                details: JSON.stringify(reason),
                createdAt: new Date()
            }
        });

        // Emit critical alert
        await EventBus.emit({
            companyId,
            eventType: 'SYSTEM_SAFETY_BREAKER_TRIGGERED',
            aggregateType: 'JOURNAL',
            aggregateId: companyId,
            payload: reason,
            metadata: { severity: 'CRITICAL' }
        });
    }
}
