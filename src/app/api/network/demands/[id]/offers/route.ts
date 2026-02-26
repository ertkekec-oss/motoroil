import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { networkOfferCreateSchema } from '@/lib/validation/network';
import { ApiError, ApiSuccess } from '@/services/network/helpers';

export async function POST(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const session: any = await getSession();
        const user = session?.user || session;
        if (!user || (!user.permissions?.includes('network_offer') && user.role !== 'SUPER_ADMIN')) {
            return ApiError('Unauthorized: network_offer permission required', 403);
        }

        const currentCompanyId = user.companyId || session?.companyId;
        if (!currentCompanyId) return ApiError('Tenant context missing', 400);

        const body = await req.json();
        const parseResult = networkOfferCreateSchema.safeParse(body);

        if (!parseResult.success) {
            return ApiError(parseResult.error.issues[0].message, 400);
        }

        const data = parseResult.data;

        // Verify Demand exists and is OPEN 
        const demand = await prisma.networkDemand.findUnique({
            where: { id: params.id }
        });

        if (!demand) return ApiError('Demand not found', 404);
        if (demand.status !== 'OPEN') return ApiError('Demand is closed or cancelled', 400);
        if (demand.buyerCompanyId === currentCompanyId) {
            return ApiError('Cannot place an offer logic on your own demand', 400);
        }

        // UPSERT based on Unique Constraint => (demandId, sellerCompanyId)
        const offer = await prisma.networkOffer.upsert({
            where: {
                demandId_sellerCompanyId: {
                    demandId: params.id,
                    sellerCompanyId: currentCompanyId
                }
            },
            update: {
                price: data.price,
                payload: data.payload,
                status: 'PENDING' // reset if updated
            },
            create: {
                demandId: params.id,
                sellerCompanyId: currentCompanyId,
                price: data.price,
                payload: data.payload,
                status: 'PENDING'
            }
        });

        return ApiSuccess(offer, 201);
    } catch (e: any) {
        return ApiError(e.message ?? 'Server error', 500);
    }
}
