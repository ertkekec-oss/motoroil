
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';
import { calculateUpsellSignal } from '@/lib/upsell-engine';

export async function GET(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        if (ctx.role !== 'SUPER_ADMIN' && ctx.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const tenants = await (prisma as any).tenant.findMany({
            include: {
                subscription: {
                    include: {
                        plan: {
                            include: { limits: true }
                        }
                    }
                },
                companies: { select: { id: true } }
            }
        });

        const tenantIds = tenants.map((t: any) => t.id);
        const allCompanyIds = tenants.flatMap((t: any) => t.companies.map((c: any) => c.id));
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);

        // Bulk Fetch Invoice Counts
        const invoiceCounts = await (prisma as any).salesInvoice.groupBy({
            by: ['companyId'],
            _count: { _all: true },
            where: {
                companyId: { in: allCompanyIds },
                isFormal: true,
                createdAt: { gte: startOfMonth }
            }
        });

        // Bulk Fetch User Counts
        const userCounts = await (prisma as any).user.groupBy({
            by: ['tenantId'],
            _count: { _all: true },
            where: { tenantId: { in: tenantIds } }
        });

        // Bulk Fetch Growth Events
        const growthEvents = await (prisma as any).growthEvent.findMany({
            where: {
                tenantId: { in: tenantIds },
                createdAt: { gte: sevenDaysAgo }
            }
        });

        // Bulk Fetch Next Plans
        const allPlans = await (prisma as any).plan.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' }
        });

        // Map data for quick access
        const invoiceMap = new Map(invoiceCounts.map((ic: any) => [ic.companyId, ic._count._all]));
        const userCountMap = new Map(userCounts.map((uc: any) => [uc.tenantId, uc._count._all]));
        const growthEventMap = new Map<string, any[]>();
        growthEvents.forEach((ge: any) => {
            if (!growthEventMap.has(ge.tenantId)) growthEventMap.set(ge.tenantId, []);
            growthEventMap.get(ge.tenantId)?.push(ge);
        });

        const radarData = tenants.map((tenant: any) => {
            const sub = tenant.subscription;
            if (!sub || !sub.plan) return null;

            const currentPlan = sub.plan;
            const currentPrice = Number(currentPlan.price);
            const nextPlan = allPlans.find((p: any) => Number(p.price) > currentPrice);

            // Calc usage
            const monthlyDocsUsage = tenant.companies.reduce((sum: number, c: any) => sum + (Number(invoiceMap.get(c.id)) || 0), 0);
            const userUsage = Number(userCountMap.get(tenant.id)) || 0;

            const getLimit = (key: string) => {
                const l = currentPlan.limits?.find((l: any) => l.resource === key);
                return l ? Number(l.limit) : -1;
            };

            const docLimit = getLimit('monthly_documents');
            const companyLimit = getLimit('companies');
            const userLimit = getLimit('users');

            const docPercent = docLimit > 0 ? (monthlyDocsUsage / docLimit) * 100 : 0;
            const companyPercent = companyLimit > 0 ? (tenant.companies.length / companyLimit) * 100 : 0;
            const userPercent = userLimit > 0 ? (userUsage / userLimit) * 100 : 0;

            const tenantEvents = growthEventMap.get(tenant.id) || [];
            const hasGrowthSignal = tenantEvents.some((e: any) => e.type === 'GROWTH_SIGNAL');
            const hasLimit80 = tenantEvents.some((e: any) => e.type === 'LIMIT_80');

            // Signal Logic (Simplified inline version of upsell-engine to stay bulk)
            let signal: any = null;
            let status = 'HEALTHY';

            if (nextPlan) {
                if (docPercent >= 95 || companyPercent >= 100 || userPercent >= 100) {
                    signal = { type: 'HARD', priority: 10, message: "Limitlerine dayandın, kesintisiz devam etmek için paketini yükselt." };
                    status = 'CRITICAL_LIMIT';
                } else if (docPercent > 80 || hasGrowthSignal) {
                    signal = { type: 'CONTEXTUAL', priority: 8, message: "Bu ayki büyüme hızın mevcut paketinin üstünde. Yükseltme vakti!" };
                    status = 'UPSELL_READY';
                } else if (docPercent > 70 || hasLimit80) {
                    signal = { type: 'SOFT', priority: 5, message: "İşletmen hızla büyüyor! Kapasiteni artırmayı düşünür müsün?" };
                    status = 'EXPANSION_CANDIDATE';
                }
            }

            return {
                id: tenant.id,
                name: tenant.name,
                ownerEmail: tenant.ownerEmail,
                currentPlan: currentPlan.name,
                status,
                signal,
                metrics: {
                    companies: tenant.companies.length,
                    users: userUsage,
                    invoices: monthlyDocsUsage
                }
            };
        }).filter(Boolean);

        // Sort by priority
        radarData.sort((a: any, b: any) => (b.signal?.priority || 0) - (a.signal?.priority || 0));

        return NextResponse.json(radarData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
