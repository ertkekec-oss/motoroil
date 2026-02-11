import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const transactions = await (prisma as any).bankTransaction.findMany({
            where: {
                companyId: session.user.companyId
            },
            include: {
                connection: true,
                matches: true
            },
            orderBy: {
                transactionDate: 'desc'
            },
            take: limit
        });

        return NextResponse.json({
            success: true,
            transactions
        });

    } catch (error: any) {
        console.error('Fetch Bank Transactions Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
