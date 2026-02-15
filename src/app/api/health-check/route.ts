import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET() {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const session = auth.user;

        // Bypass middleware to see EVERYTHING (for debug)
        const totalOrdersInSystem = await (prisma as any).order.count();

        const allOrdersInDB = await (prisma as any).order.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { id: true, orderNumber: true, companyId: true, marketplace: true, status: true, createdAt: true }
        });

        const allCompaniesInSystem = await (prisma as any).company.findMany({
            select: {
                id: true,
                name: true,
                tenantId: true,
                _count: {
                    select: { orders: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            session: {
                tenantId: session.tenantId,
                companyId: session.companyId,
                role: session.role,
                effectiveTenantId: session.impersonateTenantId || session.tenantId
            },
            stats: {
                systemTotalOrders: totalOrdersInSystem,
                totalCompaniesInSystem: allCompaniesInSystem.length,
            },
            allCompanies: allCompaniesInSystem,
            allRecentOrdersInSystem: allOrdersInDB,
            tenantSpecificOrders: await prisma.order.findMany({
                where: { company: { tenantId: session.tenantId } },
                take: 10
            })
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
