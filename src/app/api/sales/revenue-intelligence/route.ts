import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { RevenueIntelligenceEngine } from '@/services/sales/revenueIntelligence';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        const tenantId = user.impersonateTenantId || user.tenantId;
        const companyId = user.companyId || user.impersonateCompanyId;

        // Fetch AI generated Data
        const insights = await prisma.revenueInsight.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const forecasts = await prisma.salesForecast.findMany({
            where: { companyId },
            orderBy: { expectedSales: 'desc' }
        });

        const risks = await prisma.salesRiskAlert.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 3
        });

        const opportunities = await prisma.salesOpportunity.findMany({
            where: { companyId },
            orderBy: { potentialValue: 'desc' },
            take: 3
        });

        const performanceScores = await prisma.salesPerformanceScore.findMany({
            where: { companyId },
            include: { staff: { select: { name: true } } },
            orderBy: { totalScore: 'desc' },
            take: 5
        });

        return NextResponse.json({
            success: true,
            data: {
                insights,
                forecasts,
                risks,
                opportunities,
                performanceScores
            }
        });

    } catch (error: any) {
        console.error('Revenue Intelligence API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
