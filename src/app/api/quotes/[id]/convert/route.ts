import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: quoteId } = await params;
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const company = await (prisma as any).company.findFirst({
            where: { tenantId: session.tenantId || 'PLATFORM_ADMIN' }
        });
        if (!company) throw new Error('Firma bulunamadı.');

        const companyId = company.id;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Quote
            const quote = await tx.quote.findUnique({
                where: { id: quoteId },
                include: { customer: true }
            });

            if (!quote) throw new Error('Teklif bulunamadı.');
            if (quote.status === 'Converted') throw new Error('Bu teklif zaten faturalandırılmış.');

            const items: any[] = quote.items as any[];
            const branch = quote.branch || (session as any).branch || 'Merkez';

            // 2. Create Sales Invoice
            const invoice = await tx.salesInvoice.create({
                data: {
                    invoiceNo: `INV-${Date.now()}`,
                    customerId: quote.customerId,
                    companyId: companyId,
                    description: `Tekliften dönüştürüldü: ${quote.quoteNo} - ${quote.description || ''}`,
                    amount: quote.subTotal,
                    taxAmount: quote.taxAmount,
                    totalAmount: quote.totalAmount,
                    items: items,
                    status: 'Onaylandı',
                    isFormal: true,
                    branch: branch
                }
            });

            // 3. Update Quote Status
            await tx.quote.update({
                where: { id: quoteId },
                data: { status: 'Converted' }
            });

            // 4. Update Customer Balance
            await tx.customer.update({
                where: { id: quote.customerId },
                data: { balance: { increment: quote.totalAmount } }
            });

            // 5. Update Stock
            for (const item of items) {
                if (item.productId) {
                    const qty = Number(item.quantity || 1);

                    // Branch Stock (Modern)
                    await tx.stock.upsert({
                        where: { productId_branch: { productId: String(item.productId), branch: branch } },
                        create: { productId: String(item.productId), branch: branch, quantity: -qty },
                        update: { quantity: { decrement: qty } }
                    });

                    // Stock Movement
                    await (tx as any).stockMovement.create({
                        data: {
                            productId: String(item.productId),
                            branch: branch,
                            companyId: companyId,
                            quantity: -qty,
                            price: item.price || 0,
                            type: 'SALE',
                            referenceId: invoice.id,
                            details: `Sales Invoice: ${invoice.invoiceNo}`
                        }
                    });

                    // Legacy sync for Merkez
                    if (branch === 'Merkez') {
                        await tx.product.update({
                            where: { id: String(item.productId) },
                            data: { stock: { decrement: qty } }
                        });
                    }
                }
            }

            // 6. Create Financial Transaction
            const defaultKasa = await tx.kasa.findFirst({ where: { branch: branch } }) || await tx.kasa.findFirst();
            if (defaultKasa) {
                await tx.transaction.create({
                    data: {
                        companyId: companyId,
                        type: 'SalesInvoice',
                        amount: quote.totalAmount,
                        description: `Faturalı Satış (Teklif: ${quote.quoteNo}): ${invoice.invoiceNo}`,
                        kasaId: defaultKasa.id,
                        customerId: quote.customerId,
                        date: new Date(),
                        branch: branch
                    }
                });
            }

            return invoice;
        });

        return NextResponse.json({ success: true, invoice: result });

    } catch (error: any) {
        console.error('Quote Conversion Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
