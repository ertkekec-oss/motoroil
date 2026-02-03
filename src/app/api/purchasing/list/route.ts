import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NilveraInvoiceService } from '@/services/nilveraService';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Get Local Invoices
        const localInvoices = await prisma.purchaseInvoice.findMany({
            include: { supplier: true },
            orderBy: { invoiceDate: 'desc' }
        });

        // 2. Try to fetch from Nilvera
        let nilveraInvoices: any[] = [];
        try {
            const settingsRecord = await prisma.appSettings.findUnique({ where: { key: 'eFaturaSettings' } });
            const config = (settingsRecord?.value as any) || {};

            if (config.apiKey) {
                const nilvera = new NilveraInvoiceService({
                    apiKey: config.apiKey,
                    baseUrl: config.environment === 'production' ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com'
                });

                const result = await nilvera.getIncomingInvoices();
                if (result.success && result.data?.Content) {
                    nilveraInvoices = result.data.Content.map((inv: any) => ({
                        id: inv.UUID,
                        supplier: inv.SupplierName || inv.SupplierVknTckn || "Bilinmeyen Tedarikçi",
                        date: inv.IssueDate ? new Date(inv.IssueDate).toLocaleDateString('tr-TR') : '-',
                        msg: `e-Fatura: ${inv.InvoiceNumber || 'No Yok'}`,
                        total: Number(inv.PayableAmount || 0),
                        status: 'Bekliyor',
                        isFormal: true,
                        invoiceNo: inv.InvoiceNumber
                    }));
                }
            }
        } catch (nilErr) {
            console.error("[PurchasingList] Nilvera fetch failed:", nilErr);
        }

        // Map local to UI format
        const formattedLocal = localInvoices.map(inv => ({
            id: inv.id,
            invoiceNo: inv.invoiceNo,
            supplier: inv.supplier.name,
            date: inv.invoiceDate.toLocaleDateString('tr-TR'),
            msg: inv.description || `${(inv.items as any[])?.length || 0} Kalem Ürün Girişi`,
            total: Number(inv.totalAmount),
            status: inv.status === 'Bekliyor' ? 'Bekliyor' : 'Onaylandı',
            isFormal: false
        }));

        // Combined results
        const combined = [...nilveraInvoices, ...formattedLocal].sort((a, b) => {
            // Sort by date equivalent if possible, otherwise keep order
            return 0; // Simplified for now
        });

        return NextResponse.json({ success: true, invoices: combined });
    } catch (error: any) {
        console.error("[PurchasingList] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
