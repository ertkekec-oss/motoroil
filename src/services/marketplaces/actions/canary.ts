import prisma from "@/lib/prisma";
import { ActionProviderRegistry } from "@/services/marketplaces/actions/registry";
import { logger } from "@/lib/observability";

export async function runSyntheticCanary() {
    logger.info("Starting Synthetic Canary Test...");

    try {
        // 1. Find a test company (labeled for canary or just one with config)
        const company = await prisma.company.findFirst({
            where: { MarketplaceConfig: { some: { type: 'trendyol' } } },
            select: { id: true, name: true }
        });

        if (!company) {
            logger.alert("Canary Failed: No company with trendyol config found", { alertType: 'CANARY_FAILURE' });
            return { success: false, error: "No company found" };
        }

        // 2. Find a test order
        const order = await prisma.order.findFirst({
            where: { companyId: company.id },
            select: { id: true, orderNumber: true }
        });

        if (!order) {
            logger.alert("Canary Failed: No order found for test company", { alertType: 'CANARY_FAILURE', companyId: company.id });
            return { success: false, error: "No order found" };
        }

        const testIdempKey = `CANARY_SYNC_${Date.now()}`;
        const provider = ActionProviderRegistry.getProvider('trendyol');

        // 3. Execution Action
        const result = await provider.executeAction({
            companyId: company.id,
            marketplace: 'trendyol',
            orderId: order.id,
            actionKey: 'REFRESH_STATUS',
            idempotencyKey: testIdempKey
        });

        if (result.status === 'FAILED') {
            logger.alert(`Canary Failed: Action returned FAILED status`, {
                alertType: 'CANARY_FAILURE',
                companyId: company.id,
                errorMessage: result.errorMessage
            });
            return { success: false, error: result.errorMessage };
        }

        logger.info("Canary Initiated Successfully (PENDING in queue)", { auditId: result.auditId });
        return { success: true, auditId: result.auditId };

    } catch (error: any) {
        logger.alert("Canary Crash", { alertType: 'CANARY_FAILURE', error: error.message });
        return { success: false, error: error.message };
    }
}
