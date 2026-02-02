import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

/**
 * E-Fatura/e-Arşiv/e-İrsaliye Gönderme API (Nilvera Only)
 * POST /api/integrations/send
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { invoiceId, type = 'invoice' } = body;

        if (!invoiceId) {
            return NextResponse.json({
                success: false,
                error: 'Fatura ID gerekli'
            }, { status: 400 });
        }

        // Get invoice from database
        const invoice = await (prisma as any).salesInvoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true
            }
        });

        if (!invoice) {
            return NextResponse.json({
                success: false,
                error: 'Fatura bulunamadı'
            }, { status: 404 });
        }

        // Get Nilvera settings from AppSettings
        const settingsRecord = await prisma.appSettings.findUnique({
            where: { key: 'eFaturaSettings' }
        });

        const rawConfig = settingsRecord?.value as any;
        // Config yapısı bazen direkt root'ta bazen 'nilvera' altında olabilir.
        const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});

        if (!config || !config.apiKey) {
            return NextResponse.json({
                success: false,
                error: 'Nilvera entegrasyonu yapılandırılmamış. Lütfen Ayarlar > Entegrasyonlar sayfasından Nilvera API bilgilerini girin.'
            }, { status: 400 });
        }

        const nilvera = new NilveraService({
            apiKey: config.apiKey,
            environment: config.environment || 'test',
            username: config.username,
            password: config.password
        });

        // Check if customer is e-Invoice user
        const customerVkn = invoice.customer.taxNumber || invoice.customer.identityNumber;
        if (!customerVkn) {
            return NextResponse.json({
                success: false,
                error: 'Müşteri VKN/TCKN bilgisi eksik'
            }, { status: 400 });
        }

        // Nilvera: vkn 10 haneli olmalı, şahıs ise TCKN 11 haneli.
        // Basit bir kontrol yapabiliriz veya direkt göndeririz.

        let isEInvoiceUser = false;
        let customerAlias = "";
        try {
            const userCheck = await nilvera.checkUser(customerVkn);
            isEInvoiceUser = userCheck.isEInvoiceUser;
            customerAlias = userCheck.alias || "";
        } catch (checkErr) {
            console.warn('User check failed, defaulting to e-Archive', checkErr);
            isEInvoiceUser = false;
        }

        // Prepare invoice data (Nilvera expects PascalCase)
        const invoiceItems = Array.isArray(invoice.items) ? invoice.items : JSON.parse(JSON.stringify(invoice.items || []));

        // Determine scenario
        const scenario = isEInvoiceUser ? "TEMELFATURA" : "EARSIVFATURA";

        const invoiceData = {
            InvoiceNumber: "", // Boş bırakıyoruz, Nilvera/GİB atayacak
            UUID: crypto.randomUUID(), // Zorunlu: Her belge için benzersiz UUID
            InvoiceDate: new Date(invoice.invoiceDate).toISOString().split('.')[0], // Milisaniyeleri temizle (YYYY-MM-DDTHH:mm:ss)
            CurrencyCode: invoice.currency || 'TRY',
            InvoiceType: "SATIS", // Varsayılan Satış Faturası
            InvoiceScenario: scenario, // Senaryo (TEMEL/EARSIV)
            PaymentType: "EFT/HAVALE", // Varsayılan Ödeme Tipi (Zorunlu olabilir)
            Note: invoice.description || 'Fatura',
            Receiver: {
                // Şahıs (11 hane) ise Ad/Soyad ayrılmalı, Kurum (10 hane) ise Unvan (Name) kullanılmalı
                Name: customerVkn.length === 10 ? invoice.customer.name : undefined,
                FirstName: customerVkn.length === 11 ? (invoice.customer.name.split(' ').slice(0, -1).join(' ') || invoice.customer.name) : undefined,
                FamilyName: customerVkn.length === 11 ? invoice.customer.name.split(' ').slice(-1).join(' ') : undefined,

                TaxNumber: customerVkn,
                TaxOffice: invoice.customer.taxOffice || '',
                Address: invoice.customer.address || 'Adres bilgisi girilmemis',
                City: invoice.customer.city || 'ISTANBUL',
                District: invoice.customer.district || 'MERKEZ',
                Country: 'TURKIYE',
                Email: invoice.customer.email || '',
                Phone: invoice.customer.phone || '',
                // E-Fatura için Alias zorunlu (yoksa default)
                Alias: isEInvoiceUser ? (customerAlias || "urn:mail:defaultpk@gib.gov.tr") : undefined
            },
            Lines: invoiceItems.map((item: any) => {
                const qty = Number(item.qty || item.quantity || 1);
                const price = Number(item.price || item.unitPrice || 0);
                const vatRate = Number(item.vat || item.vatRate || 20);
                const discount = Number(item.discount || 0);

                // Vergi Hesabı
                const totalAmount = qty * price; // brüt (indirim hariç) - basitleştirilmiş
                // Not: Eğer indirim varsa matrah düşer ama şimdilik basit tutalım
                const vatAmount = (totalAmount * vatRate) / 100;

                return {
                    Name: item.name || item.productName || 'Urun',
                    Quantity: qty,
                    UnitCode: "C62", // Adet
                    UnitPrice: price,
                    Taxes: [
                        {
                            TaxCode: "0015", // KDV
                            Rate: vatRate,
                            Amount: Number(vatAmount.toFixed(2))
                        }
                    ],
                    DiscountAmount: discount
                };
            })
        };

        let result;
        if (type === 'despatch') {
            // e-İrsaliye
            result = await nilvera.sendDespatch(invoiceData);
        } else {
            // e-Fatura or e-Arşiv
            // sendInvoice metodu (data, type) alıyor. sendEArchive yok.
            const invoiceType = isEInvoiceUser ? 'EFATURA' : 'EARSIV';
            result = await nilvera.sendInvoice(invoiceData, invoiceType);
        }

        if (result.success) {
            const uuid = result.formalId; // Service returns formalId
            // Update invoice with formal ID
            await (prisma as any).salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    isFormal: true,
                    formalType: type === 'despatch' ? 'EIRSALIYE' : (isEInvoiceUser ? 'EFATURA' : 'EARSIV'),
                    formalId: uuid, // UUID'yi buraya, GIB numarasını başka yere kaydedebiliriz ama şimdilik UUID önemli
                    formalUuid: uuid,
                    formalStatus: 'SENT'
                }
            });

            return NextResponse.json({
                success: true,
                message: `${isEInvoiceUser ? 'e-Fatura' : 'e-Arşiv'} başarıyla gönderildi`,
                uuid: uuid,
                type: isEInvoiceUser ? 'E_FATURA' : 'E_ARSIV'
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error || 'Gönderim başarısız'
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('E-Fatura gönderim hatası:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Sunucu hatası'
        }, { status: 500 });
    }
}
