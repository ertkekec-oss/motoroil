import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { authorized, user, response } = await authorize();
        if (!authorized) return response;

        const companyId = user.companyId;
        if (!companyId) throw new Error("Şirket kimliği bulunamadı.");

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Filter conditions
        const dateFilter: any = {};
        if (startDate) dateFilter.date = { gte: new Date(startDate) };
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.date = { ...dateFilter.date, lte: end };
        }

        // 1. Fetch Aggregated Data
        const groups = await prisma.journalItem.groupBy({
            by: ['accountId'],
            _sum: { debt: true, credit: true },
            where: {
                journal: {
                    companyId: companyId,
                    ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter.date } : {})
                }
            }
        });

        // 2. Fetch Relevant Accounts (6xx and 7xx)
        const accounts = await prisma.account.findMany({
            where: {
                companyId: companyId,
                OR: [
                    { code: { startsWith: '6' } },
                    { code: { startsWith: '7' } }
                ]
            },
            select: { id: true, code: true, name: true }
        });

        // 3. Calculation buckets
        let grossSales = 0;      // 60x
        let discounts = 0;       // 61x
        let costOfSales = 0;     // 62x
        let operatingExp = 0;    // 700-779
        let financeExp = 0;      // 780-799
        let otherIncome = 0;     // 64x, 67x
        let otherExpense = 0;    // 65x, 68x

        const details: any[] = [];

        for (const acc of accounts) {
            const group = groups.find(g => g.accountId === acc.id);
            if (!group) continue;

            const debt = Number(group._sum.debt || 0);
            const credit = Number(group._sum.credit || 0);
            if (debt === 0 && credit === 0) continue;

            let balance = 0;
            let section = '';

            // Logic to classify and calculate balance based on Account Type
            if (acc.code.startsWith('60')) {
                balance = credit - debt;
                grossSales += balance;
                section = 'grossSales';
            } else if (acc.code.startsWith('61')) {
                balance = debt - credit;
                discounts += balance;
                section = 'discounts';
            } else if (acc.code.startsWith('62')) {
                balance = debt - credit;
                costOfSales += balance;
                section = 'costOfSales';
            } else if (acc.code.startsWith('64') || acc.code.startsWith('67')) {
                balance = credit - debt;
                otherIncome += balance;
                section = 'otherIncome';
            } else if (acc.code.startsWith('65') || acc.code.startsWith('68')) {
                balance = debt - credit;
                otherExpense += balance;
                section = 'otherExpense';
            } else if (acc.code.startsWith('78') || acc.code.startsWith('66')) { // 780 or 660 for Finance
                balance = debt - credit;
                financeExp += balance;
                section = 'financeExp';
            } else if (acc.code.startsWith('7')) { // All other 7xx (700-779)
                balance = debt - credit;
                operatingExp += balance;
                section = 'operatingExp';
            }

            if (section) {
                details.push({
                    code: acc.code,
                    name: acc.name,
                    balance,
                    section
                });
            }
        }

        // 4. Summaries
        const netSales = grossSales - discounts;
        const grossProfit = netSales - costOfSales;
        const operatingProfit = grossProfit - operatingExp;
        const profitBeforeTax = operatingProfit + otherIncome - otherExpense - financeExp;

        // Ignoring Tax (691) for now as it makes sense only after closing
        const netProfit = profitBeforeTax;

        return NextResponse.json({
            success: true,
            report: {
                grossSales,
                discounts,
                netSales,
                costOfSales,
                grossProfit,
                operatingExp,
                operatingProfit,
                otherIncome,
                otherExpense,
                financeExp,
                netProfit,
                details
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
