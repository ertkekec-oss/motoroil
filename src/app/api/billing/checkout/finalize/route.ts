import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        const tenantId = user.impersonateTenantId || user.tenantId;

        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'Checkout token eksik' }, { status: 400 });
        }

        // Find pending transactions
        const transactions = await prisma.paymentTransaction.findMany({
            where: {
                tenantId,
                externalReference: token,
                status: 'PENDING'
            }
        });

        if (transactions.length === 0) {
            return NextResponse.json({ error: 'İşlem bulunamadı veya zaten tamamlanmış' }, { status: 404 });
        }

        // Mark them as PAID
        await prisma.paymentTransaction.updateMany({
            where: {
                externalReference: token,
                tenantId
            },
            data: { status: 'PAID' }
        });

        // Add credits
        let totalSms = 0;
        let totalEinvoice = 0;

        for (const tx of transactions) {
            const product = await prisma.billingProduct.findUnique({
                where: { id: tx.productId }
            });

            if (product) {
                if (tx.productType === 'SMS') totalSms += product.creditAmount;
                if (tx.productType === 'EINVOICE') totalEinvoice += product.creditAmount;
            }
        }

        if (totalSms > 0 || totalEinvoice > 0) {
            await prisma.tenantCredit.upsert({
                where: { tenantId },
                update: {
                    smsCredits: { increment: totalSms },
                    einvoiceCredits: { increment: totalEinvoice }
                },
                create: {
                    tenantId,
                    smsCredits: totalSms,
                    einvoiceCredits: totalEinvoice
                }
            });
        }

        return NextResponse.json({ success: true, message: 'Ödeme başarıyla alındı ve krediler yüklendi.' });
    } catch (error: any) {
        console.error('Finalize error:', error);
        return NextResponse.json({ success: false, error: 'İşlem tamamlanırken hata oluştu: ' + error.message }, { status: 500 });
    }
}
