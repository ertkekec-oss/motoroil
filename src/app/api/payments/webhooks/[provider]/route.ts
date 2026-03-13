import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This is a generic webhook endpoint that simulates gateway callbacks
// and handles idempotent credit allocation.
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
    try {
        const { provider: providerParam } = await params;
        const provider = providerParam.toUpperCase(); // IYZICO, PAYTR, PAYNET etc.
        const body = await request.json();

        // Ensure signature is validated via external gateway libraries here.
        // For development, we skip signature validation.

        const { externalReference, status } = body;

        if (!externalReference || !status) {
            return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
        }

        // Find all pending transactions for this reference
        const transactions = await prisma.paymentTransaction.findMany({
            where: {
                externalReference,
                gatewayProvider: provider
            }
        });

        if (transactions.length === 0) {
            return NextResponse.json({ error: 'İşlem bulunamadı' }, { status: 404 });
        }

        // Idempotency Check: Filter out already processed (PAID or FAILED) transactions
        const pendingTransactions = transactions.filter(t => t.status === 'PENDING');

        if (pendingTransactions.length === 0) {
            return NextResponse.json({ message: 'Bu webhook zaten işlendi (Idempotent)' }, { status: 200 });
        }

        // Update successful transactions and allocate credits
        for (const pt of pendingTransactions) {
            // Mark transaction as PAID/FAILED
            await prisma.paymentTransaction.update({
                where: { id: pt.id },
                data: {
                    status: status === 'SUCCESS' ? 'PAID' : 'FAILED',
                    rawResponse: body,
                    updatedAt: new Date()
                }
            });

            // Credit Allocation if SUCCESS
            if (status === 'SUCCESS') {
                const product = await prisma.billingProduct.findUnique({
                    where: { id: pt.productId }
                });

                if (!product) continue;

                // Allocate credits based on product Type
                const tenantId = pt.tenantId;

                // Ensure tenant credit record exists
                let tCredit = await prisma.tenantCredit.findUnique({ where: { tenantId } });
                if (!tCredit) {
                    tCredit = await prisma.tenantCredit.create({
                        data: { tenantId }
                    });
                }

                if (product.type === 'SMS') {
                    await prisma.tenantCredit.update({
                        where: { tenantId },
                        data: { smsCredits: { increment: product.creditAmount } }
                    });
                } else if (product.type === 'EINVOICE') {
                    await prisma.tenantCredit.update({
                        where: { tenantId },
                        data: { einvoiceCredits: { increment: product.creditAmount } }
                    });
                } else if (product.type === 'SAAS') {
                    // update subscription model if it exists
                    // For this milestone, we acknowledge it via PaymentTransaction
                    console.log(`[INFO] SAAS Plan purchased: ${product.name} for Tenant ${tenantId}`);
                }
            }
        }

        return NextResponse.json({ success: true, processed: pendingTransactions.length });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
