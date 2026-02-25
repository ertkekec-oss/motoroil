import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { networkDemandCreateSchema } from '@/lib/validation/network';
import { ApiError, ApiSuccess } from '@/services/network/helpers';

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        const user = session?.user || session;
        if (!user || (!user.permissions?.includes('network_buy') && user.role !== 'SUPER_ADMIN')) {
            return ApiError('Unauthorized: network_buy permission required', 403);
        }

        const currentCompanyId = user.companyId || session?.companyId;
        if (!currentCompanyId) return ApiError('Tenant context missing', 400);

        const body = await req.json();
        const parseResult = networkDemandCreateSchema.safeParse(body);

        if (!parseResult.success) {
            return ApiError(parseResult.error.errors[0].message, 400);
        }

        const data = parseResult.data;

        // Optionally fetch the global product to ensure it exists
        if (data.type === 'PRODUCT' && data.globalProductId) {
            const globalProduct = await prisma.globalProduct.findUnique({
                where: { id: data.globalProductId }
            });
            if (!globalProduct) return ApiError('Global product not found in registry', 404);
        }

        const demand = await prisma.networkDemand.create({
            data: {
                buyerCompanyId: currentCompanyId,
                type: data.type,
                globalProductId: data.globalProductId || null,
                payload: data.payload,
                status: 'OPEN'
            }
        });

        return ApiSuccess(demand, 201);
    } catch (e: any) {
        return ApiError(e.message ?? 'Server error', 500);
    }
}
