
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
            },
            checks: {
                orderBy: { dueDate: 'asc' }
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

    const chkList = (customer.checks || []).map((c: any) => {
        const isReceivable = c.type.includes('Alınan');
        return {
            id: c.id,
            date: new Date(c.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            rawDate: c.createdAt,
            type: isReceivable ? 'Tahsilat' : 'Ödeme', // Map to standard types for filter compatibility
            desc: `${isReceivable ? 'Çek Alındı' : 'Çek Verildi'}: ${c.bank} - ${c.number} (${c.status})`,
            amount: isReceivable ? -Number(c.amount) : Number(c.amount), // Receivables reduce balance (Credit), Payables increase (Debit) of supplier... wait.
            // For Customer: 
            // - Receivable (We get check): Reduces their debt. Negative amount.
            // - Payable (We give check): Refund? Positive amount.
            // For now assuming Customer context mainly deals with 'Alınan Çek'.
            color: isReceivable ? '#10b981' : '#ef4444',
            items: null,
            orderId: null,
            isCheck: true // Flag to identify if needed
        };
    });

    // Remove duplicates if Transaction already exists for this check?
    // Transaction description: "Çek Alındı: Bank - No"
    // Check description: "Çek Alındı: Bank - No ..."
    // It's hard to dedup perfectly by text.
    // Ideally we rely on the fact that the Transaction is apparently missing for the user.

    // Merge: `txs`, `invs`, `chkList`.
    // Filter `txs` to remove "Collection" type if it looks like a check transaction?
    // No, let's keep both for now, but `txs` is reportedly missing.

    // Better strategy: Use valid IDs. Transaction IDs start with 'TR-'. Check IDs are CUIDs.
    // If I show both, user sees twice.
    // But user sees NONE now.
    // So showing double is better than none (and I suspect they won't show double if tx is missing).

    const historyList = [...txs, ...invs, ...chkList].sort((a: any, b: any) => {
        const tA = new Date(a.rawDate).getTime();
        const tB = new Date(b.rawDate).getTime();
        return (isNaN(tA) || isNaN(tB)) ? 0 : tB - tA;
    });

    return <CustomerDetailClient customer={customer} historyList={historyList} />;
}
