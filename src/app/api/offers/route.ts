import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    try {
        const { authorized, user, response } = await authorize();
        if (!authorized) return response;

        const where: any = {
            companyId: user.companyId
        };

        if (status && status !== 'All') {
            where.status = status;
        }

        const offers = await prisma.offer.findMany({
            where,
            include: {
                customer: {
                    select: { name: true, phone: true, email: true }
                },
                lines: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format for frontend compatibility initially
        const formattedOffers = offers.map(o => ({
            ...o,
            quoteNo: o.offerNumber,
            date: o.issueDate,
            totalAmount: o.grandTotal,
            items: o.lines.map(l => ({
                id: l.id,
                productId: l.productId,
                name: l.description,
                quantity: l.quantity,
                price: l.unitPrice,
                taxRate: l.taxRate
            }))
        }));

        return NextResponse.json({ success: true, quotes: formattedOffers, offers });
    } catch (error: any) {
        console.error('[Offers GET Error]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { authorized, user, response } = await authorize();
        if (!authorized) return response;

        const body = await req.json();
        const { customerId, items, description, validUntil, subTotal, taxAmount, totalAmount } = body;

        const companyId = user.companyId;
        if (!companyId) throw new Error("Şirket kimliği bulunamadı.");

        // Generate Offer No (TEK-[DATE]-0001)
        const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const lastOffer = await prisma.offer.findFirst({
            where: {
                companyId: companyId,
                offerNumber: { startsWith: `TEK-${datePrefix}` }
            },
            orderBy: { createdAt: 'desc' }
        });

        let seq = 1;
        if (lastOffer) {
            const parts = lastOffer.offerNumber.split('-');
            if (parts.length === 3) seq = parseInt(parts[2]) + 1;
        }
        const offerNumber = `TEK-${datePrefix}-${seq.toString().padStart(4, '0')}`;

        const offer = await prisma.offer.create({
            data: {
                companyId,
                offerNumber,
                customerId,
                ownerUserId: user.id || null,
                createdBy: user.name || "System",
                validUntil: validUntil ? new Date(validUntil) : null,
                subtotal: Number(subTotal) || 0,
                taxTotal: Number(taxAmount) || 0,
                grandTotal: Number(totalAmount) || 0,
                status: 'DRAFT',
                lines: {
                    create: (items || []).map((item: any) => ({
                        productId: item.productId || null,
                        description: item.name || "",
                        quantity: Number(item.quantity) || 1,
                        unitPrice: Number(item.price) || 0,
                        taxRate: Number(item.taxRate) || 0,
                        taxAmount: (Number(item.quantity) * Number(item.price)) * (Number(item.taxRate)/100) || 0,
                        lineTotal: (Number(item.quantity) * Number(item.price)) + ((Number(item.quantity) * Number(item.price)) * (Number(item.taxRate)/100)) || 0
                    }))
                },
                terms: {
                    create: {
                        notes: description
                    }
                },
                activities: {
                    create: {
                        type: 'CREATED',
                        metadata: { by: user.name }
                    }
                }
            },
            include: {
                lines: true,
                terms: true
            }
        });

        return NextResponse.json({ success: true, quote: offer });

    } catch (error: any) {
        console.error('[Offers POST Error]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
