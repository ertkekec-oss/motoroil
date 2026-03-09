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
        const { cart } = body; // Array of product ids

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

        // Determine types in cart
        const productTypes = [...new Set(products.map(p => p.type))];

        // Find a gateway that supports all these types, or at least active
        const activeGateways = await prisma.paymentGateway.findMany({
            where: { isActive: true }
        });

        if (activeGateways.length === 0) {
            return NextResponse.json({ error: 'Sistemde aktif ödeme altyapısı bulunmuyor' }, { status: 500 });
        }

        // For simplicity, select the first gateway that supports all types, or fallback to the first active one.
        let selectedGateway = activeGateways.find(gw =>
            productTypes.every(pt => gw.supportedTypes.includes(pt))
        );

        if (!selectedGateway) {
            selectedGateway = activeGateways[0]; // fallback
        }

        // Generate a synthetic order reference
        const checkoutToken = `CHK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create transactions in PENDING state
        const transactions = await Promise.all(products.map(p => {
            return prisma.paymentTransaction.create({
                data: {
                    tenantId,
                    gatewayProvider: selectedGateway.provider,
                    productType: p.type,
                    productId: p.id,
                    amount: p.price,
                    currency: p.currency,
                    status: 'PENDING',
                    externalReference: checkoutToken
                }
            });
        }));

        // In a real scenario, we would call the provider API to get a checkout page URL.
        // For Periodya Billing Simulation, we'll return a simulated URL.
        const checkoutUrl = `/billing/checkout?token=${checkoutToken}&gateway=${selectedGateway.provider}`;

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
