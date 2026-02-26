import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { ApiError, ApiSuccess, createCanonicalHash } from '@/services/network/helpers';

export async function POST(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const session: any = await getSession();
        const user = session?.user || session;

        if (!user || (!user.permissions?.includes('network_buy') && user.role !== 'SUPER_ADMIN')) {
            return ApiError('Unauthorized: network_buy permission required', 403);
        }

        const currentCompanyId = user.companyId || session?.companyId;
        if (!currentCompanyId) return ApiError('Tenant context missing', 400);

        const resultOrder = await prisma.$transaction(async (tx) => {
            // 1) Transaction icinde bastan oku (Stale read & Race condition kalkanlari)
            const offer = await tx.networkOffer.findUnique({
                where: { id: params.id },
                include: { demand: true },
            });
            if (!offer) throw Object.assign(new Error('Offer not found'), { httpCode: 404 });

            if (offer.demand.buyerCompanyId !== currentCompanyId) {
                throw Object.assign(new Error('Unauthorized to accept offers for another company demand'), { httpCode: 403 });
            }
            if (offer.status !== 'PENDING') {
                throw Object.assign(new Error('Offer is not pending'), { httpCode: 409 });
            }
            if (offer.demand.status !== 'OPEN') {
                throw Object.assign(new Error('Demand is no longer open'), { httpCode: 409 });
            }

            // Quantity Extract
            const demandPayload = offer.demand.payload as any;
            const qty = (demandPayload && typeof demandPayload.qty === 'number' && demandPayload.qty > 0) ? demandPayload.qty : 1;

            // Decimal Precise Hesaplamalar
            const unitPrice = offer.price; // Prisma.Decimal tarafindan korunur
            const subtotalAmount = unitPrice.mul(new Prisma.Decimal(qty));

            const items = [{
                globalProductId: offer.demand.globalProductId ?? null,
                qty,
                unitPrice: unitPrice.toString(),
            }];

            const itemsHash = createCanonicalHash(items);

            // Lock stateleri
            const updatedOffer = await tx.networkOffer.updateMany({
                where: { id: offer.id, status: 'PENDING' },
                data: { status: 'ACCEPTED' },
            });
            if (updatedOffer.count !== 1) {
                throw Object.assign(new Error('Conflict: Offer already accepted.'), { httpCode: 409 });
            }

            const closedDemand = await tx.networkDemand.updateMany({
                where: { id: offer.demand.id, status: 'OPEN' },
                data: { status: 'CLOSED' },
            });
            if (closedDemand.count !== 1) {
                throw Object.assign(new Error('Conflict: Demand already closed.'), { httpCode: 409 });
            }

            // 3) Siparis Yarat (Decimal kullanimi ve hashing dahil)
            return tx.networkOrder.create({
                data: {
                    buyerCompanyId: offer.demand.buyerCompanyId,
                    sellerCompanyId: offer.sellerCompanyId,
                    subtotalAmount,
                    shippingAmount: new Prisma.Decimal(0),
                    commissionAmount: new Prisma.Decimal(0),
                    totalAmount: subtotalAmount,
                    currency: offer.currency || 'TRY',
                    status: 'PENDING_PAYMENT',
                    itemsHash,
                    items,
                },
            });
        });

        return ApiSuccess(resultOrder, 201);
    } catch (e: any) {
        const httpCode = e?.httpCode ?? 500;
        return ApiError(e?.message ?? 'Server error', httpCode);
    }
}
