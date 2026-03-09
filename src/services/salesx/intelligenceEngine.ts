import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const dec = (val: number | string | Decimal) => new Decimal(val);

export class SalesXIntelligenceEngine {

    // 2 & 3. Customer Reactivation
    static async detectCustomerReactivation(tenantId: string, companyId: string) {
        // Pseudo logic: find customers with no activity for 45+ days
        // Get 3 oldest inactive customers
        const targetCustomers = await prisma.customer.findMany({
            where: { companyId },
            orderBy: { createdAt: 'asc' }, // In a real app we'd order by lastInvoiceDate
            take: 3
        });

        for (const c of targetCustomers) {
            await prisma.salesXOpportunity.create({
                data: {
                    tenantId, companyId, customerId: c.id,
                    opportunityType: 'REACTIVATION',
                    title: 'Müşteri Uyandırma Fırsatı (Reactivation)',
                    description: `Müşteri uzun süredir sipariş vermiyor. Yeniden aktivasyon için ziyaret edilmesi önerilir. (Son Ziyaret: 100+ Gün)`,
                    potentialValue: dec(4500),
                    priorityScore: 85
                }
            });

            await prisma.salesXInsight.create({
                data: {
                    tenantId, companyId,
                    type: 'OPPORTUNITY', category: 'REACTIVATION',
                    title: 'Yeniden Aktivasyon Müşterisi Listeye Düştü',
                    description: `${c.name} için bir yeniden aktivasyon fırsatı yaratıldı.`
                }
            });
        }
    }

    // 4. Upsell Opportunity Detection
    static async detectUpsellOpportunities(tenantId: string, companyId: string) {
        // AI Simulation: Identify what is missing from customer's basket
        const customers = await prisma.customer.findMany({
            where: { companyId },
            take: 2 // get random 2
        });

        for (const c of customers) {
            await prisma.salesXOpportunity.create({
                data: {
                    tenantId, companyId, customerId: c.id,
                    opportunityType: 'UPSELL',
                    title: 'Fren Balatası Upsell Fırsatı',
                    description: `${c.name} sadece Motor Yağı satın alıyor. Fren Balatası öncül ürün olarak çapraz satılabilir.`,
                    potentialValue: dec(12000),
                    priorityScore: 78
                }
            });
        }
    }

    // 5 & 6. Predictive Visit Planning & Priority Score
    static async generatePredictiveVisits(tenantId: string, companyId: string, staffId: string) {
        // Calculate priority score for all active customers
        // Formula: salesPotential (0-40) + purchaseFrequency (0-30) + daysSinceLastVisit (0-30)

        const customers = await prisma.customer.findMany({
            where: { companyId },
            take: 10
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const visits = [];

        for (const c of customers) {
            const score = Math.floor(Math.random() * 40) + 50; // Predict 50 - 90

            if (score > 75) {
                const visit = await prisma.predictiveVisit.create({
                    data: {
                        tenantId, companyId, customerId: c.id, assignedStaffId: staffId,
                        suggestedDate: tomorrow,
                        priorityScore: score,
                        reason: 'Müşterinin sipariş verme frekansı yaklaştı ve yüksek satış potansiyeli mevcut.',
                        status: 'SUGGESTED'
                    }
                });
                visits.push(visit);
            }
        }
        return visits;
    }

    // 8. Route Optimization Suggestion
    static async generateRouteSuggestion(tenantId: string, companyId: string, staffId: string, date: Date) {
        // Find predictive visits for staff on date
        const visits = await prisma.predictiveVisit.findMany({
            where: { companyId, assignedStaffId: staffId, status: 'SUGGESTED' },
            include: { customer: true }
        });

        if (visits.length === 0) return null;

        // Optimization pseudo-logic: Order by priorityScore descending mimicking GPS traveling salesman heuristic
        const optimized = visits.sort((a, b) => b.priorityScore - a.priorityScore);

        const routeData = optimized.map((v, i) => ({
            order: i + 1,
            visitId: v.id,
            customerName: v.customer.name,
            priority: v.priorityScore
        }));

        const totalEst = routeData.length * 15000;

        return prisma.routeSuggestion.create({
            data: {
                tenantId, companyId, staffId,
                planDate: date,
                routeData,
                estimatedValue: dec(totalEst),
                status: 'PENDING'
            }
        });
    }

    // Full Engine Generation for demo/manual trigger
    static async runEngineForSalesX(tenantId: string, companyId: string) {
        await this.detectCustomerReactivation(tenantId, companyId);
        await this.detectUpsellOpportunities(tenantId, companyId);

        // Find a random field staff
        const staff = await prisma.staff.findFirst({
            where: { companyId, role: { in: ['FIELD_SALES', 'SATIC', null] } }
        });

        if (staff) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            await this.generatePredictiveVisits(tenantId, companyId, staff.id);
            await this.generateRouteSuggestion(tenantId, companyId, staff.id, tomorrow);
        }
    }
}
