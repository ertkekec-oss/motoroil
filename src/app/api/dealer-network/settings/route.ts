import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!tenantId) {
            return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
        }

        let settings = await prisma.dealerNetworkSettings.findUnique({
            where: { tenantId }
        });

        if (!settings) {
            // Create defaults
            settings = await prisma.dealerNetworkSettings.create({
                data: {
                    tenantId,
                    creditPolicy: 'HARD_LIMIT',
                    hardLimitBlock: true,
                    forceCardOnLimit: false,
                    approvalRequiresPaymentIfFlagged: true,
                    showLimitOnCartUI: true
                }
            });
        }

        return NextResponse.json(settings);

    } catch (error: any) {
        console.error('Dealer Network Settings GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!tenantId) {
            return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
        }

        const body = await req.json();

        // strict picking
        const creditPolicy = ['HARD_LIMIT', 'SOFT_LIMIT', 'FORCE_CARD_ON_LIMIT'].includes(body.creditPolicy) ? body.creditPolicy : undefined;
        let hardLimitBlock = typeof body.hardLimitBlock === 'boolean' ? body.hardLimitBlock : undefined;
        let forceCardOnLimit = typeof body.forceCardOnLimit === 'boolean' ? body.forceCardOnLimit : undefined;
        const approvalRequiresPaymentIfFlagged = typeof body.approvalRequiresPaymentIfFlagged === 'boolean' ? body.approvalRequiresPaymentIfFlagged : undefined;
        const showLimitOnCartUI = typeof body.showLimitOnCartUI === 'boolean' ? body.showLimitOnCartUI : undefined;

        // policy specific business rules
        if (creditPolicy === 'FORCE_CARD_ON_LIMIT') {
            forceCardOnLimit = true;
        } else if (creditPolicy === 'HARD_LIMIT') {
            hardLimitBlock = true;
        }

        const updateData: any = {};
        if (creditPolicy !== undefined) updateData.creditPolicy = creditPolicy;
        if (hardLimitBlock !== undefined) updateData.hardLimitBlock = hardLimitBlock;
        if (forceCardOnLimit !== undefined) updateData.forceCardOnLimit = forceCardOnLimit;
        if (approvalRequiresPaymentIfFlagged !== undefined) updateData.approvalRequiresPaymentIfFlagged = approvalRequiresPaymentIfFlagged;
        if (showLimitOnCartUI !== undefined) updateData.showLimitOnCartUI = showLimitOnCartUI;

        const updated = await prisma.dealerNetworkSettings.upsert({
            where: { tenantId },
            update: updateData,
            create: {
                tenantId,
                ...updateData
            }
        });

        // Audit Log
        try {
            await prisma.auditEvent.create({
                data: {
                    tenantId,
                    actorUserId: user.id || 'system',
                    type: 'DEALER_NETWORK_SETTINGS_UPDATED' as any, // assuming we might not have updated enum in DB or just cast
                    entityType: 'DealerNetworkSettings',
                    entityId: tenantId,
                    meta: { changedFields: Object.keys(updateData) }
                }
            });
        } catch (e) {
            // fail-open
            console.error('Settings updated but audit log failed', e);
        }

        return NextResponse.json(updated);

    } catch (error: any) {
        console.error('Dealer Network Settings PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
