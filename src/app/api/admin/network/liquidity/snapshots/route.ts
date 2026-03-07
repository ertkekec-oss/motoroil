import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { LiquidityProjection } from '@/services/network/liquidity/liquidityProjection';

export async function GET(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const snapshots = await LiquidityProjection.getCategorySnapshots();
        return NextResponse.json({ success: true, count: snapshots.length, snapshots });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch network snapshots' }, { status: 500 });
    }
}
