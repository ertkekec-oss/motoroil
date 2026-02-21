
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
            },
            checks: {
                orderBy: { dueDate: 'desc' }
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
        ...dbInvoices
            .filter((inv: any) => inv.status === 'Bekliyor') // Only show pending invoices to avoid duplicates with transactions
            .map((inv: any) => ({
                id: inv.id,
                date: new Date(inv.invoiceDate).toLocaleDateString('tr-TR'),
                rawDate: inv.invoiceDate,
                desc: inv.description || `Fatura: ${inv.invoiceNo}`,
                amount: -inv.totalAmount, // Debt is negative
                type: 'Bekleyen Fatura',
                items: inv.items,
                invoiceNo: inv.invoiceNo,
                color: '#f59e0b', // Orange for pending
                method: inv.invoiceNo
            })),
        ...dbTransactions.map((tr: any) => {
            let trType = 'Düzeltme';
            let trAmount = tr.amount;
            let trColor = tr.amount < 0 ? '#ef4444' : '#10b981';
            let invoiceId = null;

            if (tr.type === 'Purchase') {
                trType = 'Alış';
                trAmount = -Math.abs(Number(tr.amount)); // Purchases are always debt (negative impact on balance)
                trColor = '#ef4444';

                // Try to find matching invoice by invoiceNo in description
                const match = tr.description?.match(/ADA\d+|[A-Z0-9]{3}20\d{2}\d+/); // Improved regex for invoice numbers
                if (match) {
                    const invNo = match[0];
                    const matchedInv = dbInvoices.find((i: any) => i.invoiceNo === invNo);
                    if (matchedInv) invoiceId = matchedInv.id;
                }
            } else if (tr.type === 'Payment') {
                trType = 'Ödeme';
                trAmount = Math.abs(Number(tr.amount)); // Payments are credit (positive impact on balance)
                trColor = '#10b981';
            } else if (tr.type === 'ADJUSTMENT') {
                trType = 'Düzeltme';
                // tr.amount already has signs from handleAdjustment
            }

            return {
                id: tr.id,
                invoiceId: invoiceId,
                date: new Date(tr.date).toLocaleDateString('tr-TR'),
                rawDate: tr.date,
                desc: tr.description || trType,
                amount: trAmount,
                type: trType,
                color: trColor,
                method: tr.kasa?.name || trType
            };
        })
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
