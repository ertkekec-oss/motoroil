
import prisma from './prisma';

export interface UpsellSignal {
    shouldTrigger: boolean;
    type: 'SOFT' | 'CONTEXTUAL' | 'HARD';
    source: string;
    targetPlanId: string | null;
    message: string;
    cta: string;
    priority: number; // 0-10, 10 is highest
}

export async function calculateUpsellSignal(tenantId: string, currentSource: string): Promise<UpsellSignal | null> {
    try {
        const subscription = await (prisma as any).subscription.findUnique({
            where: { tenantId },
            include: {
                plan: {
                    include: { limits: true }
                }
            }
        });

        if (!subscription) return null;

        const currentPlan = subscription.plan;
        const currentPrice = Number(currentPlan.price);

        // 1. Fetch Next Plan
        const nextPlan = await (prisma as any).plan.findFirst({
            where: {
                price: { gt: currentPrice },
                isActive: true
            },
            orderBy: { price: 'asc' }
        });

        if (!nextPlan) return null; // Already at top plan

        // 2. Usage Stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const companies = await (prisma as any).company.findMany({
            where: { tenantId },
            select: { id: true }
        });
        const companyIds = companies.map((c: any) => c.id);

        const monthlyDocsUsage = await (prisma as any).salesInvoice.count({
            where: {
                companyId: { in: companyIds },
                isFormal: true,
                createdAt: { gte: startOfMonth }
            }
        });

        const userUsage = await (prisma as any).user.count({
            where: { tenantId }
        });

        const getLimit = (key: string) => {
            const l = currentPlan.limits.find((l: any) => l.resource === key);
            return l ? l.limit : -1;
        };

        const docLimit = getLimit('monthly_documents');
        const companyLimit = getLimit('companies');
        const userLimit = getLimit('users');

        const docPercent = docLimit > 0 ? (monthlyDocsUsage / docLimit) * 100 : 0;
        const companyPercent = companyLimit > 0 ? (companies.length / companyLimit) * 100 : 0;
        const userPercent = userLimit > 0 ? (userUsage / userLimit) * 100 : 0;

        // 3. Growth Events (Sinayl Matrisi)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const growthEvents = await (prisma as any).growthEvent.findMany({
            where: {
                tenantId,
                createdAt: { gte: sevenDaysAgo }
            }
        });

        const hasGrowthSignal = growthEvents.some((e: any) => e.type === 'GROWTH_SIGNAL');
        const hasLimit80 = growthEvents.some((e: any) => e.type === 'LIMIT_80');

        // --- RULE ENGINE ---

        // RULE: Hard Limit Near (Priority 10)
        if (docPercent >= 95 || companyPercent >= 100 || userPercent >= 100) {
            return {
                shouldTrigger: true,
                type: 'HARD',
                source: currentSource,
                targetPlanId: nextPlan.id,
                message: "Bu iş burada bitmesin! 🚀 Limitlerine dayandın, kesintisiz devam etmek için paketini yükselt.",
                cta: "Paketimi Yükselt",
                priority: 10
            };
        }

        // RULE: Contextual Growth (Priority 8)
        if ((currentSource === 'INVOICE_PAGE' || currentSource === 'REPORT_PAGE') && (docPercent > 80 || hasGrowthSignal)) {
            return {
                shouldTrigger: true,
                type: 'CONTEXTUAL',
                source: currentSource,
                targetPlanId: nextPlan.id,
                message: "Bu ayki büyüme hızın mevcut planın üstünde. Şimdi yükselt, kesintisiz operasyona devam et. 📈",
                cta: "1 Tıkla Yükselt",
                priority: 8
            };
        }

        // RULE: Soft Recommendation (Priority 5)
        if (currentSource === 'DASHBOARD' && (docPercent > 70 || hasLimit80)) {
            // Predict days left (simplified)
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const daysPassed = now.getDate();
            const projectedUsage = (monthlyDocsUsage / daysPassed) * daysInMonth;

            if (projectedUsage > docLimit && docLimit > 0) {
                return {
                    shouldTrigger: true,
                    type: 'SOFT',
                    source: currentSource,
                    targetPlanId: nextPlan.id,
                    message: `Bu hızla gidersen ay sonuna kadar limitlerin dolacak. 🚀 ${nextPlan.name} seni yarı yolda bırakmaz.`,
                    cta: "Planları İncele",
                    priority: 5
                };
            }

            if (hasGrowthSignal) {
                return {
                    shouldTrigger: true,
                    type: 'SOFT',
                    source: currentSource,
                    targetPlanId: nextPlan.id,
                    message: "İşletmen hızla büyüyor! Pro seviyesine geçerek kapasiteni ikiye katla.",
                    cta: "Büyümeye Devam Et",
                    priority: 5
                };
            }
        }

        return null;
    } catch (e) {
        console.error("Upsell engine calculation error:", e);
        return null;
    }
}

export async function logUpsellEvent(data: {
    tenantId: string;
    type: 'SOFT' | 'CONTEXTUAL' | 'HARD';
    source: string;
    targetPlanId: string | null;
    payload?: any;
}) {
    return await (prisma as any).upsellEvent.create({
        data: {
            ...data,
            converted: false
        }
    });
}
