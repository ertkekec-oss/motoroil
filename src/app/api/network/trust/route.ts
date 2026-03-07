import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const profile = await prisma.networkCompanyProfile.findUnique({
            where: { tenantId },
            include: { trustScore: true }
        });

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        return NextResponse.json({
            success: true,
            trustScore: profile.trustScore,
            completion: profile.profileCompleteness
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
