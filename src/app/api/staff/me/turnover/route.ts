import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = auth.user.companyId;
        const userId = auth.user.id;

        const staffUser = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: auth.user.email },
                    { username: auth.user.username || auth.user.email }
                ]
            }
        });
        const staffId = staffUser ? staffUser.id : null;

        // Today's start and end logic
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch sales documents created by this user today
        const orders = await (prisma as any).order.findMany({
            where: {
                companyId,
                OR: [
                    { createdBy: userId },
                    staffId ? { staffId: staffId } : {}
                ],
                orderDate: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: {
                    in: ['Tamamlandı', 'COMPLETED', 'Ödendi', 'Açık Hesap']
                }
            }
        });

        let totalTurnover = 0;
        
        // Summing orders total amount
        if (orders.length > 0) {
            orders.forEach((o: any) => {
                totalTurnover += Number(o.totalAmount || 0);
            });
        }

        return NextResponse.json({ success: true, turnover: totalTurnover, orderCount: orders.length });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
