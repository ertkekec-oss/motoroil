
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';
import { calculateUpsellSignal } from '@/lib/upsell-engine';

export async function GET(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);

        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // 1. Fatura Hacmi (Bu Ay vs Geçen Ay)
        const companies = await (prisma as any).company.findMany({
            where: { tenantId: ctx.tenantId },
            select: { id: true }
        });
        const companyIds = companies.map((c: any) => c.id);

        const [thisMonthDocs, lastMonthDocs] = await Promise.all([
            (prisma as any).salesInvoice.count({
                where: {
                    companyId: { in: companyIds },
                    createdAt: { gte: startOfThisMonth }
                }
            }),
            (prisma as any).salesInvoice.count({
                where: {
                    companyId: { in: companyIds },
                    createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
                }
            })
        ]);

        const docGrowth = lastMonthDocs > 0
            ? Math.round(((thisMonthDocs - lastMonthDocs) / lastMonthDocs) * 100)
            : 0;

        // 2. En Çok İşlem Yapılan Saatler (Peak Times)
        const recentInvoices = await (prisma as any).salesInvoice.findMany({
            where: { companyId: { in: companyIds } },
            take: 100,
            select: { createdAt: true }
        });

        const hourMap: Record<number, number> = {};
        recentInvoices.forEach((inv: any) => {
            const hour = new Date(inv.createdAt).getHours();
            hourMap[hour] = (hourMap[hour] || 0) + 1;
        });

        const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '10';

        // 3. Kullanılmayan Özellikler (Onboarding Insight)
        const hasFormalDocs = await (prisma as any).salesInvoice.findFirst({
            where: { companyId: { in: companyIds }, isFormal: true }
        });

        // 4. HAFTALIK TREND (Hızlı Bakış)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklyInvoices = await (prisma as any).salesInvoice.findMany({
            where: {
                companyId: { in: companyIds },
                createdAt: { gte: sevenDaysAgo }
            },
            select: { totalAmount: true, createdAt: true, items: true }
        });

        const weeklyTrendMap: Record<string, number> = {};
        const categoryMap: Record<string, number> = {};

        // Fill empty days for trend
        for (let i = 0; i < 7; i++) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            weeklyTrendMap[d.toLocaleDateString('tr-TR', { weekday: 'short' })] = 0;
        }

        weeklyInvoices.forEach((inv: any) => {
            const dayKey = new Date(inv.createdAt).toLocaleDateString('tr-TR', { weekday: 'short' });
            if (weeklyTrendMap[dayKey] !== undefined) {
                weeklyTrendMap[dayKey] += Number(inv.totalAmount);
            }

            // Category aggregation from JSON items
            try {
                const items = JSON.parse(inv.items as string);
                if (Array.isArray(items)) {
                    items.forEach((item: any) => {
                        const cat = item.category || 'Diğer';
                        categoryMap[cat] = (categoryMap[cat] || 0) + (Number(item.price) * (item.qty || 1));
                    });
                }
            } catch (e) {
                // Handle non-string items if Prisma returns object directly
                if (Array.isArray(inv.items)) {
                    inv.items.forEach((item: any) => {
                        const cat = item.category || 'Diğer';
                        categoryMap[cat] = (categoryMap[cat] || 0) + (Number(item.price) * (item.qty || 1));
                    });
                }
            }
        });

        const weeklyTrend = Object.entries(weeklyTrendMap)
            .map(([name, value]) => ({ name, value }))
            .reverse();

        const categoryAnalysis = Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // 5. FORECASTING (Basit Tahminleme)
        // Son 4 haftalık ortalamayı baz al
        const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        const lastFourWeeksRevenue = await (prisma as any).salesInvoice.aggregate({
            where: {
                companyId: { in: companyIds },
                createdAt: { gte: fourWeeksAgo }
            },
            _sum: { totalAmount: true }
        });

        const avgWeeklyRevenue = Number(lastFourWeeksRevenue._sum?.totalAmount || 0) / 4;
        const forecast = {
            nextWeekRevenue: Math.round(avgWeeklyRevenue),
            confidence: lastFourWeeksRevenue._sum?.totalAmount ? 85 : 0 // Basit bir skor
        };

        const insights = [];

        // Insight generation logic
        if (thisMonthDocs > 5 && docGrowth > 10) {
            insights.push({
                type: 'growth',
                title: 'İşleriniz Büyüyor! 📈',
                message: `Bu ay kestdiğiniz fatura sayısı geçen aya göre %${docGrowth} arttı. Performansınız harika!`,
                severity: 'success'
            });
        }

        // New forecast insight
        if (forecast.nextWeekRevenue > 0) {
            insights.push({
                type: 'predictive',
                title: 'Gelecek Hafta Tahmini 🔮',
                message: `Geçmiş verilerinize dayanarak önümüzdeki hafta yaklaşık ₺${forecast.nextWeekRevenue.toLocaleString()} ciro bekliyoruz.`,
                severity: 'info'
            });
        }

        if (!hasFormalDocs) {
            insights.push({
                type: 'onboarding',
                title: 'E-Fatura\'ya Geçin 📄',
                message: 'Henüz resmî fatura kesmediniz. Nilvera entegrasyonu ile saniyeler içinde e-fatura gönderebilirsiniz.',
                cta: 'Entegrasyonu Tamamla',
                href: '/settings'
            });
        }

        // 6. Billing & Upsell Insight (v2)
        const upsellSignal = await calculateUpsellSignal(ctx.tenantId, 'DASHBOARD');

        if (upsellSignal?.shouldTrigger) {
            insights.push({
                type: 'billing',
                title: upsellSignal.priority >= 8 ? 'Kapasite Artırımı! 🚀' : 'İşinizi Büyütün 📈',
                message: upsellSignal.message,
                cta: upsellSignal.cta,
                href: `/billing?target=${upsellSignal.targetPlanId}&source=dashboard`,
                severity: upsellSignal.priority >= 8 ? 'error' : 'warning'
            });
        }

        // Log the impression (optional, but requested in 5. Log)
        // Note: For now we'll log it on display in the frontend for cleaner tracking.

        insights.push({
            type: 'activity',
            title: 'Verimlilik Saati ⏰',
            message: `İstatistiklerinize göre en verimli saatiniz öğleden önce ${peakHour}:00 civarı görünüyor.`,
            severity: 'info'
        });

        return NextResponse.json({
            stats: {
                thisMonthDocs,
                lastMonthDocs,
                docGrowth,
                peakHour,
                weeklyTrend,
                categoryAnalysis,
                forecast
            },
            insights,
            upsellSignal // Adding to response for logging/conversion tracking
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
