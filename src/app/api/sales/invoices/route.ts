import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { NilveraService } from '@/lib/nilvera';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateGIBInvoiceNo(prefix: string) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const timePart = now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
    const randomPart = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `${prefix}${year}${timePart}${randomPart}`;
}

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const branch = searchParams.get('branch');

        const where: any = { deletedAt: null };
        if (branch && branch !== 'Tümü' && branch !== 'all') {
            where.branch = branch;
        }

        const invoices = await prisma.salesInvoice.findMany({
            where,
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });

        const safeInvoices = invoices.map(inv => ({
            ...inv,
            isFormal: inv.isFormal && ((inv as any).formalId && (inv as any).formalId.length > 5)
        }));

        return NextResponse.json({ success: true, invoices: safeInvoices });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const body = await request.json();
        const { action, invoiceId } = body;

        // HIJACKING FOR PROXY BYPASS: Send Formal Invoice
        if (action === 'formal-send' && invoiceId) {
            const invoice = await (prisma as any).salesInvoice.findUnique({
                where: { id: invoiceId },
                include: { customer: true }
            });

            if (!invoice) return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });

            const settingsRecord = await prisma.appSettings.findUnique({ where: { key: 'eFaturaSettings' } });
            const rawConfig = settingsRecord?.value as any;
            const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});

            const nilvera = new NilveraService({
                apiKey: config.apiKey,
                baseUrl: config.apiUrl,
                environment: config.environment || 'test'
            });

            const customerVkn = (invoice.customer.taxNumber || invoice.customer.identityNumber || "").trim();

            async function attemptSending(isEInvoice: boolean, alias?: string) {
                const prefix = isEInvoice ? "EFT" : "ARS";
                const invNo = generateGIBInvoiceNo(prefix);
                const payload = {
                    InvoiceInfo: {
                        UUID: crypto.randomUUID(),
                        CustomizationID: "TR1.2",
                        InvoiceType: "SATIS",
                        InvoiceSerieOrNumber: invNo,
                        IssueDate: new Date(invoice.invoiceDate || invoice.createdAt).toISOString(),
                        CurrencyCode: "TRY",
                        LineExtensionAmount: Number(invoice.totalAmount),
                        PayableAmount: Number(invoice.totalAmount)
                    },
                    CompanyInfo: { TaxNumber: config.companyVkn || "1111111111", Name: config.companyTitle || "Firma" },
                    CustomerInfo: { TaxNumber: customerVkn, Name: invoice.customer.name, Address: invoice.customer.address || "Adres" },
                    InvoiceLines: (invoice.items as any[]).map((i, idx) => ({
                        Index: (idx + 1).toString(),
                        Name: i.name,
                        Quantity: i.qty,
                        Price: i.price,
                        KDVPercent: i.vat || 20
                    }))
                };

                if (isEInvoice) {
                    (payload.InvoiceInfo as any).InvoiceProfile = "TICARIFATURA";
                    return await nilvera.sendInvoice({ EInvoice: payload, CustomerAlias: alias }, 'EFATURA');
                } else {
                    (payload.InvoiceInfo as any).InvoiceProfile = "EARSIVFATURA";
                    return await nilvera.sendInvoice({ ArchiveInvoice: payload }, 'EARSIV');
                }
            }

            let userCheck = await nilvera.checkUser(customerVkn);
            let sendResult = await attemptSending(userCheck.isEInvoiceUser, userCheck.alias);

            if (!sendResult.success && sendResult.errorCode === 422) {
                sendResult = await attemptSending(!userCheck.isEInvoiceUser, userCheck.alias);
            }

            if (sendResult.success) {
                await (prisma as any).salesInvoice.update({
                    where: { id: invoiceId },
                    data: { isFormal: true, formalStatus: 'SENT', formalUuid: sendResult.formalId }
                });
                return NextResponse.json({ success: true, message: 'Başarıyla gönderildi.', formalId: sendResult.formalId });
            }
            return NextResponse.json({ success: false, error: sendResult.error }, { status: 400 });
        }

        // ORIGINAL INVOICE CREATION LOGIC
        if (!hasPermission(session, 'sales_invoice_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const {
            customerId,
            items,
            amount,
            taxAmount,
            totalAmount,
            description,
            isFormal = false,
            status = 'Taslak',
            branch
        } = body;

        if (!customerId || !items || items.length === 0) {
            return NextResponse.json({ success: false, error: 'Müşteri ve ürün bilgileri zorunludur.' }, { status: 400 });
        }

        const createResult = await prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({ where: { id: customerId } });
            const targetBranch = branch || customer?.branch || session.branch || 'Merkez';

            const invoice = await tx.salesInvoice.create({
                data: {
                    invoiceNo: `INV-${Date.now()}`,
                    customerId,
                    amount,
                    taxAmount,
                    totalAmount,
                    description,
                    items: items,
                    isFormal: isFormal,
                    status: status,
                    branch: String(targetBranch)
                }
            });

            if (isFormal || status === 'Onaylandı') {
                await tx.customer.update({
                    where: { id: customerId },
                    data: { balance: { increment: parseFloat(totalAmount.toString()) } }
                });

                const defaultKasa = await tx.kasa.findFirst({ where: { branch: String(targetBranch) } }) || await tx.kasa.findFirst();
                if (defaultKasa) {
                    await tx.transaction.create({
                        data: {
                            type: 'SalesInvoice',
                            amount: totalAmount,
                            description: `Faturalı Satış: ${invoice.invoiceNo}`,
                            kasaId: defaultKasa.id.toString(),
                            customerId: customerId,
                            date: new Date(),
                            branch: String(targetBranch)
                        }
                    });
                }

                for (const item of items) {
                    if (item.productId) {
                        const pId = String(item.productId);
                        const qty = Number(item.qty);
                        await tx.product.update({ where: { id: pId }, data: { stock: { decrement: qty } } });
                        await tx.stock.upsert({
                            where: { productId_branch: { productId: pId, branch: String(targetBranch) } },
                            update: { quantity: { decrement: qty } },
                            create: { productId: pId, branch: String(targetBranch), quantity: -qty }
                        });
                        await (tx as any).stockMovement.create({
                            data: {
                                productId: pId,
                                branch: String(targetBranch),
                                quantity: -qty,
                                price: item.price || 0,
                                type: 'SALE',
                                referenceId: invoice.id
                            }
                        });
                    }
                }
            }

            await logActivity({
                userId: session.id as string,
                userName: session.username as string,
                action: 'CREATE',
                entity: 'SalesInvoice',
                entityId: invoice.id,
                newData: invoice,
                details: `${invoice.invoiceNo} numaralı satış faturası oluşturuldu.`,
                branch: session.branch as string
            });

            return invoice;
        });

        return NextResponse.json({ success: true, invoice: createResult });

    } catch (error: any) {
        console.error('Invoice Creation Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
