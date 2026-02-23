
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Fetch Transactions
        const transactions = await (prisma as any).transaction.findMany({
            where: { customerId: id },
            orderBy: { date: 'desc' },
            take: 100
        });

        // Fetch Invoices
        const invoices = await (prisma as any).salesInvoice.findMany({
            where: { customerId: id },
            orderBy: { invoiceDate: 'desc' },
            take: 100
        });

        // Combine and format as a statement
        const statement = [
            ...transactions.map((t: any) => ({
                id: t.id,
                date: t.date,
                description: t.description || (t.type === 'SATIŞ' ? 'Saha Satışı' : 'Tahsilat/Ödeme'),
                amount: Number(t.amount),
                type: t.type === 'SATIŞ' ? 'SALE' : 'PAYMENT',
                direction: t.type === 'SATIŞ' ? 'OUT' : 'IN'
            })),
            ...invoices.map((i: any) => ({
                id: i.id,
                date: i.invoiceDate,
                description: `Fatura: ${i.invoiceNo}`,
                amount: Number(i.totalAmount),
                type: 'INVOICE',
                direction: 'OUT' // Invoice issued
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({ success: true, statement });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
