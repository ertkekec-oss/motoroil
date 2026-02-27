import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isPlatformAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function GET() {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Just mock some provider status data based on DB configs.
        // In real life, might do a lightweight ping or read from OpsLog latest errors.

        const providers = [
            {
                name: 'Iyzico',
                status: 'ACTIVE',
                onboardingEnabled: true,
                lastWebhookReceived: new Date().toISOString(),
                reconcileLagMins: 15,
                errorRatePercent: 0.2
            },
            {
                name: 'Ödeal',
                status: 'INACTIVE',
                onboardingEnabled: false,
                lastWebhookReceived: null,
                reconcileLagMins: 0,
                errorRatePercent: 0.0
            }
        ];

        return NextResponse.json({ providers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
