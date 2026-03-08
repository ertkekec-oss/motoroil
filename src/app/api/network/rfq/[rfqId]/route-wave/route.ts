import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { routeRFQWave } from '@/services/network/routing/rfqRouting';
import { triggerNextWaveIfNeeded } from '@/services/network/routing/fallback';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, props: { params: Promise<{ rfqId: string }> }) {
    const params = await props.params;
    try {
        const sessionAuth = await getSession();
        if (!sessionAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (sessionAuth as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const body = await request.json();
        const waveNumber = body.waveNumber || 1;
        const sessionId = body.sessionId;

        if (!sessionId) return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });

        const wave = await routeRFQWave(sessionId, waveNumber);

        // Optional: Preload the fallback logic check 
        // In a real scenario, this would happen in a cron job, but we'll put a mock trigger here just in case
        setTimeout(async () => {
            try {
                await triggerNextWaveIfNeeded(sessionId);
            } catch (e) {
                console.error("Scheduled Fallback Trigger Error:", e);
            }
        }, 1000 * 60 * 60);

        return NextResponse.json({ success: true, wave });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
