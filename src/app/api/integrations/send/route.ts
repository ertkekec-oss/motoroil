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
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({
                success: false,
                error: 'Fatura bulunamadı'
            }, { status: 404 });
        }

        // Get Nilvera settings
        const settings = await (prisma as any).integrationSettings.findFirst({
            where: { type: 'efatura' }
        });

        if (!settings || !settings.config?.apiKey) {
            return NextResponse.json({
                success: false,
                error: 'Nilvera entegrasyonu yapılandırılmamış. Lütfen Ayarlar > Entegrasyonlar sayfasından Nilvera API bilgilerini girin.'
            }, { status: 400 });
        }

        const config = settings.config;
        const nilvera = new NilveraService({
            apiKey: config.apiKey,
            apiSecret: config.apiSecret,
            environment: config.environment || 'test',
            companyVkn: config.companyVkn,
            companyTitle: config.companyTitle
        });

        // Check if customer is e-Invoice user
        const customerVkn = invoice.customer.taxNumber || invoice.customer.identityNumber;
        if (!customerVkn) {
            return NextResponse.json({
                success: false,
                error: 'Müşteri VKN/TCKN bilgisi eksik'
            }, { status: 400 });
        }

        const userCheck = await nilvera.checkUser(customerVkn);
        const isEInvoiceUser = userCheck.IsEInvoiceUser;

        // Prepare invoice data
        const invoiceData = {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.date,
            customer: {
                name: invoice.customer.name,
                taxNumber: customerVkn,
                taxOffice: invoice.customer.taxOffice || 'Bilinmiyor',
                address: invoice.customer.address || 'Adres bilgisi yok',
                city: invoice.customer.city || '',
                district: invoice.customer.district || '',
                country: 'Türkiye'
            },
            items: invoice.items.map((item: any) => ({
                name: item.product?.name || item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                vatRate: item.vatRate || 20,
                discount: item.discount || 0
            })),
            notes: invoice.notes || '',
            currency: invoice.currency || 'TRY'
        };

        let result;
        if (type === 'despatch') {
            // e-İrsaliye
            result = await nilvera.sendDespatch(invoiceData);
        } else {
            // e-Fatura or e-Arşiv
            if (isEInvoiceUser) {
                result = await nilvera.sendInvoice(invoiceData);
            } else {
                result = await nilvera.sendEArchive(invoiceData);
            }
        }

        if (result.success) {
            // Update invoice with formal ID
            await (prisma as any).salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    formalType: isEInvoiceUser ? 'E_FATURA' : 'E_ARSIV',
                    formalId: result.uuid,
                    formalDate: new Date(),
                    status: 'FORMALIZED'
                }
            });

            return NextResponse.json({
                success: true,
                message: `${isEInvoiceUser ? 'e-Fatura' : 'e-Arşiv'} başarıyla gönderildi`,
                uuid: result.uuid,
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
