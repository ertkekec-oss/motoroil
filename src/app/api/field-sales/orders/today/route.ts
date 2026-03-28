import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Resolve Staff record
        const staffUser = await (prisma as any).staff.findUnique({
            where: { id: session.id }
        });

        // Field Mobile is primarily for Staff. If an admin bypasses, we'll just allow all or none. 
        // For simplicity, we filter by staffId or return all if admin without staffId.
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let whereClause: any = {
            orderDate: {
                gte: startOfDay
            }
        };

        if (staffUser) {
            whereClause.staffId = staffUser.id;
        }

        const orders = await (prisma as any).order.findMany({
            where: whereClause,
            include: {
                customer: {
                    select: { name: true, branchName: true }
                }
            },
            orderBy: { orderDate: 'desc' }
        });

        return NextResponse.json(orders);
    } catch (error: any) {
        console.error('Error fetching today orders:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
