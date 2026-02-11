import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class CashflowForecastEngine {
    /**
     * Calculates cashflow forecast for 7, 14, and 30 day horizons.
     */
    static async generate(companyId: string) {
        const horizons = [7, 14, 30];
        const results = [];

        for (const horizon of horizons) {
            const forecast = await this.calculateForHorizon(companyId, horizon);
            results.push(forecast);

            // Record in DB
            await (prisma as any).cashflowForecast.create({
                data: {
                    companyId,
                    horizonDays: horizon,
                    expectedIn: forecast.expectedIn,
                    expectedOut: forecast.expectedOut,
                    netPosition: forecast.netPosition
                }
            });
        }

        return results;
    }

    private static async calculateForHorizon(companyId: string, days: number) {
        // 1. EXPECTED IN: Open Marketplace Receivables (120.03)
        // Usually payout within 7-14 days. 
        // For simplicity: horizon <= 7 -> 50% of 120.03, horizon > 7 -> 100% of 120.03
        const receivables = await (prisma as any).journalLine.findMany({
            where: {
                companyId,
                accountCode: '120.03',
                isOpen: true
            }
        });

        const totalReceivables = receivables.reduce((acc: number, l: any) => acc + Number(l.credit || 0), 0);
        let expectedIn = days <= 7 ? totalReceivables * 0.6 : totalReceivables;

        // 2. EXPECTED IN: Regular Customers (120.01) based on Due Dates
        // (Assuming we have due dates in invoices or journal lines)
        // For now, let's use a percentage of open balance
        const customerReceivables = await (prisma as any).account.findFirst({
            where: { companyId, code: '120.01' }
        });
        const regTotal = Number(customerReceivables?.balance || 0);
        expectedIn += (regTotal * (days / 60)); // Simple linear projection (avg 60 day term)

        // 3. EXPECTED OUT: Accounts Payable (320.01)
        const payables = await (prisma as any).account.findFirst({
            where: { companyId, code: '320.01' }
        });
        const totalPayables = Math.abs(Number(payables?.balance || 0));
        const expectedOut = totalPayables * (days / 30); // Avg 30 day term

        // 4. Net Position
        const netPosition = expectedIn - expectedOut;

        return {
            expectedIn: new Decimal(expectedIn),
            expectedOut: new Decimal(expectedOut),
            netPosition: new Decimal(netPosition)
        };
    }

    /**
     * Phase 2.5: Working Capital Risk Score
     */
    static async calculateRiskScore(companyId: string) {
        // Factors:
        // - Aging Bucket (> 60 days ratio)
        // - Suspense Ratio (397.01 / 102.01)
        // - Return Rate (Avg from P&L)

        const suspenseAccount = await (prisma as any).account.findFirst({
            where: { companyId, code: '397.01' }
        });
        const bankAccount = await (prisma as any).account.findFirst({
            where: { companyId, code: '102.01' }
        });

        const suspenseAmt = Math.abs(Number(suspenseAccount?.balance || 0));
        const bankAmt = Number(bankAccount?.balance || 1); // Avoid div by zero

        const suspenseRatio = (suspenseAmt / bankAmt); // High is bad

        // P&L Return Rate
        const pnls = await (prisma as any).marketplaceProductPnl.findMany({
            where: { companyId }
        });
        const avgReturnRate = pnls.length > 0
            ? pnls.reduce((acc: number, p: any) => acc + (p.refundCount / (p.saleCount || 1)), 0) / pnls.length
            : 0;

        // Score 0-100 (100 is best)
        let score = 100;
        score -= (suspenseRatio * 50); // Mismatch penalty
        score -= (avgReturnRate * 200); // Return penalty

        return Math.max(0, Math.min(100, Math.round(score)));
    }
}
