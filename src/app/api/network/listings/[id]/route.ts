import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { networkListingUpdateSchema } from '@/lib/validation/network';
import { ApiError, ApiSuccess } from '@/services/network/helpers';

export async function PATCH(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const session: any = await getSession();
        const user = session?.user || session;
        if (!user || (!user.permissions?.includes('network_sell') && user.role !== 'SUPER_ADMIN')) {
            return ApiError('Unauthorized: network_sell permission required', 403);
        }

        const currentCompanyId = user.companyId || session?.companyId;
        if (!currentCompanyId) return ApiError('Tenant context missing', 400);

        const body = await req.json();
        const parseResult = networkListingUpdateSchema.safeParse(body);

        if (!parseResult.success) {
            return ApiError(parseResult.error.issues[0].message, 400);
        }

        const data = parseResult.data;

        // Fetch to verify ownership
        const existing = await prisma.networkListing.findUnique({
            where: { id: params.id }
        });

        if (!existing || existing.sellerCompanyId !== currentCompanyId) {
            return ApiError('Listing not found or you do not have permission', 404);
        }

        const listing = await prisma.networkListing.update({
            where: { id: params.id },
            data: {
                price: data.price !== undefined ? data.price : undefined,
                availableQty: data.availableQty !== undefined ? data.availableQty : undefined,
                minQty: data.minQty !== undefined ? data.minQty : undefined,
                leadTimeDays: data.leadTimeDays !== undefined ? data.leadTimeDays : undefined,
                status: data.status !== undefined ? data.status : undefined,
            }
        });

        return ApiSuccess(listing, 200);
    } catch (e: any) {
        return ApiError(e.message ?? 'Server error', 500);
    }
}
