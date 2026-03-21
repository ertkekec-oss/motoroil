import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { items } = body;

        // items = [{ id, order }]
        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const transactions = items.map((item: any) =>
            prisma.networkBanner.updateMany({
                where: {
                    id: item.id,
                    tenantId
                },
                data: {
                    order: item.order
                }
            })
        );

        await prisma.$transaction(transactions);

        return NextResponse.json({ success: true });

    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
