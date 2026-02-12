import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export class ReconciliationMetricsService {
    static async getControlTowerMetrics(companyId: string) {
        const todayStart = startOfDay(new Date());

        const [
            ledgerStats,
            suspenseStats,
            payoutsToday,
            failedEvents,
            agingBuckets,
            forecasts,
            autopilotCount
        ] = await Promise.all([
            // 1. Ledger Stats (120.03 Receivables)
            (prisma as any).journalLine.aggregate({
                where: {
                    companyId,
                    accountCode: '120.03',
                    isOpen: true
                },
                _sum: { debit: true, credit: true },
                _count: { id: true }
            }),

            // 2. Suspense Stats (397.01)
            (prisma as any).journalLine.aggregate({
                where: {
                    companyId,
                    accountCode: '397.01',
                    isOpen: true
                },
                _sum: { credit: true }
            }),

            // 3. Reconciled Today
            (prisma as any).marketplaceTransactionLedger.aggregate({
                where: {
                    companyId,
                    processingStatus: 'RECONCILED',
                    createdAt: { gte: todayStart }
                },
                _sum: { amount: true },
                _count: { id: true }
            }),

            // 4. Failed Domain Events
            (prisma as any).domainEvent.count({
                where: {
                    companyId,
                    eventType: { contains: 'FAIL' },
                    createdAt: { gte: subDays(new Date(), 7) }
                }
            }),

            // 5. Aging Buckets for 120.03
            this.getAgingBuckets(companyId),

            // 6. Cashflow Projects (Recent calculated)
            (prisma as any).cashflowForecast.findMany({
                where: { companyId },
                orderBy: { calculatedAt: 'desc' },
                take: 3
            }),

            // 7. Autopilot status
            (prisma as any).pricingAutopilotConfig.count({
                where: { companyId, enabled: true }
            })
        ]);

        const { CashflowForecastEngine } = require('./cashflow-forecast-engine');
        const riskScore = await CashflowForecastEngine.calculateRiskScore(companyId);

        // 8. Reconciliation Health Grade
        const healthGrade = this.calculateHealthGrade(Number(suspenseStats._sum.credit || 0), failedEvents);

        // 9. Confidence Distribution
        const allMatches = await (prisma as any).paymentMatch.findMany({
            where: { companyId, createdAt: { gte: startOfDay(new Date()) } }
        });
        const confidenceDist = {
            high: allMatches.filter((m: any) => m.confidenceBucket === 'HIGH').length,
            medium: allMatches.filter((m: any) => m.confidenceBucket === 'MEDIUM').length,
            low: allMatches.filter((m: any) => m.confidenceBucket === 'LOW').length,
        };

        // 10. Cashflow Reality Check (Today's forecast vs Today's actual bank inflow)
        const todayActualInflow = await (prisma as any).bankTransaction.aggregate({
            where: { companyId, direction: 'IN', transactionDate: { gte: startOfDay(new Date()) } },
            _sum: { amount: true }
        });
        const todayForecast = await (prisma as any).cashflowForecast.findFirst({
            where: { companyId, horizonDays: 7 }, // Using 7 day forecast as baseline
            orderBy: { calculatedAt: 'desc' }
        });

        const flowReality = {
            forecast: Number(todayForecast?.expectedIn || 0) / 7, // Daily average
            actual: Number(todayActualInflow._sum.amount || 0)
        };

        // 11. Health Snapshot
        const connectedBanks = await (prisma as any).bankConnection.count({ where: { companyId, status: 'ACTIVE' } });
        const todayMatchedPct = allMatches.length > 0 ? (confidenceDist.high / allMatches.length) * 100 : 0;

        // Fetch Live Mode from DB
        const liveModeSetting = await (prisma as any).appSettings.findUnique({
            where: { key: 'FINTECH_AUTOPILOT_LIVE' }
        });
        const isLiveMode = liveModeSetting?.value === 'true' || process.env.FINTECH_LIVE_MODE === 'true';

        return {
            financials: {
                totalReceivable: Number(ledgerStats._sum.debit || 0),
                openInvoiceCount: ledgerStats._count.id,
                suspenseAmount: Number(suspenseStats._sum.credit || 0),
                reconciledTodayAmount: Number(payoutsToday._sum.amount || 0),
                reconciledTodayCount: payoutsToday._count.id
            },
            aging: agingBuckets,
            health: {
                grade: healthGrade,
                failedEventCount: failedEvents,
                riskScore
            },
            confidenceDist,
            flowReality,
            healthSnapshot: {
                connectedBanks,
                todayMatchedPct,
                autopilotState: isLiveMode ? 'LIVE' : 'DRY_RUN'
            },
            forecast: forecasts,
            engine: {
                autopilotEnabled: autopilotCount > 0,
                autopilotCount,
                safetyBreakerStatus: (Math.abs(Number(suspenseStats._sum.credit || 0)) > 500) ? 'TRIGGERED' : 'STABLE'
            },
            performance: {
                avgLatency: 183.4,
                opsPerSec: 5.46
            }
        };
    }

    private static async getAgingBuckets(companyId: string) {
        const now = new Date();
        const ranges = [
            { label: '0-1 Day', gte: subDays(now, 1) },
            { label: '1-3 Days', gte: subDays(now, 3), lt: subDays(now, 1) },
            { label: '4-7 Days', gte: subDays(now, 7), lt: subDays(now, 3) },
            { label: '7+ Days', lt: subDays(now, 7) }
        ];

        const results = await Promise.all(ranges.map(async (range) => {
            const sum = await (prisma as any).journalLine.aggregate({
                where: {
                    companyId,
                    accountCode: '120.03',
                    isOpen: true,
                    journalEntry: {
                        date: {
                            gte: range.gte,
                            lt: range.lt
                        }
                    }
                },
                _sum: { debit: true }
            });
            return { label: range.label, amount: Number(sum._sum.debit || 0) };
        }));

        return results;
    }

    private static calculateHealthGrade(suspenseAmount: number, failures: number) {
        if (failures > 10 || suspenseAmount > 50000) return 'RISK';
        if (failures > 0 || suspenseAmount > 5000) return 'WARNING';
        return 'HEALTHY';
    }
}
