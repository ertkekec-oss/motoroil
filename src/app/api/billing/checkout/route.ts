import crypto from 'crypto';
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
        const { cart } = body;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return NextResponse.json({ error: 'Sepet boş' }, { status: 400 });
        }

        const products = await prisma.billingProduct.findMany({
            where: {
                id: { in: cart },
                isActive: true
            }
        });

        if (products.length !== cart.length) {
            return NextResponse.json({ error: 'Bazı ürünler bulunamadı veya pasif' }, { status: 400 });
        }

        const productTypes = [...new Set(products.map(p => p.type))];

        const activeGateways = await prisma.paymentGateway.findMany({
            where: { isActive: true }
        });

        if (activeGateways.length === 0) {
            return NextResponse.json({ error: 'Sistemde aktif ödeme altyapısı bulunmuyor' }, { status: 500 });
        }

        let selectedGateway = activeGateways.find(gw =>
            productTypes.every(pt => gw.supportedTypes.includes(pt))
        );

        if (!selectedGateway) {
            selectedGateway = activeGateways[0];
        }

        const checkoutToken = `CHK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const transactions = await Promise.all(products.map(p => {
            return prisma.paymentTransaction.create({
                data: {
                    tenantId,
                    gatewayProvider: selectedGateway?.provider || 'SIMULATION',
                    productType: p.type,
                    productId: p.id,
                    amount: p.price,
                    currency: p.currency,
                    status: 'PENDING',
                    externalReference: checkoutToken
                }
            });
        }));

        let checkoutUrl = `/billing/checkout?token=${checkoutToken}&gateway=${selectedGateway?.provider}`;

        if (selectedGateway?.provider === 'PAYTR') {
            const user_ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
            const user_name = user.name || 'Periodya Müşterisi';
            const user_address = 'Türkiye';
            const user_phone = '05000000000';
            const email = user.email || 'musteri@periodya.com';

            const merchant_id = selectedGateway.merchantId || '';
            const merchant_key = selectedGateway.apiKey || '';
            const merchant_salt = selectedGateway.apiSecret || '';

            const payment_amount = Math.round(products.reduce((acc, p) => acc + Number(p.price), 0) * 100);
            const merchant_oid = checkoutToken;

            const user_basket = Buffer.from(JSON.stringify(products.map(p => [p.name, p.price.toString(), 1]))).toString('base64');

            const no_installment = 0;
            const max_installment = 12;
            const currency = 'TL';
            const test_mode = selectedGateway.isTestMode ? 1 : 0;
            const debug_on = selectedGateway.isTestMode ? 1 : 0;

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.periodya.com';
            // We'll redirect to a static success or fail success UI route
            const merchant_ok_url = `${appUrl}/billing/checkout/success?token=${checkoutToken}`;
            const merchant_fail_url = `${appUrl}/billing/checkout/fail?token=${checkoutToken}`;

            const hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode;
            const paytr_token = crypto.createHmac('sha256', merchant_salt).update(hash_str + merchant_salt).digest('base64');

            const formParams = new URLSearchParams();
            formParams.append('merchant_id', merchant_id);
            formParams.append('user_ip', user_ip);
            formParams.append('merchant_oid', merchant_oid);
            formParams.append('email', email);
            formParams.append('payment_amount', payment_amount.toString());
            formParams.append('paytr_token', paytr_token);
            formParams.append('user_basket', user_basket);
            formParams.append('debug_on', debug_on.toString());
            formParams.append('no_installment', no_installment.toString());
            formParams.append('max_installment', max_installment.toString());
            formParams.append('user_name', user_name);
            formParams.append('user_address', user_address);
            formParams.append('user_phone', user_phone);
            formParams.append('merchant_ok_url', merchant_ok_url);
            formParams.append('merchant_fail_url', merchant_fail_url);
            formParams.append('timeout_limit', '30');
            formParams.append('currency', currency);
            formParams.append('test_mode', test_mode.toString());

            const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formParams.toString()
            });

            const responseData = await paytrRes.json();

            if (responseData.status === 'success') {
                checkoutUrl = 'https://www.paytr.com/odeme/guvenli/' + responseData.token;
            } else {
                return NextResponse.json({ error: 'PayTR API Reddi: ' + responseData.reason }, { status: 500 });
            }
        }


        return NextResponse.json({
            success: true,
            checkoutToken,
            checkoutUrl,
            gateway: selectedGateway.provider,
            transactions
        });

    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
