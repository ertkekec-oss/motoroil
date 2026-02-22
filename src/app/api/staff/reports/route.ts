
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = req.nextUrl.searchParams;
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        if (!startDateStr || !endDateStr) {
            return NextResponse.json({ error: 'Dates required' }, { status: 400 });
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const staffUser = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.email },
                    { username: session.username || session.email }
                ]
            }
        });

        if (!staffUser) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

        // 1. Sales Report (SalesOrder)
        const sales = await (prisma as any).salesOrder.findMany({
            where: {
                staffId: staffUser.id,
                createdAt: { gte: startDate, lte: endDate },
                status: { not: 'CANCELLED' }
            },
            include: { customer: { select: { name: true } } }
        });

        const totalSales = sales.reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0);

        // 2. Collections Report (Transactions with type 'TAHSILAT' or similar)
        // Usually collections linked to visit or staff
        const collections = await (prisma as any).transaction.findMany({
            where: {
                companyId: staffUser.companyId,
                date: { gte: startDate, lte: endDate },
                type: 'Tahsilat', // Assuming this is the type name
                OR: [
                    { visit: { staffId: staffUser.id } },
                    { description: { contains: staffUser.name } } // Fallback
                ]
            },
            include: { customer: { select: { name: true } } }
        });

        const totalCollections = collections.reduce((sum: number, c: any) => sum + Number(c.amount), 0);

        // 3. Visits Report
        const visits = await (prisma as any).salesVisit.findMany({
            where: {
                staffId: staffUser.id,
                checkInTime: { gte: startDate, lte: endDate }
            },
            include: { customer: { select: { name: true } } }
        });

        return NextResponse.json({
            success: true,
            summary: {
                totalSales,
                salesCount: sales.length,
                totalCollections,
                collectionsCount: collections.length,
                totalVisits: visits.length
            },
            details: {
                sales,
                collections,
                visits
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
