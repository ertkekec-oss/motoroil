// test-d4.ts
import { prisma } from "../src/lib/prisma";
import { runSuggestionEngine } from "../src/workers/suggestionEngine";
import crypto from "crypto";

async function runTest() {
    process.env.PRISMA_BYPASS_EXTENSION = "true";
    process.env.ENABLE_GLOBAL_AUTOMATION = "true"; // global kill switch

    try {
        const company = await prisma.company.findFirst();
        if (!company) throw new Error("No company found");
        const companyId = company.id;

        console.log(`\n1. Running Suggestion Engine (Rollout & Decision Log) for ${companyId}...`);

        // Ensure policy allows auto-publish and rollout 10%
        await prisma.sellerAutomationPolicy.upsert({
            where: { sellerCompanyId: companyId },
            update: { autoPublishEnabled: true, rolloutPercent: 100 },
            create: { sellerCompanyId: companyId, autoPublishEnabled: true, rolloutPercent: 100, minOnHandThreshold: 1, lowSalesThreshold: 100 }
        });

        const engineRes = await runSuggestionEngine({ companyId, dryRun: false });
        console.log("Engine Result:", engineRes);

        const decisionLogs = await prisma.automationDecisionLog.findMany({
            where: { sellerCompanyId: companyId }, // take 1 for speed
            take: 1,
            orderBy: { createdAt: 'desc' }
        });
        console.log("Sample Decision Log:", decisionLogs[0]);

        console.log("\n2. KPI Metrics Service...");
        const { getAutomationMetrics } = require("../src/services/automation/automationMetricsService");
        const metrics = await getAutomationMetrics(companyId);
        console.log("Metrics:", metrics);

        console.log("\nTest Completed Successfully.");
    } catch (e: any) {
        console.error("Test Error:", e);
    }
}

runTest();
