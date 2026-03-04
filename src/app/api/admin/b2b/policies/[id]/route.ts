import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: any }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = session.role?.toUpperCase() || '';
        // Platform level settings change, checking exact role might be important
        if (!['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = (await Promise.resolve(params)) as any;
        const tenantId = resolvedParams.id;
        const body = await req.json();

        if (!['PASSWORD_ONLY', 'OTP_ONLY', 'OTP_OR_PASSWORD'].includes(body.dealerAuthMode)) {
            return NextResponse.json({ error: 'Invalid dealerAuthMode' }, { status: 400 });
        }

        const updated = await prisma.tenantPortalConfig.upsert({
            where: { tenantId },
            update: { dealerAuthMode: body.dealerAuthMode },
            create: { tenantId, dealerAuthMode: body.dealerAuthMode }
        });

        // Audit log creation for config change
        await prisma.auditEvent.create({
            data: {
                tenantId: tenantId,
                actorUserId: session.user?.id || session.id || 'system',
                type: 'DEALER_AUTH_MODE_CHANGED',
                entityType: 'TenantPortalConfig',
                entityId: tenantId,
                meta: { newMode: body.dealerAuthMode }
            }
        });

        return NextResponse.json({ success: true, updated });

    } catch (error: any) {
        console.error('Admin B2B Policies Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
