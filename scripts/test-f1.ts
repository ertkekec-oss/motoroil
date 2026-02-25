import { prisma } from "../src/lib/prisma";
import { computeAllConsumptionRates } from "../src/services/inventory/consumptionService";
import { runDepletionScan } from "../src/services/inventory/depletionService";

async function testF1() {
    process.env.PRISMA_BYPASS_EXTENSION = "true";
    process.env.ENABLE_GLOBAL_AUTOMATION = "true";

    try {
        const company = await prisma.company.findFirst();
        if (!company) throw new Error("No company found");
        const companyId = company.id;

        console.log(`\n=== Starting Pre-requisite Setup ===`);
        // Seed policy if not existence
        await prisma.sellerAutomationPolicy.upsert({
            where: { sellerCompanyId: companyId },
            update: { understockThresholdDays: 14 },
            create: { sellerCompanyId: companyId, understockThresholdDays: 14 }
        });

        // Seed some history to guarantee a consumption rate (if missing)
        // Check if there is any global product mapped.
        const product = await prisma.product.findFirst({
            where: { companyId },
            include: { networkListings: true }
        });

        const globalProductId = product?.networkListings[0]?.globalProductId || "clr0xxq4f000108jz7f5v9zzp"; // Mock fallback

        // Mock a consumption rate forcefully just to test runDepletionScan effectively
        await prisma.productConsumption.upsert({
            where: { companyId_globalProductId: { companyId, globalProductId } },
            create: { companyId, globalProductId, dailyRate: 5.5 },
            update: { dailyRate: 5.5 } // Means 5.5 per day, if stock is 10, days remaining is ~1.8
        });

        console.log(`\n1. Running Consumption Service...`);
        const consumptionRes = await computeAllConsumptionRates();
        console.log("Consumption Service Output:", consumptionRes);

        console.log(`\n2. Running Depletion Scan for ${companyId}...`);
        const depletionRes = await runDepletionScan(companyId);
        console.log("Depletion Service Output:", depletionRes);

        const logs = await prisma.automationDecisionLog.findMany({
            where: { sellerCompanyId: companyId, rule: "UNDERSTOCK_RISK" },
            take: 1,
            orderBy: { createdAt: 'desc' }
        });

        if (logs.length > 0) {
            console.log("\nDecision Log Created:", logs[0]);
        }

    } catch (e) {
        console.error("Test Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testF1();
