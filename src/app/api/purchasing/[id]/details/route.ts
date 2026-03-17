import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NilveraInvoiceService } from '@/services/nilveraService';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const id = params.id;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        const companyId = session.user?.companyId || session.companyId;

        let apiKey = '';
        let baseUrl = '';

        const intSettings = await (prisma as any).integratorSettings.findFirst({
            where: { companyId, isActive: true }
        });

        if (intSettings?.credentials) {
            try {
                const { decrypt } = await import('@/lib/encryption');
                const creds = JSON.parse(decrypt(intSettings.credentials));
                apiKey = (creds.apiKey || creds.ApiKey || '').trim();
                baseUrl = (intSettings.environment === 'PRODUCTION')
                    ? 'https://api.nilvera.com'
                    : 'https://apitest.nilvera.com';
            } catch (e) { }
        }

        if (!apiKey) {
            const settingsRecord = await prisma.appSettings.findUnique({
                where: { companyId_key: { companyId, key: 'eFaturaSettings' } }
            });
            const rawConfig = settingsRecord?.value as any;
            const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});
            apiKey = config?.apiKey;
            baseUrl = config?.environment === 'production' ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';
        }

        if (!apiKey) return NextResponse.json({ error: 'Nilvera ayarları bulunamadı' }, { status: 400 });

        const nilvera = new NilveraInvoiceService({
            apiKey,
            baseUrl: baseUrl || 'https://apitest.nilvera.com'
        });

        const type = new URL(req.url).searchParams.get('type');
        let result: any = null;

        if (type === 'DESPATCH') {
            result = await nilvera.getDespatchDetails(id);
        } else {
            result = await nilvera.getInvoiceDetails(id);
            if (!result.success) {
               result = await nilvera.getDespatchDetails(id);
            }
        }

        if (!result || !result.success) {
            return NextResponse.json({ error: result?.error || 'Bulunamadı' }, { status: 404 });
        }

        const data = result.data;
        let items: any[] = [];
        
        let nilveraLines = [];
        if (data.EDespatch?.DespatchLines) nilveraLines = data.EDespatch.DespatchLines;
        else if (data.DespatchLines) nilveraLines = data.DespatchLines;
        else if (data.InvoiceLines) nilveraLines = data.InvoiceLines;
        else if (data.Model?.DespatchLines) nilveraLines = data.Model.DespatchLines;
        else if (data.Model?.InvoiceLines) nilveraLines = data.Model.InvoiceLines;

        // Map and check DB
        for (const line of nilveraLines) {
            const productName = line.Name || line.Description || "Bilinmeyen Ürün";
            const productCode = line.SellerItemCode || line.BuyerItemCode || line.ItemCode || line.Name || productName;
            const buyPrice = Number(line.UnitPrice || line.Price || line.Amount || 0);

            const product = await prisma.product.findFirst({
                where: {
                    companyId,
                    OR: [
                        { code: String(productCode) },
                        { name: String(productName) }
                    ]
                }
            });

            items.push({
                productName,
                productCode,
                buyPrice,
                vatRate: Number(line.VatRate || line.KDVPercent || line.TaxPercent || 0),
                qty: Number(line.Quantity || line.InvoicedQuantity || line.DeliveredQuantity || 0),
                isNew: !product,
                productId: product?.id || null
            });
        }
        let isReturnInvoice = false;
        
        // Detect if this is an IADE profile invoice (e-Fatura or e-Arşiv)
        if (data.InvoiceProfile === 'IADE' || data.Model?.InvoiceProfile === 'IADE') {
            isReturnInvoice = true;
        }

        return NextResponse.json({ success: true, items, isReturnInvoice });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
