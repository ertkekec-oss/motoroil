
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { NilveraInvoiceService } from '@/services/nilveraService';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { id } = await context.params;
        const companyId = session.user?.companyId || (session as any).companyId;

        // 1. Try to find the invoice locally
        let invoice = await prisma.purchaseInvoice.findFirst({
            where: {
                companyId,
                OR: [{ id: id }, { invoiceNo: id }]
            },
            include: { supplier: true }
        });

        // 2. If NOT found locally, try to fetch from Nilvera and import
        if (!invoice) {
            console.log(`[PurchaseApprove] Invoice ${id} not found locally. Attempting Nilvera import...`);

            // Get Nilvera credentials
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
                    baseUrl = (intSettings.environment === 'PRODUCTION') ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';
                } catch (e) {
                    console.warn('[PurchaseApprove] Failed to decrypt integratorSettings');
                }
            }

            if (!apiKey) {
                const settingsRecord = await prisma.appSettings.findUnique({
                    where: { companyId_key: { companyId, key: 'eFaturaSettings' } }
                });
                const raw = (settingsRecord?.value as any) || {};
                const config = raw.apiKey ? raw : (raw.nilvera || {});
                apiKey = (config.apiKey || '').trim();
                baseUrl = (config.environment === 'production') ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';
            }

            if (!apiKey) {
                return NextResponse.json({ success: false, error: 'Nilvera API bağlantısı yapılandırılamadı.' }, { status: 400 });
            }

            const nilvera = new NilveraInvoiceService({ apiKey, baseUrl });
            const result = await nilvera.getInvoiceDetails(id); // Using the UUID

            if (!result.success) {
                return NextResponse.json({ success: false, error: `Nilvera'dan fatura detayları alınamadı: ${result.error}` }, { status: 404 });
            }

            // DYNAMIC STRUCTURE MAPPING
            // Nilvera can return the object directly or wrapped in "PurchaseInvoice" or similar
            const rawData = result.data;
            const invData = rawData.PurchaseInvoice || rawData.Model || rawData.EInvoice || rawData;

            const supplierData = invData.Supplier || invData.Seller || invData.DespatchSupplierInfo || invData.SenderInfo;
            const vkn = supplierData?.TaxNumber || supplierData?.SupplierVknTckn || supplierData?.VknTckn || invData.SupplierVknTckn;
            const name = invData.SenderName || invData.SenderTitle || supplierData?.Name || supplierData?.Title || invData.SupplierName || "Bilinmeyen Tedarikçi";

            if (!vkn) {
                return NextResponse.json({ success: false, error: 'Faturada VKN/TCKN bilgisi bulunamadı.' }, { status: 400 });
            }

            // A. Find or Create Supplier
            let supplier = await prisma.supplier.findFirst({
                where: { companyId, taxNumber: vkn }
            });

            if (!supplier) {
                console.log(`[PurchaseApprove] Creating new supplier: ${name} (${vkn})`);
                supplier = await prisma.supplier.create({
                    data: {
                        companyId,
                        name: name,
                        taxNumber: vkn,
                        address: supplierData?.Address || '',
                        city: supplierData?.City || '',
                        district: supplierData?.District || '',
                    }
                });
            }

            // B. Map Items and Prepare Local Invoice Data
            const nilveraLines = invData.InvoiceLines || invData.Items || invData.Lines || invData.PurchaseInvoiceLines || [];
            const localItems = [];

            for (const line of nilveraLines) {
                const productName = line.Name || line.Description || "Bilinmeyen Ürün";
                const productCode = line.SellerItemCode || line.BuyerItemCode || line.ItemCode || line.Name;

                let product = await prisma.product.findFirst({
                    where: {
                        companyId,
                        OR: [
                            { code: productCode },
                            { name: productName }
                        ]
                    }
                });

                localItems.push({
                    productId: product?.id || null,
                    name: productName,
                    qty: Number(line.Quantity || line.InvoicedQuantity || 0),
                    price: Number(line.UnitPrice || line.Price || line.Amount || 0),
                    vatRate: Number(line.VatRate || line.KDVPercent || line.TaxPercent || 0),
                    unit: line.UnitType || line.UnitCode || "Adet"
                });
            }

            // C. Create Local Purchase Invoice Header
            const header = invData.InvoiceInfo || invData.PurchaseInvoiceInfo || invData;
            invoice = await prisma.purchaseInvoice.create({
                data: {
                    companyId,
                    supplierId: supplier.id,
                    invoiceNo: header.InvoiceSerieOrNumber || header.InvoiceNumber || invData.InvoiceNumber || id,
                    invoiceDate: header.IssueDate ? new Date(header.IssueDate) : new Date(),
                    amount: Number(header.TaxExclusiveAmount || header.LineExtensionAmount || (header.InvoiceAmount - (header.TaxAmount || 0)) || 0),
                    taxAmount: Number(header.TaxInclusiveAmount - header.TaxExclusiveAmount || header.TaxAmount || 0),
                    totalAmount: Number(header.PayableAmount || header.TaxInclusiveAmount || header.InvoiceAmount || 0),
                    items: localItems as any,
                    status: 'Bekliyor',
                    description: 'Nilvera Sisteminden Aktarıldı'
                },
                include: { supplier: true }
            });
        }

        // 3. Approval Logic (existing core logic but simplified)
        if (invoice.status === 'Onaylandı') {
            return NextResponse.json({ success: false, error: 'Bu fatura zaten onaylanmış.' }, { status: 400 });
        }

        const resultTransaction = await prisma.$transaction(async (tx) => {
            // A. Mark as Approved
            const updatedInvoice = await tx.purchaseInvoice.update({
                where: { id: invoice!.id },
                data: { status: 'Onaylandı' }
            });

            // B. Update Stocks & Record Movements
            const items = invoice!.items as any[];
            const branch = session.branch || 'Merkez';

            for (const item of items) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { increment: item.qty },
                            buyPrice: item.price
                        }
                    });

                    await tx.stock.upsert({
                        where: { productId_branch: { productId: item.productId, branch: String(branch) } },
                        update: { quantity: { increment: item.qty } },
                        create: { productId: item.productId, branch: String(branch), quantity: item.qty }
                    });

                    await (tx as any).stockMovement.create({
                        data: {
                            productId: item.productId,
                            branch: String(branch),
                            companyId,
                            quantity: item.qty,
                            price: item.price,
                            type: 'PURCHASE',
                            referenceId: invoice!.id
                        }
                    });
                }
            }

            // C. Update Supplier Balance (Subtracting from balance means increasing debt usually, but matches current logic)
            await tx.supplier.update({
                where: { id: invoice!.supplierId },
                data: { balance: { decrement: Number(invoice!.totalAmount) } }
            });

            // D. Create Financial Transaction
            const transaction = await tx.transaction.create({
                data: {
                    companyId,
                    type: 'Purchase',
                    amount: invoice!.totalAmount,
                    description: `Alış Faturası Onayı: ${invoice!.invoiceNo} - ${invoice!.supplier.name}`,
                    supplierId: invoice!.supplierId,
                    branch: String(branch)
                }
            });

            return { updatedInvoice, transaction };
        });

        return NextResponse.json({ success: true, message: 'Fatura kabul edildi, tedarikçi kaydedildi ve stoklara işlendi.' });
    } catch (error: any) {
        console.error('Purchase Approve Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
