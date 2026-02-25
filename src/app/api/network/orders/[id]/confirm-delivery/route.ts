import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { confirmDelivery } from '@/services/orders/confirmDelivery';
import { redisConnection } from '@/lib/queue/redis';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const rateLimitKey = `rate:confirm:${params.id}:${ip}`;

        const reqs = await redisConnection.incr(rateLimitKey);
        if (reqs === 1) await redisConnection.expire(rateLimitKey, 60); // 1 minute window
        if (reqs > 5) {
            console.warn(`[RateLimit] Blocked confirm delivery spam for order ${params.id} from IP ${ip}`);
            return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
        }
        const session = await getSession();
        if (!session?.tenantId || !session?.settings?.companyId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized / No context' }, { status: 401 });
        }

        // RBAC Check
        const hasPermission = session.permissions?.includes('network_buy') || session.role === 'buyer' || session.role === 'admin';
        if (!hasPermission) {
            console.warn(`[ConfirmDelivery] Unauthorized access attempt by user ${session.user.id}`);
            return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
        }

        const buyerCompanyId = session.settings.companyId;

        const result = await confirmDelivery(params.id, buyerCompanyId);

        // Always return 200 for idempotency
        return NextResponse.json({
            ok: true,
            data: result
        }, { status: 200 });

    } catch (e: any) {
        console.error('Order Confirm Delivery Error:', e);
        const code = e.httpCode || 500;

        // 409 for conflicts / already handled race conditions 
        // 400 for structural errors
        // 403 for unauthorized action
        // 404 for order not found
        return NextResponse.json({ ok: false, error: e.message }, { status: code });
    }
}
