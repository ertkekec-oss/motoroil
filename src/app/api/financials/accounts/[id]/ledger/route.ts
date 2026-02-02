import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    try {
        const whereClause: any = { accountId: id };

        let openingBalanceDebt = 0;
        let openingBalanceCredit = 0;

        // 1. DATE FILTERING LOGIC
        if (startDateStr) {
            const start = new Date(startDateStr);
            whereClause.journal = { date: { gte: start } };

            // Calculate Opening Balance (Everything before Start Date)
            const previousItems = await prisma.journalItem.groupBy({
                by: ['accountId'],
                _sum: { debt: true, credit: true },
                where: {
                    accountId: id,
                    journal: { date: { lt: start } }
                }
            });

            if (previousItems.length > 0) {
                openingBalanceDebt = Number(previousItems[0]._sum.debt || 0);
                openingBalanceCredit = Number(previousItems[0]._sum.credit || 0);
            }
        }

        if (endDateStr) {
            const end = new Date(endDateStr);
            end.setHours(23, 59, 59, 999);
            whereClause.journal = {
                ...whereClause.journal,
                date: {
                    ...(whereClause.journal?.date || {}),
                    lte: end
                }
            };
        }

        // 2. FETCH ITEMS (Sorted ASC for Running Balance)
        const items = await prisma.journalItem.findMany({
            where: whereClause,
            include: {
                journal: {
                    select: {
                        date: true,
                        fisNo: true,
                        type: true,
                        sourceType: true,
                        description: true
                    }
                }
            },
            orderBy: {
                journal: { date: 'asc' } // ASC order is critical for ledger walk
            }
        });

        // 3. Return Data
        return NextResponse.json({
            success: true,
            openingBalance: { money: openingBalanceDebt - openingBalanceCredit, debt: openingBalanceDebt, credit: openingBalanceCredit },
            items
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
