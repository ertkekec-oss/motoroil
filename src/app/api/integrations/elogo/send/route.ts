
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ELogoService } from '@/lib/elogo';
import { NilveraService } from '@/lib/nilvera';
import { generateUBL, generateUBLDespatch } from '@/lib/ubl-generator';
import { authorize } from '@/lib/auth';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { invoiceId, type } = body; // type: 'EFATURA', 'EARSIV', 'EIRSALIYE'

        if (!invoiceId || !type) {
            return NextResponse.json({ success: false, error: 'invoiceId ve type gereklidir.' }, { status: 400 });
        }

        // 1. Fetch Invoice Details
        const invoice = await prisma.salesInvoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true }
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı.' }, { status: 404 });
        }

        // 2. Fetch e-Fatura Settings
        const settingsRes = await prisma.appSettings.findUnique({ where: { key: 'eFaturaSettings' } });
        if (!settingsRes) {
            return NextResponse.json({ success: false, error: 'E-Fatura ayarları bulunamadı. Lütfen ayarlardan sağlayıcı seçin.' }, { status: 400 });
        }
        const settings = settingsRes.value as any;
        const provider = settings.provider || 'elogo';

        // 3. Fetch Company Info (Supplier)
        const companyInfoRes = await prisma.appSettings.findUnique({ where: { key: 'company_info' } });
        const companyInfo = companyInfoRes?.value as any || { name: 'Periodya Garaj', address: 'Istanbul', taxNumber: '1111111111' };

        const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : (invoice.items as any[]);

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];

        let result;

        if (provider === 'elogo') {
            const logoService = new ELogoService({
                username: settings.elogoUsername,
                pass: settings.elogoPass,
                isTest: settings.environment === 'test'
            });

            if (type === 'EFATURA' || type === 'EARSIV') {
                let finalType = type;
                if (invoice.customer?.taxNumber) {
                    const check = await logoService.checkEInvoiceUser(invoice.customer.taxNumber);
                    finalType = check.isEInvoice ? 'EFATURA' : 'EARSIV';
                }

                const ubl = generateUBL({
                    date: dateStr,
                    time: timeStr,
                    typeCode: '380',
                    currency: 'TRY',
                    customer: {
                        name: invoice.customer?.name || 'Perakende Müşteri',
                        taxNumber: invoice.customer?.taxNumber || '11111111111',
                        taxOffice: invoice.customer?.taxOffice || '',
                        address: invoice.customer?.address || 'Türkiye'
                    },
                    supplier: {
                        name: companyInfo.name,
                        taxNumber: companyInfo.taxNumber || settings.companyVkn || '1111111111',
                        taxOffice: companyInfo.taxOffice || '',
                        address: companyInfo.address || 'Türkiye'
                    },
                    items: items.map((it: any) => ({
                        name: it.name || it.productName || 'Hizmet/Ürün',
                        qty: Number(it.qty || 1),
                        price: Number(it.price || 0),
                        vatRate: Number(it.vat || 20)
                    }))
                });

                const binaryData = Buffer.from(ubl).toString('base64');
                result = await logoService.sendDocument(binaryData, finalType as 'EFATURA' | 'EARSIV');
                if (result.success) result.finalType = finalType;
            } else if (type === 'EIRSALIYE') {
                const ubl = generateUBLDespatch({
                    date: dateStr,
                    time: timeStr,
                    customer: {
                        name: invoice.customer?.name || 'Perakende Müşteri',
                        taxNumber: invoice.customer?.taxNumber || '11111111111',
                        address: invoice.customer?.address || 'Türkiye'
                    },
                    supplier: {
                        name: companyInfo.name,
                        taxNumber: companyInfo.taxNumber || settings.companyVkn || '1111111111',
                        address: companyInfo.address || 'Türkiye'
                    },
                    items: items.map((it: any) => ({
                        name: it.name || it.productName || 'Hizmet/Ürün',
                        qty: Number(it.qty || 1)
                    }))
                });

                const binaryData = Buffer.from(ubl).toString('base64');
                result = await logoService.sendDespatch(binaryData);
                if (result.success) result.finalType = 'EIRSALIYE';
            }
        } else if (provider === 'nilvera') {
            const nilveraService = new NilveraService({
                apiKey: settings.apiKey,
                environment: settings.environment
            });

            if (type === 'EFATURA' || type === 'EARSIV') {
                let finalType = type;
                if (invoice.customer?.taxNumber) {
                    const check = await nilveraService.checkUser(invoice.customer.taxNumber);
                    finalType = check.isEInvoiceUser ? 'EFATURA' : 'EARSIV';
                }

                // Map to Nilvera Model
                const nilveraModel = {
                    InvoiceInfo: {
                        IssueDate: dateStr,
                        IssueTime: timeStr,
                        InvoiceType: "SATIS",
                        InvoiceProfile: finalType === 'EFATURA' ? "TEMELFATURA" : "EARSIVFATURA",
                        CurrencyCode: "TRY"
                    },
                    CompanyInfo: {
                        Name: companyInfo.name,
                        TaxNumber: companyInfo.taxNumber || settings.companyVkn,
                        TaxOffice: companyInfo.taxOffice || '',
                        Address: companyInfo.address || ''
                    },
                    CustomerInfo: {
                        Name: invoice.customer?.name || 'Perakende Müşteri',
                        TaxNumber: invoice.customer?.taxNumber || '11111111111',
                        TaxOffice: invoice.customer?.taxOffice || '',
                        Address: invoice.customer?.address || ''
                    },
                    InvoiceLines: items.map((it: any, idx: number) => {
                        const vatRate = Number(it.vat || it.vatRate || 20);
                        return {
                            Index: idx + 1,
                            Name: it.name || it.productName || 'Hizmet/Ürün',
                            Quantity: Number(it.qty || 1),
                            UnitCode: it.unit || "NIU",
                            UnitPrice: Number(it.price || 0),
                            VatRate: vatRate,
                            TaxExemptionReasonCode: vatRate === 0 ? "351" : "" // 351: KDV İstisna
                        };
                    }),
                    Notes: [invoice.description || '']
                };

                result = await nilveraService.sendInvoice(nilveraModel, finalType as 'EFATURA' | 'EARSIV');
                if (result.success) result.finalType = finalType;
            } else if (type === 'EIRSALIYE') {
                const nilveraModel = {
                    DespatchInfo: {
                        IssueDate: dateStr,
                        IssueTime: timeStr,
                        DespatchType: "SEVK",
                        DespatchProfile: "TEMELIRSALIYE",
                        CurrencyCode: "TRY"
                    },
                    CompanyInfo: {
                        Name: companyInfo.name,
                        TaxNumber: companyInfo.taxNumber || settings.companyVkn,
                        Address: companyInfo.address || ''
                    },
                    CustomerInfo: {
                        Name: invoice.customer?.name || 'Perakende Müşteri',
                        TaxNumber: invoice.customer?.taxNumber || '11111111111',
                        Address: invoice.customer?.address || ''
                    },
                    DespatchLines: items.map((it: any, idx: number) => ({
                        Index: idx + 1,
                        Name: it.name || it.productName || 'Hizmet/Ürün',
                        Quantity: Number(it.qty || 1),
                        UnitCode: it.unit || "NIU"
                    }))
                };

                result = await nilveraService.sendDespatch(nilveraModel);
                if (result.success) result.finalType = 'EIRSALIYE';
            }
        }

        if (result?.success) {
            await prisma.salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    isFormal: true,
                    formalType: result.finalType,
                    formalId: result.formalId,
                    formalStatus: 'SENT',
                    status: (result.finalType === 'EIRSALIYE' ? 'İrsaliye Kesildi' : 'Resmileştirildi')
                } as any
            });
            return NextResponse.json({ success: true, formalId: result.formalId });
        } else {
            return NextResponse.json({ success: false, error: result?.error || 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Invoice Send Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
