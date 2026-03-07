import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { recalculateNetworkTrustScore } from '@/services/network/trust/score';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        const isPlatformAdmin = session?.role === 'SUPER_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN' || session?.role === 'ADMIN';

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin Access Required' }, { status: 403 });
        }

        const profileId = params.id;
        const score = await recalculateNetworkTrustScore(profileId);

        return NextResponse.json({ success: true, score });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
