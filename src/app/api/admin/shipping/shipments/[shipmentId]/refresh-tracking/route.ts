import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { refreshTracking } from '@/services/shipping/core/trackingService';

// Disable default caching for POST requests handled by Vercel sometimes implicitly if not careful
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, props: { params: Promise<{ shipmentId: string }> }) {
    const params = await props.params;
    const user = await getSession();

    try {
        await refreshTracking(params.shipmentId);
        return NextResponse.json({ success: true, message: 'Tracking refreshed successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
