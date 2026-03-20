import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        if (user.role !== "SUPER_ADMIN" && user.role !== "OWNER") {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const transactions = await prisma.paymentTransaction.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: {
                    select: {
                        name: true,
                        ownerEmail: true
                    }
                }
            },
            take: 100 // limit to recent 100 for ops view
        });

        return NextResponse.json({ success: true, data: transactions });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
