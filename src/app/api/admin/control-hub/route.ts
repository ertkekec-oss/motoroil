import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session: any = await getSession();
        const user = session?.user || session;

        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { targetTenantId, enable, reason, idempotencyKey } = body;

        if (!reason || !idempotencyKey) {
            return NextResponse.json({ error: 'Reason and Idempotency Key are required' }, { status: 400 });
        }

        // Idempotency Check (Mock or using a cache/db table if available, but simplistic here)
        // If we had an IdempotencyKey model we'd check it. For now, simulate check via audit log.
        const existingAudit = await prisma.auditLog.findFirst({
            where: {
                details: {
                    path: ['idempotencyKey'],
                    equals: idempotencyKey
                }
            } as any
        });

        if (existingAudit) {
            return NextResponse.json({ message: 'Action already processed', idempotencyKey });
        }

        // Action Logic: e.g. update tenant settings. 
        // We will just log this action for now, assuming the DB model handles settings JSON or similar.

        // Audit log required
        await prisma.auditLog.create({
            data: {
                action: enable ? 'ENABLE_CONTROL_HUB' : 'DISABLE_CONTROL_HUB',
                entity: 'TENANT',
                entityId: targetTenantId || 'GLOBAL',
                userId: user.id || 'system',
                details: {
                    reason,
                    idempotencyKey,
                    targetTenantId,
                    before: 'N/A',
                    after: enable
                }
            }
        });

        // Tenant bazlı ayarı JSON'da saklama örneği (eğer Settings modeliniz varsa):
        // await prisma.tenant.update({ where: { id: targetTenantId }, data: { useControlHub: enable } })

        return NextResponse.json({
            success: true,
            targetTenantId,
            enabled: enable,
            auditReason: reason,
            idempotencyKey
        });

    } catch (err: any) {
        console.error("Control Hub Toggle Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
