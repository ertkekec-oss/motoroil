import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getRequestContext, assertCompanyAccess, assertSubscriptionIsActive, featureGate, quotaGate } from '@/lib/api-context';
import { withIdempotency } from '@/lib/idempotency';
import { createNilveraClient } from '@/lib/nilvera';

function generateGIBInvoiceNo(prefix: string) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const timePart = now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
    const randomPart = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `${prefix}${year}${timePart}${randomPart}`;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Context ve Güvenlik (Golden Template Adım 1 & 2)
        const ctx = await getRequestContext(req);
        await assertCompanyAccess(ctx.userId, ctx.companyId);

        // 1.2 Abonelik Kontrolü (Hard Lock)
        await assertSubscriptionIsActive(ctx.tenantId);

        // 1.5 Feature Gate (Golden Template Adım 1.5)
        // Bu özellik sadece 'e_invoice' yetkisi olan planlarda çalışır.
        await featureGate(ctx as any, 'e_invoice');
        await quotaGate(ctx as any, 'monthly_documents');

        const body = await req.json();
        const { invoiceId } = body;

        // 2. Fatura Verisini Güvenli Şekilde Çek (İzolasyon)
        // Sadece ilgili companyId'ye ait fatura çekilebilir.
        const invoice = await (prisma as any).salesInvoice.findFirst({
            where: {
                id: invoiceId,
                companyId: ctx.companyId
            },
            include: { customer: true }
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı veya erişim yetkiniz yok.' }, { status: 404 });
        }

        // 3. Dinamik Entegratör İstemcisi Oluştur (Golden Template Adım 3)
        // DB'den şifreli ayarları çözer ve ilgili firma için client oluşturur.
        const nilvera = await createNilveraClient(ctx.companyId);

        // --- Mevcut İş Mantığı (Payload Hazırlama) ---
        const customerVkn = (invoice.customer.taxNumber || "").trim();

        // Firma Bilgilerini Nilvera'dan Çek (Cachelenebilir ama şimdilik doğrudan çekiyoruz)
        let companyInfo: any = { TaxNumber: "1111111111", Name: "Firma", Address: "Adres", District: "Merkez", City: "Istanbul", Country: "Turkiye" };
        try {
            const info = await nilvera.getCompanyInfo();
            if (info) {
                companyInfo = {
                    TaxNumber: info.TaxNumber,
                    Name: info.Name || info.Title || "Firma",
                    Address: info.Address || "Adres",
                    District: info.District || "Merkez",
                    City: info.City || "Istanbul",
                    Country: info.Country || "Turkiye"
                };
            }
        } catch (e) {
            console.warn("Firma bilgileri Nilvera'dan çekilemedi, varsayılanlar kullanılacak.", e);
        }

        async function attemptSending(isEInvoice: boolean, alias?: string) {
            const prefix = isEInvoice ? "EFT" : "ARS";
            const invoiceNo = generateGIBInvoiceNo(prefix);
            const uuid = crypto.randomUUID();

            const invoiceItems = Array.isArray(invoice.items) ? invoice.items : [];
            let totalTaxExclusiveAmount = 0;
            let totalTaxAmount = 0;
            let totalKdv20 = 0;

            const invoiceLines = invoiceItems.map((item: any, idx: number) => {
                const qty = Number(item.qty || 1);
                const price = Number(item.price || 0);
                const vatRate = Number(item.vat || 20);
                const discount = Number(item.discount || 0);
                const base = (qty * price) - discount;
                const vat = (base * vatRate) / 100;
                totalTaxExclusiveAmount += base;
                totalTaxAmount += vat;
                if (vatRate === 20) totalKdv20 += vat;

                return {
                    Index: (idx + 1).toString(),
                    Name: item.name || 'Urun',
                    Quantity: qty,
                    UnitType: "C62",
                    Price: price,
                    AllowanceTotal: discount,
                    KDVPercent: vatRate,
                    KDVTotal: Number(vat.toFixed(2)),
                    Taxes: [{ TaxCode: "0015", Total: Number(vat.toFixed(2)), Percent: vatRate }]
                };
            });

            const invoiceInfo: any = {
                UUID: uuid,
                CustomizationID: "TR1.2",
                InvoiceType: "SATIS",
                InvoiceSerieOrNumber: invoiceNo,
                IssueDate: new Date(invoice.invoiceDate || invoice.createdAt).toISOString(),
                CurrencyCode: "TRY",
                LineExtensionAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
                KdvTotal: Number(totalTaxAmount.toFixed(2)),
                PayableAmount: Number((totalTaxExclusiveAmount + totalTaxAmount).toFixed(2)),
                GeneralKDV20Total: Number(totalKdv20.toFixed(2)),
                GeneralAllowanceTotal: 0
            };

            if (isEInvoice) {
                invoiceInfo.InvoiceProfile = "TICARIFATURA";
            } else {
                invoiceInfo.InvoiceProfile = "EARSIVFATURA";
                invoiceInfo.SalesPlatform = "NORMAL";
                invoiceInfo.SendType = "ELEKTRONIK";
                invoiceInfo.ISDespatch = false;
            }

            const payload = {
                InvoiceInfo: invoiceInfo,
                CompanyInfo: companyInfo,
                CustomerInfo: {
                    TaxNumber: customerVkn,
                    Name: invoice.customer.name,
                    Address: invoice.customer.address || "Adres",
                    District: invoice.customer.district || "Merkez",
                    City: invoice.customer.city || "Istanbul",
                    Country: "Turkiye"
                },
                InvoiceLines: invoiceLines,
                Notes: [invoice.description || "Fatura"]
            };

            if (isEInvoice) {
                return await nilvera.sendInvoice({ EInvoice: payload, CustomerAlias: alias }, 'EFATURA');
            } else {
                return await nilvera.sendInvoice({ ArchiveInvoice: payload }, 'EARSIV');
            }
        }

        // Idempotency Key: Fatura ID'si değişmediği sürece aynı işlem tekrarlanmaz
        const idempotencyKey = `formal_send_${invoiceId}`;

        // 4. Güvenli ve Idempotent Gönderim (Golden Template Adım 4)
        // withIdempotency, bu işlemi sarar ve çifte gönderimi engeller.
        const result = await withIdempotency(prisma, idempotencyKey, 'SALES_INVOICE', ctx.companyId, async () => {
            // Mükellef Kontrolü
            let userCheck = await nilvera.checkUser(customerVkn);
            let isEInvoice = userCheck.isEInvoiceUser;
            let alias = userCheck.alias;

            // Retry logic would go here ideally, but for now we rely on the single attempt
            // In a more advanced version, attemptSending can have retry built-in.

            let sendResult = await attemptSending(isEInvoice, alias);

            // Hata Yönetimi ve Retry (422 hatası alınırsa senaryo değişikliği) - Bu business logic retry'dir
            if (!sendResult.success && sendResult.errorCode === 422) {
                isEInvoice = !isEInvoice; // Tersi dene
                if (isEInvoice) {
                    const retry = await nilvera.checkUser(customerVkn);
                    alias = retry.alias;
                    if (!alias) {
                        throw new Error('Müşteri e-Fatura mükellefi ama alias bulunamadı.');
                    }
                }
                sendResult = await attemptSending(isEInvoice, alias);
            }

            if (!sendResult.success) {
                let errMsg = sendResult.error || 'Fatura gönderilemedi.';
                if (sendResult.errorCode === 401) errMsg = 'Nilvera API Yetkilendirme Hatası.';
                throw new Error(errMsg);
            }

            return {
                success: true,
                formalId: sendResult.formalId,
                message: 'Başarıyla gönderildi.'
            };
        });

        // 5. Sonuç Kaydı (Idempotency zaten sonucu döndü ama yerel SalesInvoice update'i de yapalım)
        // Not: withIdempotency zaten başarılı ise buraya gelir.
        // Eğer zaten önceden yapılmışsa 'result.source' = 'CACHE' olur.
        // SalesInvoice durumunu güncellemek idempotency katmanından bağımsız olarak her zaman güvenlidir (idempotenttir).
        if (result.success) {
            await prisma.salesInvoice.update({
                where: { id: invoiceId },
                data: { isFormal: true, formalStatus: 'SENT', formalUuid: result.formalId }
            });
            return NextResponse.json({ ...result, source: 'API' });
        } else {
            // Should be unreachable if withIdempotency throws on error
            return NextResponse.json({ success: false, error: "Bilinmeyen hata" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("API Error [formal-invoice-send]:", error);

        let status = 500;
        let msg = error.message || 'Internal Server Error';

        if (msg.includes('UNAUTHORIZED')) status = 401;
        else if (msg.includes('FORBIDDEN')) status = 403;
        else if (msg.includes('QUOTA_EXCEEDED')) status = 403; // Quota errors are forbidden to proceed
        else if (msg.includes('SUBSCRIPTION_INACTIVE')) status = 402; // Payment Required
        else if (msg.includes('REQUEST_ALREADY_PROCESSING')) status = 409; // Conflict

        return NextResponse.json({ success: false, error: msg }, { status });
    }
}
