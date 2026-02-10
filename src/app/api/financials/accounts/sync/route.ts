import { NextResponse } from 'next/server';
import { repairAccounting } from '@/lib/accounting';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const session = await (await import('@/lib/auth')).getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }

        const companyId = session.tenantId;
        const branch = session.branch || 'Merkez';

        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Firma bilgisi bulunamadı.' }, { status: 400 });
        }

        console.log(`[Sync API] Starting manual repair for Company: ${companyId}, Branch: ${branch}...`);
        // STRICT TENANT ISOLATION: Pass companyId to repair function
        await repairAccounting(branch, companyId);

        console.log('[Sync API] Repair completed.');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Sync API] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
