import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NilveraInvoiceService } from '@/services/nilveraService';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        const companyId = session.user?.companyId || session.companyId;

        if (!companyId) return NextResponse.json({ error: 'Firma ID bulunamadı' }, { status: 400 });

        // 1. Get Local Invoices
        const localInvoices = await prisma.purchaseInvoice.findMany({
            where: { companyId },
            include: { supplier: true },
            orderBy: { invoiceDate: 'desc' }
        });

        // 2. Try to fetch from Nilvera
        let nilveraInvoices: any[] = [];
        try {
            const settingsRecord = await prisma.appSettings.findUnique({
                where: {
                    companyId_key: {
                        companyId,
                        key: 'eFaturaSettings'
                    }
                }
            });
            const rawConfig = settingsRecord?.value as any;

            // Supporting both flat and nested config structures
            const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});

            if (config.apiKey) {
                console.log("[PurchasingList] Fetching from Nilvera with API Key...");
                const nilvera = new NilveraInvoiceService({
                    apiKey: config.apiKey,
                    baseUrl: config.environment === 'production' ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com'
                });

                const result = await nilvera.getIncomingInvoices();
                console.log("[PurchasingList] Nilvera Result Success:", result.success);

                if (result.success) {
                    const content = result.data?.Content || (Array.isArray(result.data) ? result.data : []);
                    console.log("[PurchasingList] Received Items Count:", content.length);

                    nilveraInvoices = content.map((inv: any) => ({
                        id: inv.UUID || inv.Id,
                        supplier: inv.SupplierName || inv.SupplierTitle || inv.SupplierVknTckn || "Bilinmeyen Tedarikçi",
                        date: inv.IssueDate ? new Date(inv.IssueDate).toLocaleDateString('tr-TR') : '-',
                        msg: `e-Fatura: ${inv.InvoiceNumber || 'No Yok'}`,
                        total: Number(inv.PayableAmount || 0),
                        status: 'Bekliyor',
                        isFormal: true,
                        invoiceNo: inv.InvoiceNumber
                    }));
                } else {
                    console.error("[PurchasingList] Nilvera Error:", result.error);
                }
            } else {
                console.warn("[PurchasingList] Nilvera API Key is missing in settings.");
            }
        } catch (nilErr: any) {
            console.error("[PurchasingList] Nilvera fetch CRITICAL failure:", nilErr.message);
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
            const dateA = new Date(a.date.split('.').reverse().join('-')).getTime();
            const dateB = new Date(b.date.split('.').reverse().join('-')).getTime();
            return dateB - dateA;
        });

        return NextResponse.json({ success: true, invoices: combined });
    } catch (error: any) {
        console.error("[PurchasingList] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
