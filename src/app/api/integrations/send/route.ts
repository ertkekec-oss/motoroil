import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

/**
 * E-Fatura/e-Arşiv Gönderme API (Nilvera UBL Model)
 * POST /api/integrations/send
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { invoiceId, type = 'invoice' } = body;

        if (!invoiceId) {
            return NextResponse.json({ success: false, error: 'Fatura ID gerekli' }, { status: 400 });
        }

        // 1. Faturayı veritabanından çek
        const invoice = await (prisma as any).salesInvoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true }
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });
        }

        // 2. Nilvera ayarlarını çek
        const settingsRecord = await prisma.appSettings.findUnique({ where: { key: 'eFaturaSettings' } });
        const rawConfig = settingsRecord?.value as any;
        const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});

        if (!config || !config.apiKey) {
            return NextResponse.json({ success: false, error: 'Nilvera ayarları eksik.' }, { status: 400 });
        }

        const nilvera = new NilveraService({
            apiKey: config.apiKey,
            environment: config.environment || 'test',
            username: config.username,
            password: config.password
        });

        // 3. Müşteri Kontrolü (E-Fatura Mükellefi mi?)
        const customerVkn = invoice.customer.taxNumber || invoice.customer.identityNumber;
        if (!customerVkn) {
            return NextResponse.json({ success: false, error: 'Müşteri VKN/TCKN bilgisi eksik' }, { status: 400 });
        }

        let isEInvoiceUser = false;
        let customerAlias = "";
        try {
            // E-İrsaliye değilse kontrol et
            if (type !== 'despatch') {
                const userCheck = await nilvera.checkUser(customerVkn);
                isEInvoiceUser = userCheck.isEInvoiceUser;
                customerAlias = userCheck.alias || "";
            }
        } catch (checkErr) {
            console.warn('User check failed', checkErr);
        }

        // 4. Gönderici (Bizim) Bilgileri Al
        let companyInfo = {
            TaxNumber: "1111111111", // Default test
            Name: "Test Firması",
            TaxOffice: "Merkez",
            Address: "Merkez Mah.",
            District: "Merkez",
            City: "Istanbul",
            Country: "Turkiye"
        };
        try {
            // API'den firma bilgilerini çekmeye çalışalım, hata verirse default kullanırız
            const info = await nilvera.getCompanyInfo();
            if (info && info.TaxNumber) {
                companyInfo = {
                    TaxNumber: info.TaxNumber,
                    Name: info.Name || info.Title,
                    TaxOffice: info.TaxOffice || '',
                    Address: info.Address || '',
                    District: info.District || '',
                    City: info.City || '',
                    Country: 'Turkiye'
                };
            }
        } catch (e) {
            console.warn('Firma bilgileri çekilemedi, varsayılanlar/ayarlar kullanılacak', e);
        }

        // 5. Verileri Hazırla (Nilvera Model)
        const invoiceItems = Array.isArray(invoice.items) ? invoice.items : JSON.parse(JSON.stringify(invoice.items || []));

        // Hesaplamalar
        let totalTaxExclusiveAmount = 0;
        let totalTaxAmount = 0;
        let totalPayableAmount = 0; // İndirim düşülmüş

        const invoiceLines = invoiceItems.map((item: any) => {
            const qty = Number(item.qty || item.quantity || 1);
            const price = Number(item.price || item.unitPrice || 0);
            const vatRate = Number(item.vat || item.vatRate || 20);
            const discount = Number(item.discount || 0); // Birim indirim mi toplam mı? Genelde satır toplamı üzerinden düşünelim

            const lineAmount = qty * price; // Brüt
            const allowanceTotal = discount; // Satır indirimi
            const baseAmount = lineAmount - allowanceTotal; // Matrah
            const vatAmount = (baseAmount * vatRate) / 100;

            totalTaxExclusiveAmount += baseAmount;
            totalTaxAmount += vatAmount;

            return {
                Name: item.name || item.productName || 'Urun',
                Quantity: qty,
                UnitType: "C62", // Adet
                Price: price,
                AllowanceTotal: allowanceTotal,
                KDVPercent: vatRate,
                KDVTotal: Number(vatAmount.toFixed(2)),
                Taxes: [
                    {
                        TaxCode: "0015",
                        Total: Number(vatAmount.toFixed(2)),
                        Percent: vatRate
                    }
                ]
            };
        });

        totalPayableAmount = totalTaxExclusiveAmount + totalTaxAmount;

        const uuid = crypto.randomUUID();
        const dateStr = new Date(invoice.invoiceDate).toISOString(); // 2026-02-02T15:17... Z formatı uygun

        // Ortak Model Yapısı
        const modelCore = {
            InvoiceInfo: {
                UUID: uuid,
                InvoiceType: "SATIS",
                InvoiceProfile: isEInvoiceUser ? "TEMELFATURA" : "EARSIVFATURA",
                IssueDate: dateStr,
                CurrencyCode: invoice.currency || 'TRY',
                PayableAmount: Number(totalPayableAmount.toFixed(2)),
                TaxExclusiveAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
                KdvTotal: Number(totalTaxAmount.toFixed(2))
                // PaymentType eklenebilir ama InvoiceInfo içinde PaymentTermsInfo kullanılır genelde
            },
            CompanyInfo: companyInfo,
            CustomerInfo: {
                TaxNumber: customerVkn,
                Name: customerVkn.length === 10 ? invoice.customer.name : undefined, // Kurum
                // Şahıs için Name yerine PersonName/SurName gerekebilir ama Nilvera Name'i de kabul edebilir.
                // Biz yine de şahıs ise Name alanına Tam Adı, veya Name alanına boş verip ExportCustomerInfo gibi davranmayacağız.
                // Standart E-Fatura'da CustomerInfo.Name zorunludur. Şahıslar için Ad Soyad birleşik yazılabilir.
                // Veya PersonName, PersonSurName alanları varsa oraya. Modelde CustomerInfo içinde 'Name' var sadece.
                // O yüzden Name'e tam ad yazıyoruz.
                // Eğer şahıs ise ve Namesiz hata verirse, sadece Name: Ad Soyad birleşik göndereceğiz.
                Address: invoice.customer.address || 'Adres',
                District: invoice.customer.district || 'Merkez',
                City: invoice.customer.city || 'Istanbul',
                Country: 'Turkiye',
                Mail: invoice.customer.email || '',
                Phone: invoice.customer.phone || ''
            },
            InvoiceLines: invoiceLines
        };

        // E-Fatura veya E-Arşiv Root Objeyi Seç
        let finalPayload;
        let endpointType = '';

        if (isEInvoiceUser) {
            // E-FATURA
            endpointType = 'EFATURA';
            finalPayload = {
                EInvoice: modelCore,
                CustomerAlias: customerAlias || "urn:mail:defaultpk@gib.gov.tr"
            };
        } else {
            // E-ARSIV
            endpointType = 'EARSIV';
            finalPayload = {
                ArchiveInvoice: modelCore
                // E-Arşivde CustomerAlias gerekmez
            };
        }

        // Gönder
        const result = await nilvera.sendInvoice(finalPayload, endpointType as any);

        if (result.success) {
            const formalId = result.formalId || uuid;
            await (prisma as any).salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    isFormal: true,
                    formalType: endpointType,
                    formalId: formalId,
                    formalUuid: uuid,
                    formalStatus: 'SENT'
                }
            });

            return NextResponse.json({
                success: true,
                message: `${endpointType} başarıyla kuyruğa eklendi.`,
                uuid: uuid
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error || 'Gönderim başarısız'
            }, { status: 500 }); // Artık raw 400 hatasını clientta validateStatus ile görüyoruz
        }

    } catch (error: any) {
        console.error('Send Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
