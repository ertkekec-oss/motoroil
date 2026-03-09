import { prisma } from '@/lib/prisma';
import { SalesXIntelligenceEngine } from '@/services/salesx/intelligenceEngine';

/**
 * DAILY JOB
 * Runs every day to check reactivation possibilities and regenerate tomorrow's predictive routes.
 */
export async function runSalesXDailyJob() {
    console.log('[JOBS] Starting SalesX Intelligence Daily Job...');

    // Process active companies
    const companies = await prisma.company.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, tenantId: true }
    });

    for (const c of companies) {
        // Detect long-sleeping customers and assign to field reps
        await SalesXIntelligenceEngine.detectCustomerReactivation(c.tenantId, c.id);

        // Find field staff 
        const fieldStaffs = await prisma.staff.findMany({
            where: { companyId: c.id, role: { in: ['FIELD_SALES', 'SATIC', null] } }
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        for (const s of fieldStaffs) {
            // Clean yesterday's 'SUGGESTED' visits if any exist to replan
            await prisma.predictiveVisit.deleteMany({
                where: { companyId: c.id, assignedStaffId: s.id, status: 'SUGGESTED' }
            });

            // Regenerate routing layout and Priority Scores
            await SalesXIntelligenceEngine.generatePredictiveVisits(c.tenantId, c.id, s.id);
            await SalesXIntelligenceEngine.generateRouteSuggestion(c.tenantId, c.id, s.id, tomorrow);
        }
    }

    console.log('[JOBS] SalesX Intelligence Daily Job Completed.');
}

/**
 * WEEKLY JOB
 * Runs every week to detect Cross-Sell / Upsell Opportunities across the customer base.
 */
export async function runSalesXWeeklyJob() {
    console.log('[JOBS] Starting SalesX Intelligence Weekly Job...');

    const companies = await prisma.company.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, tenantId: true }
    });

    for (const c of companies) {
        // Find cart-mismatches and generate upsell
        await SalesXIntelligenceEngine.detectUpsellOpportunities(c.tenantId, c.id);
    }

    console.log('[JOBS] SalesX Intelligence Weekly Job Completed.');
}
