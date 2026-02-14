
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // 1. Yetki Kontrolü
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        const isPlatformAdmin = session?.role === 'SUPER_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN' || session?.role === 'ADMIN';

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin Access Required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 20;
        const status = searchParams.get('status');
        const plan = searchParams.get('plan');
        const search = searchParams.get('search');

        const skip = (page - 1) * limit;

        // 2. Filtreler
        const where: any = {};

        if (status) where.status = status;

        if (plan) {
            where.subscription = {
                plan: { name: { contains: plan, mode: 'insensitive' } }
            };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { ownerEmail: { contains: search, mode: 'insensitive' } }
            ];
        }

        // 3. Veri Çekme
        const [total, tenants] = await (prisma as any).$transaction([
            (prisma as any).tenant.count({ where }),
            (prisma as any).tenant.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    subscription: {
                        include: {
                            plan: {
                                include: { limits: true }
                            }
                        }
                    },
                    companies: { select: { id: true, name: true } }, // Hafif veri
                    users: { select: { id: true } } // Sadece sayı için
                }
            })
        ]);

        // 4. Optimized Data Fetching (Fixing N+1 Problem)
        const tenantIds = tenants.map((t: any) => t.id);
        const allCompanyIds = tenants.flatMap((t: any) => t.companies.map((c: any) => c.id));
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        // Bulk Fetch Invoices
        const invoiceCounts = await (prisma as any).salesInvoice.groupBy({
            by: ['companyId'],
            _count: { _all: true },
            where: {
                companyId: { in: allCompanyIds },
                isFormal: true,
                createdAt: { gte: firstDayOfMonth }
            }
        });

        // Bulk Fetch Growth Events
        const growthEventCounts = await (prisma as any).growthEvent.groupBy({
            by: ['tenantId'],
            _count: { _all: true },
            where: {
                tenantId: { in: tenantIds },
                status: 'PENDING'
            }
        });

        // Bulk Fetch Last Active Users
        const lastActiveUsers = await (prisma as any).user.groupBy({
            by: ['tenantId'],
            _max: { lastActiveAt: true },
            where: {
                tenantId: { in: tenantIds }
            }
        });

        // Map Results
        const invoiceCountMap = new Map(invoiceCounts.map((ic: any) => [ic.companyId, ic._count._all]));
        const growthEventMap = new Map(growthEventCounts.map((ge: any) => [ge.tenantId, ge._count._all]));
        const lastActiveMap = new Map(lastActiveUsers.map((lau: any) => [lau.tenantId, lau._max.lastActiveAt]));

        const data = tenants.map((t: any) => {
            // Aggregate invoice counts for all companies of this tenant
            const tenantInvoiceCount = t.companies.reduce((sum: number, c: any) => sum + (Number(invoiceCountMap.get(c.id)) || 0), 0);

            // Last active status
            const lastActive = lastActiveMap.get(t.id) as any;
            let risk = 'HEALTHY';
            if (!lastActive) risk = 'NEW';
            else {
                const daysDiff = (new Date().getTime() - new Date(lastActive).getTime()) / (1000 * 3600 * 24);
                if (daysDiff > 14) risk = 'HIGH_RISK';
                else if (daysDiff > 7) risk = 'RISK';
            }

            // Olay Sinyalleri
            const growthEventsCount = growthEventMap.get(t.id) || 0;

            // Limit
            const invoiceLimit = t.subscription?.plan?.limits?.find((l: any) => l.resource === 'monthly_documents')?.limit || 0;
            const highValue = invoiceLimit !== -1 && invoiceLimit > 0 && (tenantInvoiceCount / invoiceLimit) >= 0.9;

            return {
                id: t.id,
                name: t.name,
                ownerEmail: t.ownerEmail,
                status: t.status,
                plan: t.subscription?.plan?.name || 'No Plan',
                subscriptionEndsAt: t.subscription?.endDate,
                highValue,
                risk,
                growthEventsCount,
                stats: {
                    companies: t.companies.length,
                    users: t.users.length,
                    invoices: tenantInvoiceCount,
                    invoiceLimit: invoiceLimit === -1 ? '∞' : invoiceLimit
                },
                createdAt: t.createdAt
            };
        });

        return NextResponse.json({
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
