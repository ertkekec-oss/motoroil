import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

function isPlatformAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function POST(request: Request) {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!idempotencyKey) {
            return NextResponse.json({ error: 'x-idempotency-key header is required' }, { status: 400 });
        }

        // Just mock trigger a reconcile pull
        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            await prisma.financeAuditLog.create({
                data: {
                    tenantId: 'PLATFORM_ADMIN',
                    action: 'PROVIDER_RECONCILE_TRIGGER',
                    actor: session.id || 'SYSTEM',
                    entityId: body.provider || 'ALL',
                    entityType: 'PaymentProvider',
                    payloadJson: { source: 'Admin Portal', ...body }
                }
            });

            return { triggeredAt: new Date().toISOString(), provider: body.provider, queued: true };
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
