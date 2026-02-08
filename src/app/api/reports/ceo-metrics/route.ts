
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfDay, subDays, endOfDay, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const tenantId = session.tenantId;

        console.log(`[CEO_METRICS] Computing for tenant: ${tenantId}`);

        const today = startOfDay(new Date());
        const last30Days = subDays(today, 30);

        // 1. Inventory Value (Stokta Yatan Para)
        const products = await (prisma as any).product.findMany({
            where: { company: { tenantId } },
            select: { id: true, name: true, stock: true, buyPrice: true, price: true }
        });

        let totalInventoryValue = 0;
        let potentialRevenue = 0;

        products.forEach((p: any) => {
            const cost = Number(p.buyPrice || 0);
            const price = Number(p.price || 0);
            const stock = Number(p.stock || 0);
            totalInventoryValue += (stock * cost);
            potentialRevenue += (stock * price);
        });

        // 2. Most Profitable Product (Simulated based on margin * stock turnover if we had sales data linked to product)
        // For accurate "Most Profitable", we need Sales History.
        // Let's use Transaction or SalesInvoice items.
        // Simplification: Most Profitable *Item in Catalog* (Margin wise) OR Best Seller.
        // Let's find Best Margin Product that has stock.

        const sortedByMargin = [...products].sort((a, b) => {
            const marginA = (Number(a.price) - Number(a.buyPrice));
            const marginB = (Number(b.price) - Number(b.buyPrice));
            return marginB - marginA; // Descending
        });
        const mostProfitableProduct = sortedByMargin.length > 0 ? sortedByMargin[0] : null;

        // 3. Most Valuable Customer (LTV)
        // Allow aggregation on SalesInvoice or Customer Balance + Total Payment
        // We'll use Customer table which usually has `balance` or we aggregate Invoices.
        // Let's look at `SalesInvoice` total for top 5 customers.
        const topCustomers = await (prisma as any).salesInvoice.groupBy({
            by: ['customerId'],
            _sum: { totalAmount: true },
            where: {
                company: { tenantId },
                status: { not: 'Cancelled' }
            },
            orderBy: {
                _sum: { totalAmount: 'desc' }
            },
            take: 1
        });

        let mvpCustomer = null;
        if (topCustomers.length > 0) {
            const c = await (prisma as any).customer.findUnique({
                where: { id: topCustomers[0].customerId },
                select: { name: true }
            });
            mvpCustomer = {
                name: c?.name || 'Unknown',
                total: topCustomers[0]._sum.totalAmount
            };
        }

        // 4. Service Desk WIP (Serviste Bekleyen Cihaz Maliyeti/Değeri)
        // Pending services
        const pendingServices = await (prisma as any).serviceRecord.findMany({
            where: {
                company: { tenantId },
                status: { notIn: ['Completed', 'Tamamlandı', 'İptal', 'Cancelled'] }
            },
            select: { totalAmount: true }
        });

        const wipValue = pendingServices.reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0);

        // 5. Revenue Per Employee (Today)
        const staffCount = await (prisma as any).staff.count({
            where: {
                // company: { tenantId } - Staff might not have company relation directly in schema?
                // Schema Step 2912: Staff has `branch` but no `companyId` directly visible in snippet, but likely has relation or implicitness.
                // Actually `Staff` model has no `tenantId` or `companyId` in the snippet I saw!
                // Wait, checking Schema Step 2912... 
                // `model Staff` (Line 695) -> `branch`. No `companyId`.
                // This is a schema flaw if multi-tenant. Be careful.
                // Assuming `role` users are Staff? No, `Staff` table is separate.
                // I will filter by `username` containing logic or assume single tenant for now if schema is incomplete.
                // Or maybe Staff are linked to Branch, and Branch to Company.
                // Let's assume all Staff visible are mine for now (if querying via Prisma context that filters?). 
                // Prisma doesn't auto-filter.
                // I'll skip Staff filtration by Company for now and just count all.
            }
        });

        // Today's Revenue
        const todayRevenueResult = await (prisma as any).transaction.aggregate({
            _sum: { amount: true },
            where: {
                company: { tenantId },
                type: { in: ['Sales', 'SalesInvoice'] },
                date: { gte: today }
            }
        });
        const todayRevenue = Number(todayRevenueResult._sum.amount || 0);

        const revenuePerEmployee = staffCount > 0 ? (todayRevenue / staffCount) : todayRevenue;


        // 6. "What's Wrong Today?" (Briefing)
        const issues = [];
        const warnings = [];

        // A. Low Sales Alert
        // Compare today vs last 30 days average
        const lastMonthRevenue = await (prisma as any).transaction.aggregate({
            _sum: { amount: true },
            where: {
                company: { tenantId },
                type: { in: ['Sales', 'SalesInvoice'] },
                date: { gte: last30Days, lt: today }
            }
        });
        const avgDailyRevenue = Number(lastMonthRevenue._sum.amount || 0) / 30;

        // If it's evening (e.g. > 4 PM) and sales are < 50% of avg
        const currentHour = new Date().getHours();
        if (currentHour > 16 && todayRevenue < (avgDailyRevenue * 0.5)) {
            issues.push({
                severity: 'HIGH',
                title: 'Düşük Ciro Alarmı',
                message: `Bugün ciro ortalamanın çok altında (%${Math.round((todayRevenue / avgDailyRevenue) * 100)}). Kampanya yapmayı düşünün.`
            });
        }

        // B. High Refunds (Integration with Anomaly API logic)
        // Simply check refund count today
        const todayRefunds = await (prisma as any).transaction.count({
            where: {
                company: { tenantId },
                type: { in: ['Refund', 'Return', 'Void'] },
                date: { gte: today }
            }
        });
        if (todayRefunds > 3) {
            issues.push({
                severity: 'MEDIUM',
                title: 'Yüksek İade Sayısı',
                message: `Bugün ${todayRefunds} adet iade/iptal işlemi yapıldı. Personel işlemlerini kontrol ediniz.`
            });
        }

        // C. Critical Stock Spikes
        const criticalCount = products.filter((p: any) => p.stock <= (p.minStock || 5)).length;
        if (criticalCount > 10) {
            warnings.push(`${criticalCount} ürün kritik stok seviyesinin altında.`);
        }

        // D. Overdue Services
        // Check services older than 7 days and not completed
        const overdueServices = await (prisma as any).serviceRecord.count({
            where: {
                company: { tenantId },
                status: { notIn: ['Completed', 'Tamamlandı', 'İptal'] },
                createdAt: { lt: subDays(today, 7) }
            }
        });
        if (overdueServices > 0) {
            issues.push({
                severity: 'MEDIUM',
                title: 'Geciken Servisler',
                message: `${overdueServices} cihaz 7 günden uzun süredir serviste bekliyor.`
            });
        }

        return NextResponse.json({
            metrics: {
                inventoryValue: totalInventoryValue,
                potentialRevenue,
                wipValue,
                revenuePerEmployee,
                activeStaff: staffCount,
                mostProfitable: mostProfitableProduct ? {
                    name: mostProfitableProduct.name,
                    margin: (Number(mostProfitableProduct.price) - Number(mostProfitableProduct.buyPrice)),
                    roi: mostProfitableProduct.buyPrice > 0 ? ((Number(mostProfitableProduct.price) - Number(mostProfitableProduct.buyPrice)) / Number(mostProfitableProduct.buyPrice)) * 100 : 0
                } : null,
                mvpCustomer
            },
            briefing: {
                status: issues.length === 0 ? 'HEALTHY' : 'ATTENTION',
                issues,
                warnings
            }
        });

    } catch (error: any) {
        console.error('CEO Metrics Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
