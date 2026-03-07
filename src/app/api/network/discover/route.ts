import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listDiscoverableCompanies } from '@/services/network/engine/discovery';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('q') || undefined;
        const country = searchParams.get('country') || undefined;

        const profiles = await listDiscoverableCompanies(tenantId, { search, country });

        return NextResponse.json({ success: true, count: profiles.length, profiles });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
