import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET() {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const session = auth.user;

        // Bypass middleware to see EVERYTHING (for debug)
        // Note: Prisma middleware usually applies to the instance. 
        // We'll just count all orders in the whole DB first.
        const orderCountTotal = await (prisma as any).order.count();

        const allOrdersInDB = await (prisma as any).order.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { id: true, orderNumber: true, companyId: true, marketplace: true, status: true, createdAt: true }
        });

        const companies = await prisma.company.findMany({
            where: { tenantId: session.tenantId }
        });

        return NextResponse.json({
            success: true,
            session: {
                tenantId: session.tenantId,
                companyId: session.companyId,
                role: session.role
            },
            stats: {
                systemTotalOrders: orderCountTotal,
                tenantCompanies: companies.length,
                companies: companies.map(c => ({ id: c.id, name: c.name }))
            },
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
