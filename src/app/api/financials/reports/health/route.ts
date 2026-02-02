import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Fetch all account balances (similar to Trial Balance)
        // Group by Account Code Prefix (1, 2, 3, 10, 60, etc.)

        const accounts = await prisma.account.findMany({
            include: {
                journalItems: {
                    select: {
                        debt: true,
                        credit: true
                    }
                }
            }
        });

        // Helper to sum balances by code prefix
        const sumByPrefix = (prefix: string) => {
            return accounts
                .filter(a => a.code.startsWith(prefix))
                .reduce((acc, curr) => {
                    const totalDebt = curr.journalItems.reduce((sum, item) => sum + Number(item.debt), 0);
                    const totalCredit = curr.journalItems.reduce((sum, item) => sum + Number(item.credit), 0);

                    // Determine balance based on account class logic simplified
                    // Assets/Expenses (1, 2, 6, 7) usually Debit
                    // Liabilities/Equity/Income (3, 4, 5, 6) usually Credit

                    // For Ratios, we just need raw values often.
                    // Assets (1, 2) -> Debit Balance
                    // Liabilities (3, 4, 5) -> Credit Balance
                    // Revenues (6) -> Credit Balance

                    const code = curr.code;
                    let val = 0;
                    if (code.startsWith('1') || code.startsWith('2') || code.startsWith('6') || code.startsWith('7')) {
                        // This is tricky. Let's simplify:
                        // 1xx, 2xx: Assets => Debit - Credit
                        if (code.startsWith('1') || code.startsWith('2')) return acc + (totalDebt - totalCredit);

                        // 3xx, 4xx, 5xx: Liabilities => Credit - Debit
                        if (code.startsWith('3') || code.startsWith('4') || code.startsWith('5')) return acc + (totalCredit - totalDebt);
                    }
                    return acc;
                }, 0);
        };

        // More precise helper for specific groups
        const balance = (prefix: string) => {
            return accounts
                .filter(a => a.code.startsWith(prefix))
                .reduce((acc, curr) => {
                    const totalDebt = curr.journalItems.reduce((sum, item) => sum + Number(item.debt), 0);
                    const totalCredit = curr.journalItems.reduce((sum, item) => sum + Number(item.credit), 0);

                    // General rule for "Value" extraction
                    if (prefix.startsWith('1') || prefix.startsWith('7')) return acc + (totalDebt - totalCredit); // Assets, Expenses
                    if (prefix.startsWith('3') || prefix.startsWith('4') || prefix.startsWith('5') || prefix.startsWith('6')) return acc + (totalCredit - totalDebt); // Liabilities, Equity, Income
                    return acc;
                }, 0);
        };

        // --- 1. DATA GATHERING ---

        // Current Assets (Dönen Varlıklar - 1xx)
        const currentAssets = balance('1');

        // Short Term Liabilities (KVYK - 3xx)
        const shortTermLiabilities = balance('3');

        // Total Assets (1xx + 2xx)
        const fixedAssets = balance('2');
        const totalAssets = currentAssets + fixedAssets;

        // Total Liabilities (3xx + 4xx) (Strictly Debt)
        const longTermLiabilities = balance('4');
        const totalDebt = shortTermLiabilities + longTermLiabilities;

        // Cash equivalents (Hazır Değerler - 10)
        const cashEquivalents = balance('10');

        // Revenue (Gross Sales 60 - Discounts 61)
        const grossSales = balance('60');
        const discounts = balance('61') * -1; // Usually returns negative if we just sum? accounts 61 are usually 'Debit' balance but are 'Revenue reductions'. 
        // Logic fix: 61 is Debit balance. My balance function returns 'Credit - Debit' for 6xx. So 61 will be negative. Correct.
        // Wait, for 6xx I defined `acc + (totalCredit - totalDebt)`.
        // Account 600 (Credit>Debit) -> Positive Result.
        // Account 610 (Debit>Credit) -> Negative Result.
        const netSales = grossSales + balance('61');

        // Net Profit (Rough Estimate: Income 6 - Expense 7)
        // 6xx are Income (Credit balance +), 7xx are Expense (Debit balance +)
        const totalIncome6 = accounts.filter(a => a.code.startsWith('6')).reduce((acc, curr) => {
            const d = curr.journalItems.reduce((s, i) => s + Number(i.debt), 0);
            const c = curr.journalItems.reduce((s, i) => s + Number(i.credit), 0);
            return acc + (c - d); // Net Income Contribution
        }, 0);

        const totalExpense7 = accounts.filter(a => a.code.startsWith('7')).reduce((acc, curr) => {
            const d = curr.journalItems.reduce((s, i) => s + Number(i.debt), 0);
            const c = curr.journalItems.reduce((s, i) => s + Number(i.credit), 0);
            return acc + (d - c); // Net Expense Cost
        }, 0);

        const netProfit = totalIncome6 - totalExpense7; // Very rough, ignores reflection accounts (yansıtma) issues but good for dashboard

        // --- 2. RATIO ANALYTICS ---

        // A. Current Ratio (Cari Oran) = Current Assets / Short Term Liabilities
        // Ideal: 1.5 - 2.0
        const currentRatio = shortTermLiabilities > 0 ? (currentAssets / shortTermLiabilities) : (currentAssets > 0 ? 999 : 0);

        // B. Cash Ratio (Nakit Oranı) = Cash / Short Term Liabilities
        // Ideal: 0.20+
        const cashRatio = shortTermLiabilities > 0 ? (cashEquivalents / shortTermLiabilities) : (cashEquivalents > 0 ? 999 : 0);

        // C. Debt Ratio (Kaldıraç) = Total Debt / Total Assets
        // Ideal: < 0.50 (low risk)
        const debtRatio = totalAssets > 0 ? (totalDebt / totalAssets) : 0;

        // D. Net Profit Margin = Net Profit / Net Sales
        const profitMargin = netSales > 0 ? (netProfit / netSales) : 0;


        return NextResponse.json({
            success: true,
            data: {
                currentAssets,
                shortTermLiabilities,
                totalAssets,
                totalDebt,
                cashEquivalents,
                netSales,
                netProfit
            },
            ratios: {
                currentRatio,
                cashRatio,
                debtRatio,
                profitMargin
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
