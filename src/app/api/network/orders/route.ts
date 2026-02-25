import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { networkOrderQuerySchema } from '@/lib/validation/network';
import { ApiError, ApiSuccess } from '@/services/network/helpers';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        const user = session?.user || session;
        if (!user) {
            return ApiError('Unauthorized mapping', 403);
        }

        const currentCompanyId = user.companyId || session?.companyId;
        if (!currentCompanyId) return ApiError('Tenant context missing', 400);

        // Map params to validated schema
        const queryParams = Object.fromEntries(req.nextUrl.searchParams);
        const parseResult = networkOrderQuerySchema.safeParse(queryParams);

        if (!parseResult.success) {
            return ApiError(parseResult.error.issues[0].message, 400);
        }

        const data = parseResult.data;

        const whereClause: any = {};

        // Prisma Extension already handles OR restrictions (buyer || seller) globally.
        // Implementing filter based on parameters passed if any
        if (data.status) {
            whereClause.status = data.status;
        }

        // Filtering by roles locally mapping DB schemas
        if (data.role === 'buyer') {
            // Let the extension intersect: OR[buyer=A, seller=A] AND buyerCompanyId=A
            whereClause.buyerCompanyId = currentCompanyId;
        } else if (data.role === 'seller') {
            whereClause.sellerCompanyId = currentCompanyId;
        }

        const args: any = {
            where: whereClause,
            take: data.take,
            orderBy: { createdAt: 'desc' },
            include: {
                buyerCompany: { select: { id: true, name: true, vkn: true } },
                sellerCompany: { select: { id: true, name: true, vkn: true } },
                shipments: true // includes top-level shipping entities dynamically
            }
        };

        if (data.cursor) {
            args.cursor = { id: data.cursor };
            args.skip = 1; // skip cursor
        }

        const orders = await prisma.networkOrder.findMany(args);

        const nextCursor = orders.length === data.take ? orders[orders.length - 1].id : undefined;

        return ApiSuccess({ items: orders, nextCursor }, 200);
    } catch (e: any) {
        return ApiError(e.message ?? 'Server error', 500);
    }
}
