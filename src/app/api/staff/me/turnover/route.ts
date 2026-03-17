import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const companyId = session.user.companyId || (session as any).companyId;
        const userId = session.user.id;

        // Today's start and end logic
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch sales documents created by this user today
        const salesInvoices = await prisma.salesInvoice.findMany({
            where: {
                companyId,
                createdBy: userId, // Assuming createdBy holds the user ID
                updatedAt: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: {
                    not: 'İptal Edildi'
                }
            }
        });

        // Also fetch from POS history if that's a different model or if pos sales don't trigger invoice immediately
        // Wait, orders table has createdBy too. Let's just sum orders completed today by this user.
        const orders = await prisma.order.findMany({
            where: {
                companyId,
                createdBy: userId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: {
                    notIn: ['İptal', 'İade']
                }
            }
        });

        let totalTurnover = 0;
        
        // Summing orders total amount
        if (orders.length > 0) {
            orders.forEach(o => {
                totalTurnover += Number(o.totalAmount || 0);
            });
        }

        return NextResponse.json({ success: true, turnover: totalTurnover, orderCount: orders.length });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
