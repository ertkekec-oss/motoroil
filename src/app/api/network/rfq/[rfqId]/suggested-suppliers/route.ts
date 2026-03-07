import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { suggestSuppliersForRFQ } from '@/services/network/recommendation/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { rfqId: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const rfqId = params.rfqId;
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('category') || undefined;
        const location = searchParams.get('location') || undefined;

        const suppliers = await suggestSuppliersForRFQ(rfqId, categoryId, location);

        return NextResponse.json({ success: true, suppliers });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
