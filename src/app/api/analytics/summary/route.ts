import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const branch = searchParams.get('branch');
        const scope = searchParams.get('scope') || 'all';

        const whereClause: any = { deletedAt: null };
        if (scope !== 'all' && branch) {
            whereClause.branch = branch;
        }

        // 1. Sales & Revenue
        const transactions = await prisma.transaction.findMany({
            where: {
                ...whereClause,
                type: { in: ['Sales', 'Expense'] }
            }
        });

        const sales = transactions.filter(t => t.type === 'Sales');
        const expenses = transactions.filter(t => t.type === 'Expense');

        const revenue = sales.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        // 2. Customer Balances
        const customerStats = await prisma.customer.aggregate({
            where: { ...whereClause, balance: { gt: 0 } },
            _sum: { balance: true }
        });

        const receivable = Number(customerStats._sum.balance || 0);

        const customerDebtStats = await prisma.customer.aggregate({
            where: { ...whereClause, balance: { lt: 0 } },
            _sum: { balance: true }
        });

        // 3. Supplier Balances
        const supplierStats = await prisma.supplier.aggregate({
            where: { ...whereClause, balance: { lt: 0 } },
            _sum: { balance: true }
        });

        const payable = Math.abs(Number(customerDebtStats._sum.balance || 0)) + Math.abs(Number(supplierStats._sum.balance || 0));

        // 4. OPTIMIZED Inventory Value Calculation
        // Instead of N+1 queries, we use a single aggregation query
        const stockData = await prisma.stock.groupBy({
            by: ['productId', 'branch'],
            where: whereClause.branch ? { branch: whereClause.branch } : {},
            _sum: { quantity: true }
        });

        let totalStockCount = 0;
        let totalStockValue = 0;

        // Batch fetch all products with their buyPrice
        const productIds = stockData.map(s => s.productId);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                deletedAt: null
            },
            select: { id: true, buyPrice: true }
        });

        const productMap = new Map(products.map(p => [p.id, p]));

        // Calculate total stock and approximate value using buyPrice
        // For true FIFO, we'd need a more complex query, but this is a good approximation
        for (const stock of stockData) {
            const qty = stock._sum.quantity || 0;
            totalStockCount += qty;

            const product = productMap.get(stock.productId);
            if (product && qty > 0) {
                // Simplified: Use current buyPrice as approximation
                // For exact FIFO, consider implementing a materialized view or caching strategy
                totalStockValue += qty * Number(product.buyPrice);
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                revenue,
                expenses: totalExpenses,
                receivable,
                payable,
                totalStock: totalStockCount,
                stockValue: totalStockValue
            }
        });

    } catch (error: any) {
        console.error('Analytics Summary API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
