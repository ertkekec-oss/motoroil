import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const branch = searchParams.get('branch');
        const tenantId = searchParams.get('tenantId');
        
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
        }

        // We fetch the company via tenantId
        // But since this is multi-tenant API, it depends on the schema
        // The ServiceOrder uses `companyId`. So we need to get user's companyId first,
        // or if `tenantId` is given, find the company matching it.
        const company = await prisma.company.findFirst({
            where: { tenantId }
        });

        if (!company) {
            return NextResponse.json({ pending: 0, inProgress: 0, completed: 0, totalRevenue: 0, recentOrders: [] });
        }

        const buildWhere = () => {
            const where: any = { companyId: company.id };
            if (branch && branch !== 'all') {
                where.branch = branch;
            }
            return where;
        };

        const [pending, inProgress, completed, allOrders] = await Promise.all([
            prisma.serviceOrder.count({ where: { ...buildWhere(), status: 'PENDING' } }),
            prisma.serviceOrder.count({ where: { ...buildWhere(), status: 'IN_PROGRESS' } }),
            prisma.serviceOrder.count({ where: { ...buildWhere(), status: { in: ['COMPLETED', 'READY'] } } }),
            prisma.serviceOrder.findMany({
                where: buildWhere(),
                include: { customer: true, asset: true },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);

        const totalRevenue = allOrders
            .filter(o => o.status !== 'CANCELLED')
            .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

        return NextResponse.json({
            pending,
            inProgress,
            completed,
            totalRevenue,
            recentOrders: allOrders
        });
    } catch (error: any) {
        console.error('Service dashboard error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
