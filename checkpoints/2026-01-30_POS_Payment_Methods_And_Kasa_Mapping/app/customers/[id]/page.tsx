
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CustomerDetailClient from './CustomerDetailClient';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            category: true,
            transactions: {
                orderBy: { date: 'desc' }
            },
            invoices: {
                orderBy: { invoiceDate: 'desc' }
            },
            warranties: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!customer) {
        notFound();
    }

    // Prepare history data on server to keep client component clean and fast
    const txs = (customer.transactions || [])
        .filter((t: any) => t.type !== 'SalesInvoice') // Fatura listesinde zaten var, mükerrer gösterme
        .map((t: any) => {
            const isCollection = (t.type === 'income' || t.type === 'Collection');
            const typeLabel = isCollection ? 'Tahsilat' :
                t.type === 'Payment' ? 'Ödeme' :
                    t.type === 'Sales' ? 'Satış' :
                        t.type === 'Expense' ? 'Gider' : t.type;

            // Extract Order REF and clean description
            let orderId = null;
            let displayDesc = t.description || '';
            if (displayDesc.includes('| REF:')) {
                const parts = displayDesc.split('| REF:');
                displayDesc = parts[0].trim();
                orderId = parts[1]?.trim();
            }

            return {
                id: t.id,
                date: new Date(t.date).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                rawDate: t.date,
                type: typeLabel,
                desc: displayDesc,
                amount: isCollection ? -(t.amount || 0) : (t.amount || 0),
                color: isCollection ? '#10b981' : (t.type === 'Payment' ? '#3b82f6' : (t.type === 'Sales' ? '#10b981' : '#ef4444')),
                items: null,
                orderId: orderId
            };
        });

    const invs = (customer.invoices || []).map((inv: any) => {
        let safeItems = [];
        try {
            safeItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : (Array.isArray(inv.items) ? inv.items : []);
        } catch { safeItems = []; }

        return {
            id: inv.id,
            date: new Date(inv.invoiceDate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            rawDate: inv.invoiceDate,
            type: 'Fatura',
            desc: `${inv.invoiceNo} - ${inv.isFormal ? 'Resmi' : 'Taslak'}`,
            amount: (inv.totalAmount || 0),
            color: '#3b82f6',
            items: safeItems
        };
    });

    const historyList = [...txs, ...invs].sort((a: any, b: any) => {
        const tA = new Date(a.rawDate).getTime();
        const tB = new Date(b.rawDate).getTime();
        return (isNaN(tA) || isNaN(tB)) ? 0 : tB - tA;
    });

    return <CustomerDetailClient customer={customer} historyList={historyList} />;
}
