
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import SupplierDetailClient from './SupplierDetailClient';

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: supplierId } = await params;

    const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        include: {
            invoices: {
                orderBy: { invoiceDate: 'desc' }
            },
            transactions: {
                include: {
                    kasa: true
                },
                orderBy: { date: 'desc' }
            }
        }
    });

    if (!supplier) {
        notFound();
    }

    // Prepare history
    const dbInvoices = supplier.invoices || [];
    const dbTransactions = supplier.transactions || [];

    const displayHistory = [
        ...dbInvoices.map((inv: any) => ({
            id: inv.id,
            date: new Date(inv.invoiceDate).toLocaleDateString('tr-TR'),
            rawDate: inv.invoiceDate,
            desc: inv.description || `Fatura: ${inv.invoiceNo}`,
            amount: -inv.totalAmount,
            type: 'Alış',
            items: inv.items,
            invoiceNo: inv.invoiceNo,
            color: '#ef4444',
            method: inv.invoiceNo
        })),
        ...dbTransactions.map((tr: any) => ({
            id: tr.id,
            date: new Date(tr.date).toLocaleDateString('tr-TR'),
            rawDate: tr.date,
            desc: tr.description || (tr.type === 'Payment' ? 'Ödeme' : 'Düzeltme'),
            amount: tr.amount,
            type: tr.type === 'Payment' ? 'Ödeme' : 'Düzeltme',
            color: tr.amount > 0 ? '#10b981' : '#ef4444',
            method: tr.kasa?.name || tr.type
        }))
    ].sort((a, b) => {
        const tA = new Date(a.rawDate).getTime();
        const tB = new Date(b.rawDate).getTime();
        return tB - tA;
    });

    return (
        <SupplierDetailClient
            supplierId={supplierId}
            supplierData={supplier}
            displayHistory={displayHistory}
        />
    );
}
