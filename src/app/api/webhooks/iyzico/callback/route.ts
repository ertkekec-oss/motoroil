
import { NextRequest, NextResponse } from 'next/server';
import { iyzico } from '@/lib/iyzico';
import prisma from '@/lib/prisma';

/**
 * Iyzico ödeme sonrası kullanıcıyı buraya yönlendirir.
 * Bu bir Webhook değil, Redirect URL'dir.
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const token = formData.get('token') as string;

        if (!token) {
            return NextResponse.redirect(new URL('/billing?error=missing_token', req.url));
        }

        // Token ile ödeme sonucunu sorgula
        const result = await iyzico.getSubscriptionCheckoutResult(token);

        if (result.status === 'success' && result.conversationId) {
            // result.conversationId = sub_TENANTID_TIMESTAMP formatında göndermiştik
            const tenantId = result.conversationId.split('_')[1];
            const referenceCode = result.referenceCode; // Iyzico Abonelik Kodu

            // Abonelik bilgisini güncelle
            // Not: Webhook da bu işi yapacak ama redirect sırasında 
            // kullanıcıya anında geri bildirim vermek için burada da yapıyoruz.
            const subscription = await prisma.subscription.findUnique({
                where: { tenantId }
            });

            if (subscription) {
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        externalId: referenceCode,
                        status: 'ACTIVE'
                    }
                });

                // Başarı sayfasına yönlendir
                return NextResponse.redirect(new URL('/billing?success=true', req.url));
            }
        }

        // Hata durumunda billing'e hata ile dön
        return NextResponse.redirect(new URL(`/billing?error=payment_failed&msg=${encodeURIComponent(result.errorMessage || '')}`, req.url));

    } catch (error: any) {
        console.error('Iyzico Callback error:', error);
        return NextResponse.redirect(new URL('/billing?error=system_error', req.url));
    }
}
