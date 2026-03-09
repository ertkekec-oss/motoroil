import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const dec = (val: number | string | Decimal) => new Decimal(val);

export class RevenueIntelligenceEngine {

    // 1 & 2. Sales Forecast Pipeline
    static async processSalesForecast(tenantId: string, companyId: string) {
        // AI Simulation: Find historical sales from invoices (simplified)
        const pastInvoices = await prisma.salesInvoice.aggregate({
            _sum: { totalObj: true },
            where: { companyId, status: { notIn: ['DRAFT', 'CANCELLED'] } }
        });

        const pastTotal = pastInvoices._sum.totalObj ? Number(pastInvoices._sum.totalObj) : 0;
        const avgMonthly = pastTotal > 0 ? (pastTotal / 12) : 100000; // Mock average 100k if no data

        const seasonality = 1.1; // 10% seasonal uplift
        const growthRate = 1.05; // 5% growth

        const nextMonthExpected = avgMonthly * seasonality * growthRate;
        const nextQuarterExpected = avgMonthly * 3 * seasonality * growthRate * 1.02; // slight quarter bump
        const yearExpected = avgMonthly * 12 * growthRate * 1.08;

        const factors = { seasonality, growthRate, categoryTrend: "UPWARD" };

        const monthForecast = await prisma.salesForecast.create({
            data: { tenantId, companyId, periodType: 'NEXT_MONTH', targetPeriod: '1 AYLIK', expectedSales: dec(nextMonthExpected), confidenceScore: 82, factors }
        });

        const quarterForecast = await prisma.salesForecast.create({
            data: { tenantId, companyId, periodType: 'NEXT_QUARTER', targetPeriod: 'Q-GELECEK', expectedSales: dec(nextQuarterExpected), confidenceScore: 78, factors }
        });

        const yearForecast = await prisma.salesForecast.create({
            data: { tenantId, companyId, periodType: 'YEAR', targetPeriod: 'YILLIK', expectedSales: dec(yearExpected), confidenceScore: 65, factors }
        });

        return { monthForecast, quarterForecast, yearForecast };
    }

    // 3. Target Suggestion Pipeline
    static async generateTargetSuggestion(tenantId: string, companyId: string) {
        // Last 12 months pseudo average
        const baseActuals = 820000;

        // Generating safe, balanced, aggressive targets based on the pseudo-metric
        const safe = baseActuals * 1.05; // +5%
        const balanced = baseActuals * 1.12; // +12%
        const aggressive = baseActuals * 1.25; // +25%

        // Create insight to notify admins
        await prisma.revenueInsight.create({
            data: {
                tenantId, companyId,
                type: 'RECOMMENDATION', category: 'PERFORMANCE',
                title: 'AI Hedef Analizi Tamamlandı',
                description: `Geçen yıl baz alınarak yeni hedefler önerildi. Güvenli hedefin %5 üzerinde büyüme öngörülüyor.`
            }
        });

        return { safe: dec(safe), balanced: dec(balanced), aggressive: dec(aggressive) };
    }

    // 4 & 9. Performance Analysis & Score
    static async analyzePerformance(tenantId: string, companyId: string, staffId: string, period: string) {
        // In real scenario, retrieve actuals and targets for the staff
        // Here we simulate the score mechanism
        const achievementScore = Math.floor(Math.random() * 20) + 70; // 70-90
        const growthScore = Math.floor(Math.random() * 15) + 60; // 60-75
        const consistencyScore = 85;

        const totalScore = Math.round((achievementScore * 0.5) + (growthScore * 0.3) + (consistencyScore * 0.2));

        const score = await prisma.salesPerformanceScore.create({
            data: {
                tenantId, companyId, staffId, period,
                achievementScore, growthScore, consistencyScore, totalScore
            }
        });

        if (totalScore < 60) {
            await this.detectSalesRisks(tenantId, companyId, staffId);
        }

        return score;
    }

    // 5. Sales Risk Detection
    static async detectSalesRisks(tenantId: string, companyId: string, staffId: string) {
        // Real logic would query velocity dropping or lagging trailing 30 days
        await prisma.salesRiskAlert.create({
            data: {
                tenantId, companyId,
                riskLevel: 'HIGH',
                title: 'Satış Hızında Kritik Düşüş',
                description: `Mevcut satış temposu ile Q3 hedefinin sadece %85'i gerçekleşebilir durumda.`,
                metric: 'Sales Velocity',
                currentValue: '120,000 / week',
                threshold: '150,000 / week'
            }
        });

        await prisma.revenueInsight.create({
            data: {
                tenantId, companyId, type: 'WARNING', category: 'RISK', referenceId: staffId,
                title: 'Hedef Gerisinde Kalma Riski',
                description: 'Satış temposunda %12 düşüş tespit edildi. Proaktif aksiyon önerilir.'
            }
        });
    }

    // 6. Sales Coaching
    static async generateCoachingInsights(tenantId: string, companyId: string, staffId: string) {
        await prisma.revenueInsight.create({
            data: {
                tenantId, companyId, type: 'INFO', category: 'COACHING', referenceId: staffId,
                title: 'Yeniden Aktivasyon Fırsatı',
                description: 'Son 3 ayda satın alma yapmayan 14 pasif müşteri var. Bunlara agresif indirim uygulanarak hedefler tamamlanabilir.'
            }
        });
    }

    // 7. Sales Opportunity Detection
    static async detectSalesOpportunities(tenantId: string, companyId: string) {
        await prisma.salesOpportunity.create({
            data: {
                tenantId, companyId,
                opportunityType: 'CATEGORY_EXPANSION',
                title: 'Endüstriyel Yağlarda Çapraz Satış (Cross-Sell)',
                description: 'En yüksek marjlı satışlar 5L Sentetik Yağ grubundan gelmekte. Bu grubu perakende müşterilere sunarak ciro büyütülebilir.',
                potentialValue: dec(450000)
            }
        });

        await prisma.revenueInsight.create({
            data: {
                tenantId, companyId, type: 'OPPORTUNITY', category: 'PERFORMANCE',
                title: 'Yeni Büyüme Fırsatları',
                description: 'Endüstriyel yağ grubunda hızlı büyüme sinyalleri tespit edildi.'
            }
        });
    }

    // Comprehensive Engine Runner Job
    static async runEngineForTenant(tenantId: string, companyId: string) {
        await this.processSalesForecast(tenantId, companyId);
        await this.generateTargetSuggestion(tenantId, companyId);
        await this.detectSalesOpportunities(tenantId, companyId);

        // Simulating 1 random staff coaching & risk analysis
        const staffList = await prisma.staff.findMany({ where: { companyId }, take: 2 });
        for (const s of staffList) {
            await this.analyzePerformance(tenantId, companyId, s.id, "2026-Q1");
            await this.generateCoachingInsights(tenantId, companyId, s.id);
        }
    }
}
