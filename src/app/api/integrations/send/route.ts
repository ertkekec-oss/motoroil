import { NextRequest, NextResponse } from 'next/server';
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
        try {
            const userCheck = await nilvera.checkUser(customerVkn);
            isEInvoiceUser = userCheck.isEInvoiceUser; // Case-sensitive fix
        } catch (checkErr) {
            console.warn('User check failed, defaulting to e-Archive', checkErr);
            isEInvoiceUser = false; // Hata durumunda e-Arşiv varsayalım (Test ortamında checkUser bazen hata verebilir)
        }

        // Prepare invoice data
        // Items JSON array: [{ name, qty, price, ... }]
        const invoiceItems = Array.isArray(invoice.items) ? invoice.items : JSON.parse(JSON.stringify(invoice.items || []));

        const invoiceData = {
            invoiceNumber: invoice.invoiceNo, // Schema: invoiceNo
            invoiceDate: invoice.invoiceDate, // Schema: invoiceDate
            customer: {
                name: invoice.customer.name,
                taxNumber: customerVkn,
                taxOffice: invoice.customer.taxOffice || 'Bilinmiyor',
                address: invoice.customer.address || 'Adres bilgisi yok',
                city: invoice.customer.city || 'Istanbul', // Zorunlu alan olabilir
                district: invoice.customer.district || 'Merkez',
                country: 'Türkiye',
                email: invoice.customer.email,
                phone: invoice.customer.phone
            },
            items: invoiceItems.map((item: any) => ({
                name: item.name || item.productName || 'Ürün',
                quantity: Number(item.qty || item.quantity || 1),
                unitPrice: Number(item.price || item.unitPrice || 0),
                vatRate: Number(item.vat || item.vatRate || 20),
                discount: Number(item.discount || 0),
                unitType: 'C62' // Adet (Varsayılan)
            })),
            notes: invoice.description || '',
            currency: 'TRY'
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
