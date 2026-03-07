import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { pollingWorker } from '@/services/shipping/sync/pollingWorker';

export async function POST(request: NextRequest) {
    const user = await getSession();
    // Verify admin role

    try {
        const result = await pollingWorker('HEPSIJET');
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
