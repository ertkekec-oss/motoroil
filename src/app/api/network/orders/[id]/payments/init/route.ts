import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { ApiError, ApiSuccess } from '@/services/network/helpers';
import { initiatePayment } from '@/services/payments/init';
import { paymentInitCreateSchema } from '@/lib/validation/payments';
import { prisma } from '@/lib/prisma';

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

        // Security check isolating tenant strictly against NetworkLayer Policy
        const order = await prisma.networkOrder.findUnique({
            // Extension overrides where clauses intercepting tenant anyway, but adding explicit checks guarantees policy.
            where: { id: params.id },
            select: { buyerCompanyId: true }
        });

        if (!order || order.buyerCompanyId !== currentCompanyId) {
            return ApiError('Order not found or unauthorized', 404);
        }

        const body = await req.json();
        const parsed = paymentInitCreateSchema.safeParse(body);
        if (!parsed.success) {
            return ApiError('Geçersiz veri: ' + parsed.error.issues[0].message, 400);
        }

        const data = parsed.data;

        // Init payment generating links/checking statuses securely through service
        const result = await initiatePayment(params.id, data.mode as any);

        return ApiSuccess(result, 201);
    } catch (e: any) {
        const httpCode = e?.httpCode ?? 500;
        return ApiError(e?.message ?? 'Server error', httpCode);
    }
}
