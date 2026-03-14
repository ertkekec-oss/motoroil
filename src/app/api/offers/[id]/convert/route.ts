import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: offerId } = await params;
        const { authorized, user, response } = await authorize();
        if (!authorized) return response;

        const companyId = user.companyId;
        if (!companyId) throw new Error("Şirket kimliği bulunamadı.");

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Offer
            const offer = await tx.offer.findUnique({
                where: { id: offerId },
                include: { customer: true, lines: true, terms: true }
            });

            if (!offer) throw new Error('Teklif bulunamadı.');
            if (offer.status === 'CONVERTED_TO_ORDER') throw new Error('Bu teklif zaten faturalandırılmış/siparişe dönüştürülmüş.');

            const branch = user.branch || 'Merkez';

            // 2. Create Sales Invoice
            const invoice = await tx.salesInvoice.create({
                data: {
                    invoiceNo: `INV-${Date.now()}`,
                    customerId: offer.customerId,
                    companyId: companyId,
                    description: `Tekliften dönüştürüldü: ${offer.offerNumber} - ${offer.terms?.[0]?.notes || ''}`,
                    amount: offer.subtotal,
                    taxAmount: offer.taxTotal,
                    totalAmount: offer.grandTotal,
                    items: offer.lines.map(line => ({
                        productId: line.productId,
                        name: line.description,
                        quantity: Number(line.quantity),
                        price: Number(line.unitPrice),
                        taxRate: Number(line.taxRate),
                        total: Number(line.lineTotal)
                    })),
                    status: 'Onaylandı',
                    isFormal: true,
                    branch: branch
                }
            });

            // 3. Update Offer Status
            await tx.offer.update({
                where: { id: offerId },
                data: { status: 'CONVERTED_TO_ORDER' }
            });

            // 4. Record Activity
            await tx.offerActivity.create({
                data: {
                    offerId,
                    type: 'CONVERTED_TO_ORDER',
                    metadata: { invoiceId: invoice.id, invoiceNo: invoice.invoiceNo, by: user.name }
                }
            });

            // 5. Update Customer Balance
            await tx.customer.update({
                where: { id: offer.customerId },
                data: { balance: { increment: offer.grandTotal } }
            });

            // 6. Update Stock
            for (const line of offer.lines) {
                if (line.productId) {
                    const qty = Number(line.quantity || 1);

                    // Branch Stock (Modern)
                    await tx.stock.upsert({
                        where: { productId_branch: { productId: String(line.productId), branch: branch } },
                        create: { productId: String(line.productId), branch: branch, quantity: -qty },
                        update: { quantity: { decrement: qty } }
                    });

                    // Stock Movement
                    await tx.stockMovement.create({
                        data: {
                            productId: String(line.productId),
                            branch: branch,
                            companyId: companyId,
                            quantity: -qty,
                            price: line.unitPrice || 0,
                            type: 'SALE',
                            referenceId: invoice.id,
                            details: `Sales Invoice: ${invoice.invoiceNo}`
                        }
                    });

                    // Legacy sync for Merkez
                    if (branch === 'Merkez') {
                        await tx.product.update({
                            where: { id: String(line.productId) },
                            data: { stock: { decrement: qty } }
                        });
                    }
                }
            }

            // 7. Create Financial Transaction
            const defaultKasa = await tx.kasa.findFirst({ where: { branch: branch } }) || await tx.kasa.findFirst();
            if (defaultKasa) {
                await tx.transaction.create({
                    data: {
                        companyId: companyId,
                        type: 'SalesInvoice',
                        amount: offer.grandTotal,
                        description: `Faturalı Satış (Teklif: ${offer.offerNumber}): ${invoice.invoiceNo}`,
                        kasaId: defaultKasa.id,
                        customerId: offer.customerId,
                        date: new Date(),
                        branch: branch
                    }
                });
            }

            return invoice;
        });

        return NextResponse.json({ success: true, invoice: result });

    } catch (error: any) {
        console.error('Offer Conversion Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
