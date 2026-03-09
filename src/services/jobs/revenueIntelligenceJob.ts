import { prisma } from '@/lib/prisma';
import { RevenueIntelligenceEngine } from '@/services/sales/revenueIntelligence';

/**
 * DAILY JOB
 * Runs every day to check risk thresholds and detect fresh opportunities.
 */
export async function runRevenueDailyJob() {
    console.log('[JOBS] Starting Revenue Intelligence Daily Job...');

    // In a real env, we'd batch over active tenants
    const companies = await prisma.company.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, tenantId: true }
    });

    for (const c of companies) {
        // Daily operations: Check fast velocity drops, simple ops
        await RevenueIntelligenceEngine.detectSalesRisks(c.tenantId, c.id, 'SYSTEM_DAILY');
    }

    console.log('[JOBS] Revenue Intelligence Daily Job Completed.');
}

/**
 * WEEKLY JOB
 * Runs every week to generate coaching insights and opportunities.
 */
export async function runRevenueWeeklyJob() {
    console.log('[JOBS] Starting Revenue Intelligence Weekly Job...');

    const companies = await prisma.company.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, tenantId: true }
    });

    for (const c of companies) {
        await RevenueIntelligenceEngine.detectSalesOpportunities(c.tenantId, c.id);

        // Coach staffs
        const staffs = await prisma.staff.findMany({ where: { companyId: c.id }, take: 10 });
        for (const s of staffs) {
            await RevenueIntelligenceEngine.generateCoachingInsights(c.tenantId, c.id, s.id);
        }
    }

    console.log('[JOBS] Revenue Intelligence Weekly Job Completed.');
}

/**
 * MONTHLY JOB
 * Runs endpoint of month to re-calculate forecasts, performance scores, and generate new target recommendations.
 */
export async function runRevenueMonthlyJob() {
    console.log('[JOBS] Starting Revenue Intelligence Monthly Job...');

    const companies = await prisma.company.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, tenantId: true }
    });

    for (const c of companies) {
        // Full recalculation
        await RevenueIntelligenceEngine.processSalesForecast(c.tenantId, c.id);
        await RevenueIntelligenceEngine.generateTargetSuggestion(c.tenantId, c.id);

        const staffs = await prisma.staff.findMany({ where: { companyId: c.id }, take: 10 });
        for (const s of staffs) {
            await RevenueIntelligenceEngine.analyzePerformance(c.tenantId, c.id, s.id, "LAST_MONTH");
        }
    }

    console.log('[JOBS] Revenue Intelligence Monthly Job Completed.');
}
