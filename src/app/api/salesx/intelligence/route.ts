import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { SalesXIntelligenceEngine } from '@/services/salesx/intelligenceEngine';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        const tenantId = user.impersonateTenantId || user.tenantId;
        const companyId = user.companyId || user.impersonateCompanyId;
        const staffId = user.id;

        // Fetch Intelligence Data for UI
        const insights = await prisma.salesXInsight.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const opportunities = await prisma.salesXOpportunity.findMany({
            where: { companyId, status: 'OPEN' },
            include: { customer: { select: { name: true, city: true } } },
            orderBy: { priorityScore: 'desc' }
        });

        // Predictive Visits targeted for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const visits = await prisma.predictiveVisit.findMany({
            where: { companyId, status: 'SUGGESTED' },
            include: { customer: { select: { name: true, city: true, currentBalance: true } } },
            orderBy: { priorityScore: 'desc' }
        });

        const routeSuggestions = await prisma.routeSuggestion.findMany({
            where: { companyId, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 1
        });

        // If no data exists, run Engine once for setup simulation
        if (insights.length === 0 && opportunities.length === 0) {
            await SalesXIntelligenceEngine.runEngineForSalesX(tenantId, companyId);
            return NextResponse.redirect(new URL(request.url));
        }

        return NextResponse.json({
            success: true,
            data: {
                insights,
                opportunities,
                visits,
                route: routeSuggestions[0] || null
            }
        });

    } catch (error: any) {
        console.error('SalesX API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
