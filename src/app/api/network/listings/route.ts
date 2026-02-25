import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { networkListingCreateSchema } from '@/lib/validation/network';
import { ApiError, ApiSuccess } from '@/services/network/helpers';

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        const user = session?.user || session;
        if (!user || (!user.permissions?.includes('network_sell') && user.role !== 'SUPER_ADMIN')) {
            return ApiError('Unauthorized: network_sell permission required', 403);
        }

        const currentCompanyId = user.companyId || session?.companyId;
        if (!currentCompanyId) return ApiError('Tenant context missing', 400);

        const body = await req.json();
        const parseResult = networkListingCreateSchema.safeParse(body);

        if (!parseResult.success) {
            return ApiError(parseResult.error.issues[0].message, 400);
        }

        const data = parseResult.data;

        // Verify product belongs to company (Security check redundant usually, but safe)
        const product = await prisma.product.findUnique({
            where: { id: data.productId }
        });

        if (!product || product.companyId !== currentCompanyId) {
            return ApiError('Product not found in your inventory', 404);
        }

        // UPSERT - Unique(sellerCompanyId, productId) based on MVP Protection rule
        const listing = await prisma.networkListing.upsert({
            where: {
                sellerCompanyId_productId: {
                    sellerCompanyId: currentCompanyId,
                    productId: data.productId
                }
            },
            update: {
                price: data.price,
                availableQty: data.availableQty,
                minQty: data.minQty ?? null,
                leadTimeDays: data.leadTimeDays ?? null,
                status: 'ACTIVE' // Reset to active if upserted
            },
            create: {
                sellerCompanyId: currentCompanyId,
                productId: data.productId,
                price: data.price,
                availableQty: data.availableQty,
                minQty: data.minQty,
                leadTimeDays: data.leadTimeDays,
                status: 'ACTIVE',
                // globalProductId might be updated via workers or separate mapping phase
                globalProductId: null
            }
        });

        return ApiSuccess(listing, 201);
    } catch (e: any) {
        return ApiError(e.message ?? 'Server error', 500);
    }
}
