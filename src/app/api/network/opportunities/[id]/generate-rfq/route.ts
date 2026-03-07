import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateAutoRFQ } from '@/services/network/inventory/rfqDraftEngine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const result = await generateAutoRFQ(params.id, tenantId);

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.message.includes('Unauthorized') ? 403 : 500 });
    }
}
