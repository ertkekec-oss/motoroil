
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Using alias
import { getSession } from '@/lib/auth';
import { addDays, format, startOfDay, subDays } from 'date-fns';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const tenantId = session.tenantId;

        console.log(`[FORECAST] Starting forecast for tenant: ${tenantId}`);

        // 1. Current Actual Balance
        const kasalar = await (prisma as any).kasa.findMany({
            where: {
                company: { tenantId },
                isActive: true
            },
            select: { balance: true, currency: true }
        });

        let currentBalance = kasalar.reduce((sum: number, k: any) => sum + Number(k.balance), 0);
        console.log(`[FORECAST] Current Balance: ${currentBalance}`);

        // 2. Define Date Range (Next 60 Days)
        const today = startOfDay(new Date());
        const futureDate = addDays(today, 60);

        // 3. Fetch Confirmed Future Inflows (Sales Installments)
        const incomingInstallments = await (prisma as any).installment.findMany({
            where: {
                paymentPlan: {
                    company: { tenantId },
                    direction: 'IN' // Receivables
                },
                dueDate: { gte: today, lte: futureDate },
                status: 'Pending'
            },
            select: { dueDate: true, amount: true }
        });

        // 4. Fetch Confirmed Future Outflows (Purchase Installments)
        const outgoingInstallments = await (prisma as any).installment.findMany({
            where: {
                paymentPlan: {
                    company: { tenantId },
                    direction: 'OUT' // Payables
                },
                dueDate: { gte: today, lte: futureDate },
                status: 'Pending'
            },
            select: { dueDate: true, amount: true }
        });

        // 5. Fetch Pending Purchase Invoices (Accounts Payable)
        // Assume pending invoices without a payment plan are "Due on dueDate"
        const pendingPayables = await (prisma as any).purchaseInvoice.findMany({
            where: {
                company: { tenantId },
                dueDate: { not: null, gte: today, lte: futureDate },
                status: { not: 'Paid' } // Assuming status 'Paid' or 'Ödendi'
            },
            select: { dueDate: true, totalAmount: true }
        });

        // 6. Calculate "Burn Rate" (Average Daily Operational Expense)
        // Look back 90 days
        const pastDate = subDays(today, 90);
        try {
            const expenseTransactions = await (prisma as any).transaction.findMany({
                where: {
                    company: { tenantId },
                    type: 'Expense',
                    supplierId: null, // Pure operational expense (rent, bills)
                    date: { gte: pastDate }
                },
                select: { amount: true }
            });

            const totalBurn = expenseTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
            const dailyBurnRate = expenseTransactions.length > 0 ? (totalBurn / 90) : 0;

            console.log(`[FORECAST] Daily Burn Rate: ${dailyBurnRate}`);

            // 7. Aggregate Data Day by Day
            const dailyForecast: any[] = [];
            let runningBalance = currentBalance;

            for (let i = 0; i <= 60; i++) {
                const date = addDays(today, i);
                const dateStr = format(date, 'yyyy-MM-dd');

                // Incoming for this day
                const dayIncome = incomingInstallments
                    .filter((ins: any) => format(new Date(ins.dueDate), 'yyyy-MM-dd') === dateStr)
                    .reduce((sum: number, ins: any) => sum + Number(ins.amount), 0);

                // Outgoing for this day
                const dayInstallmentExpense = outgoingInstallments
                    .filter((ins: any) => format(new Date(ins.dueDate), 'yyyy-MM-dd') === dateStr)
                    .reduce((sum: number, ins: any) => sum + Number(ins.amount), 0);

                const dayInvoiceExpense = pendingPayables
                    .filter((inv: any) => inv.dueDate && format(new Date(inv.dueDate), 'yyyy-MM-dd') === dateStr)
                    .reduce((sum: number, inv: any) => sum + Number(inv.totalAmount), 0);

                // Apply Estimated Burn Rate
                const dayEstimatedExpense = dailyBurnRate;

                const totalDailyIn = dayIncome;
                const totalDailyOut = dayInstallmentExpense + dayInvoiceExpense + dayEstimatedExpense;

                runningBalance = runningBalance + totalDailyIn - totalDailyOut;

                dailyForecast.push({
                    date: dateStr,
                    dayIncome: totalDailyIn,
                    dayExpense: totalDailyOut,
                    operationalExpense: dayEstimatedExpense,
                    balance: runningBalance,
                    status: runningBalance < 0 ? 'CRITICAL' : (runningBalance < 1000 ? 'LOW' : 'SAFE')
                });
            }

            const minBalance = Math.min(...dailyForecast.map(d => d.balance));
            const maxBalance = Math.max(...dailyForecast.map(d => d.balance));
            const riskDays = dailyForecast.filter(d => d.balance < 0).map(d => d.date);

            return NextResponse.json({
                currentBalance,
                dailyBurnRate,
                forecast: dailyForecast,
                analysis: {
                    minBalance,
                    maxBalance,
                    riskDays,
                    message: riskDays.length > 0
                        ? `${riskDays.length} gün boyunca nakit eksiye düşebilir.`
                        : 'Önümüzdeki 60 gün nakit akışı pozitif görünüyor.'
                }
            });

        } catch (innerError) {
            console.error("Inner Forecast Logic Error:", innerError);
            throw innerError;
        }

    } catch (error: any) {
        console.error('Forecast API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
