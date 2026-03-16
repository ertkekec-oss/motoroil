
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { NilveraInvoiceService } from '@/services/nilveraService';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { id } = await context.params;
        const body = await request.json().catch(() => ({}));
        let { skipStockUpdate = false, skipFinanceUpdate = false, pricingConfig = {} } = body;
        const companyId = session.user?.companyId || (session as any).companyId;
        let relatedDespatches: string[] = [];

        // 1. Try to find the invoice locally
        let invoice = await prisma.purchaseInvoice.findFirst({
            where: {
                companyId,
                OR: [{ id: id }, { invoiceNo: id }]
            },
            include: { supplier: true }
        });

        // 1.5 Get Nilvera credentials (we might need them even if invoice exists locally)
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

        // 2. If NOT found locally OR we need to check despatches on an existing invoice, fetch Nilvera
        let fetchedFromNilvera = false;
        let invData = null;

        if (!invoice || (invoice && !skipFinanceUpdate && apiKey)) {
            console.log(`[PurchaseApprove] Invoice ${id} not found locally. Attempting Nilvera import...`);

            if (!invoice) {
                console.log(`[PurchaseApprove] Invoice ${id} not found locally. Attempting Nilvera import...`);
            } else {
                console.log(`[PurchaseApprove] Invoice ${id} found locally. Fetching Nilvera to check related despatches...`);
            }

            if (!apiKey) {
                if (!invoice) {
                    return NextResponse.json({ success: false, error: 'Nilvera API bağlantısı yapılandırılamadı.' }, { status: 400 });
                }
            } else {
                const nilvera = new NilveraInvoiceService({ apiKey, baseUrl });
                let result = await nilvera.getInvoiceDetails(invoice ? invoice.invoiceNo : id); // Use invoiceNo if local, else id

                if (!result.success && !invoice) {
                    console.log(`[PurchaseApprove] Fatura olarak bulunamadı. İrsaliye olarak deneniyor...`);
                    result = await nilvera.getDespatchDetails(id);
                    if (!result.success) {
                        return NextResponse.json({ success: false, error: `Nilvera'dan fatura/irsaliye detayları alınamadı: ${result.error}` }, { status: 404 });
                    }
                }

                if (result.success) {
                    fetchedFromNilvera = true;
                    const rawData = result.data;
                    invData = rawData.EDespatch || rawData.PurchaseInvoice || rawData.Model || rawData.EInvoice || rawData.EArchive || rawData;
                }
            }
        }

        // If we fetched the payload from Nilvera (either new or existing)
        if (fetchedFromNilvera && invData) {
            const rawData = invData; // We already unwrapped it
            const supplierData = invData.Supplier || invData.Seller || invData.DespatchSupplierInfo || invData.SenderInfo || invData.Sender;

            let vkn = supplierData?.TaxNumber || supplierData?.SupplierVknTckn || supplierData?.VknTckn || invData.SupplierVknTckn || invData.SenderVknTckn;
            const name = invData.SenderName || invData.SenderTitle || supplierData?.Name || supplierData?.Title || invData.SupplierName || "Bilinmeyen Tedarikçi";

            // Emergency Fallback: If VKN still missing, try to find it in the rawData root (some summary formats have it)
            if (!vkn) {
                vkn = rawData.SenderVknTckn || rawData.SupplierVknTckn || rawData.TaxNumber;
            }

            const header = invData.DespatchInfo || invData.InvoiceInfo || invData.PurchaseInvoiceInfo || invData;
            const finalInvoiceNo = header.DespatchSerieOrNumber || header.DespatchNumber || header.InvoiceSerieOrNumber || header.InvoiceNumber || invData.InvoiceNumber || id;

            // Re-check by invoiceNo to prevent duplicate import
            const existingLocally = await prisma.purchaseInvoice.findFirst({
                where: { companyId, invoiceNo: finalInvoiceNo },
                include: { supplier: true }
            });

            if (existingLocally) {
                console.log(`[PurchaseApprove] Invoice ${finalInvoiceNo} already exists locally with status ${existingLocally.status}`);
                if (existingLocally.status === 'Onaylandı') {
                    return NextResponse.json({ success: true, message: 'Bu fatura zaten sisteme aktarılmış ve onaylanmış.' });
                }
                invoice = existingLocally;
            }

            if (!invoice) {
                console.log(`[PurchaseApprove] Mapping result: VKN=${vkn}, Name=${name}`);

                if (!vkn) {
                    console.error(`[PurchaseApprove] Missing VKN. invData Keys:`, Object.keys(invData));
                    return NextResponse.json({
                        success: false,
                        error: `Faturada VKN/TCKN bilgisi bulunamadı. Gelen Alanlar: ${Object.keys(invData).join(', ')}`
                    }, { status: 400 });
                }

                // A. Find or Create Supplier
                let supplier = await prisma.supplier.findFirst({
                    where: { companyId, taxNumber: String(vkn) }
                });

                if (!supplier) {
                    console.log(`[PurchaseApprove] Creating new supplier: ${name} (${vkn})`);
                    supplier = await prisma.supplier.create({
                        data: {
                            companyId,
                            name: name,
                            taxNumber: String(vkn),
                            address: supplierData?.Address || '',
                            city: supplierData?.City || '',
                            district: supplierData?.District || '',
                        }
                    });
                }

                // B. Detect Waybill (İrsaliye) integration inherently to prevent stock duplicates
                let hasDespatchRef = false;
                
                // Root references
                if (invData.DespatchDocumentReference) {
                    const refs = Array.isArray(invData.DespatchDocumentReference) ? invData.DespatchDocumentReference : [invData.DespatchDocumentReference];
                    for (const r of refs) {
                        if (r.ID) { hasDespatchRef = true; relatedDespatches.push(r.ID); }
                    }
                }
                if (invData.OrderReference && String(invData.OrderReference.ID || '').toLowerCase().includes('irs')) {
                    hasDespatchRef = true;
                    relatedDespatches.push(invData.OrderReference.ID);
                }
                if (invData.AdditionalDocumentReference) {
                    const refs = Array.isArray(invData.AdditionalDocumentReference) ? invData.AdditionalDocumentReference : [invData.AdditionalDocumentReference];
                    for (const r of refs) {
                        if (r.DocumentType === 'Irsaliye' || r.DocumentType === 'İrsaliye' || r.DocumentTypeCode === 'Despatch') {
                            hasDespatchRef = true;
                            if (r.ID) relatedDespatches.push(r.ID);
                        }
                    }
                }

                // C. Map Items and Prepare Local Invoice Data
                const nilveraLines = invData.DespatchLines || invData.InvoiceLines || invData.Items || invData.Lines || invData.PurchaseInvoiceLines || [];
                console.log(`[PurchaseApprove] Line count: ${nilveraLines.length}`);

                // Line references
                for (const line of nilveraLines) {
                    const desc = String(line.Name || line.Description || line.Note || "");
                    const irsMatch = desc.match(/(?:irsaliye|irs)\s*[:#.-]?\s*([A-Z0-9]{13,16})/i);
                    if (irsMatch) {
                        hasDespatchRef = true;
                        if (!relatedDespatches.includes(irsMatch[1])) {
                            relatedDespatches.push(irsMatch[1]);
                        }
                    }
                }

                if (hasDespatchRef && !invData.DespatchLines && relatedDespatches.length > 0) {
                    // IF it is an Invoice (not a Despatch itself) and we know the related despatches:
                    skipStockUpdate = true;
                    console.log('[PurchaseApprove] 📦 WAYBILL DETECTED in Invoice Payload! Defaulting to skipStockUpdate=true for:', relatedDespatches);
                }

                const localItems = [];
                for (const line of nilveraLines) {
                    const productName = line.Name || line.Description || "Bilinmeyen Ürün";
                    const productCode = line.SellerItemCode || line.BuyerItemCode || line.ItemCode || line.Name || productName;

                    let product = await prisma.product.findFirst({
                        where: {
                            companyId,
                            OR: [
                                { code: String(productCode) },
                                { name: String(productName) }
                            ]
                        }
                    });

                    if (!product) {
                        console.log(`[PurchaseApprove] Product not found, creating: ${productName} (${productCode})`);
                        const defaultPrice = Number(line.UnitPrice || line.Price || 0);
                        const assignedPrice = pricingConfig[productCode] !== undefined 
                            ? Number(pricingConfig[productCode]) 
                            : defaultPrice;

                        product = await prisma.product.create({
                            data: {
                                companyId,
                                name: String(productName),
                                code: String(productCode),
                                stock: 0,
                                buyPrice: defaultPrice,
                                price: assignedPrice, // User assigned sales price or default to buy price
                                unit: line.UnitType || line.UnitCode || "Adet"
                            }
                        });
                    }

                    localItems.push({
                        productId: product?.id || null,
                        name: productName,
                        qty: Number(line.Quantity || line.InvoicedQuantity || line.DeliveredQuantity || 0),
                        price: Number(line.UnitPrice || line.Price || line.Amount || 0),
                        vatRate: Number(line.VatRate || line.KDVPercent || line.TaxPercent || 0),
                        unit: line.UnitType || line.UnitCode || line.DeliveredUnitType || "Adet"
                    });
                }

                // C. Create Local Purchase Invoice Header
                invoice = await prisma.purchaseInvoice.create({
                    data: {
                        companyId,
                        supplierId: supplier.id,
                        invoiceNo: finalInvoiceNo,
                        invoiceDate: header.IssueDate ? new Date(header.IssueDate) : new Date(),
                        amount: Number(header.TaxExclusiveAmount || header.LineExtensionAmount || (header.InvoiceAmount ? (header.InvoiceAmount - (header.TaxAmount || 0)) : 0) || 0),
                        taxAmount: Number((header.TaxInclusiveAmount && header.TaxExclusiveAmount) ? (header.TaxInclusiveAmount - header.TaxExclusiveAmount) : (header.TaxAmount || 0)),
                        totalAmount: Number(header.PayableAmount || header.TaxInclusiveAmount || header.InvoiceAmount || 0),
                        items: localItems as any,
                        status: 'Bekliyor',
                        description: 'Nilvera Sisteminden Aktarıldı'
                    },
                    include: { supplier: true }
                });
            }
        } // End of fetchedFromNilvera processing

        if (!invoice) {
             return NextResponse.json({ success: false, error: 'Fatura bulunamadı ve oluşturulamadı.' }, { status: 404 });
        }

        // 3. Prevent Stock Updates if a related despatch was already approved BEFORE this invoice
        if (relatedDespatches.length > 0 && !skipFinanceUpdate) {
            // Check if any of these despatches are ALREADY approved
            const existingApprovedDespatch = await prisma.purchaseInvoice.findFirst({
                where: {
                    companyId,
                    invoiceNo: { in: relatedDespatches },
                    status: 'Onaylandı'
                }
            });

            if (existingApprovedDespatch) {
                console.log(`[PurchaseApprove] 🛡️ Related Despatch ${existingApprovedDespatch.invoiceNo} is already APPROVED. Skipping stock update for Invoice!`);
                skipStockUpdate = true;
            } else {
                console.log(`[PurchaseApprove] 🔄 Related Despatches exist but none are approved yet. We will update stock via this invoice and auto-close the despatches.`);
                // We MUST update stock via invoice, so we DO NOT skip stock update
                skipStockUpdate = false; 
            }
        }

        // 3. Approval Logic (existing core logic)
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
            const branch = (session.user as any)?.branch || (session as any).branch || 'Merkez';

            if (!skipStockUpdate) {
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
            }

            let transaction = null;
            if (!skipFinanceUpdate) {
                // C. Update Supplier Balance
                await tx.supplier.update({
                    where: { id: invoice!.supplierId },
                    data: { balance: { decrement: Number(invoice!.totalAmount) } }
                });

                // D. Create Financial Transaction
                transaction = await tx.transaction.create({
                    data: {
                        companyId,
                        type: 'Purchase',
                        amount: invoice!.totalAmount,
                        description: `Alış Faturası Onayı: ${invoice!.invoiceNo} - ${invoice!.supplier.name}`,
                        supplierId: invoice!.supplierId,
                        kasaId: null, // Required to be generic payable transaction
                        branch: String(branch)
                    }
                });
            }

            // E. Auto-close related despatches so they don't remain open 
            if (relatedDespatches && relatedDespatches.length > 0) {
                for (const dId of relatedDespatches) {
                    console.log(`[PurchaseApprove] Auto-closing related despatch: ${dId}`);
                    const existingDesp = await tx.purchaseInvoice.findFirst({
                        where: { companyId, invoiceNo: String(dId) }
                    });
                    if (existingDesp) {
                        if (existingDesp.status !== 'Onaylandı') {
                            await tx.purchaseInvoice.update({
                                where: { id: existingDesp.id },
                                data: { status: 'Onaylandı' }
                            });
                        }
                    } else {
                        // Create an empty, pre-approved Despatch marker so it skips "Bekliyor"
                        await tx.purchaseInvoice.create({
                            data: {
                                companyId,
                                supplierId: invoice!.supplierId,
                                invoiceNo: String(dId),
                                invoiceDate: invoice!.invoiceDate || new Date(),
                                amount: 0,
                                taxAmount: 0,
                                totalAmount: 0,
                                items: [],
                                status: 'Onaylandı',
                                description: `Otomatik Kapatıldı (Fatura Ref: ${invoice!.invoiceNo})`
                            }
                        });
                    }
                }
            }

            return { updatedInvoice, transaction };
        });

        // Create Accounting Journal Entry (in background)
        if (resultTransaction.transaction) {
            (async () => {
                try {
                    const { createJournalFromTransaction } = await import('@/lib/accounting');
                    await createJournalFromTransaction(resultTransaction.transaction);
                } catch (err) {
                    console.error('[Muhasebe Entegrasyon Hatası - Alış Kabul]:', err);
                }
            })();
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Fatura kabul edildi ve işlemleri tamamlandı.',
            autoSkippedStock: skipStockUpdate
        });
    } catch (error: any) {
        console.error('Purchase Approve Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
