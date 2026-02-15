import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET() {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const session = auth.user;

        const orderCountTotal = await prisma.order.count();
        const orders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { company: true }
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
            recentOrders: orders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                companyId: o.companyId,
                marketplace: o.marketplace,
                status: o.status,
                createdAt: o.createdAt
            }))
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
