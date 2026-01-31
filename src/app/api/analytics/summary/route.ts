import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateInventoryValueFIFO } from '@/lib/inventory';

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

        // 4. Products & Inventory Value
        const products = await prisma.product.findMany({
            where: { ...whereClause, deletedAt: null },
            select: { id: true, buyPrice: true }
        });

        let totalStockValue = 0;
        let totalStockCount = 0;

        for (const p of products) {
            const stockItems = await prisma.stock.findMany({
                where: { productId: p.id, ...(whereClause.branch ? { branch: whereClause.branch } : {}) }
            });

            const qty = stockItems.reduce((sum, s) => sum + s.quantity, 0);
            totalStockCount += qty;

            // Simplified FIFO for summary performance: 
            // In a production app with 10k items, we'd cache this or use a single query.
            // For now, we'll use our FIFO utility if qty > 0.
            if (qty > 0) {
                const branchesToSum = whereClause.branch ? [whereClause.branch] : stockItems.map(s => s.branch);
                for (const b of branchesToSum) {
                    const val = await calculateInventoryValueFIFO(p.id, b);
                    totalStockValue += val;
                }
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
