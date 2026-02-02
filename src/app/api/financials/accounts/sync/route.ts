import { NextResponse } from 'next/server';
import { repairAccounting } from '@/lib/accounting';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        console.log('[Sync API] Starting manual repair...');
        await repairAccounting();
        console.log('[Sync API] Repair completed.');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Sync API] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
