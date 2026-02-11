import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { BankSyncEngine } from '@/services/banking/bank-sync-engine';

export async function POST() {
    try {
        const session = await getSession();
        if (!session || !session.user.companyId) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const results = await BankSyncEngine.syncAll(session.user.companyId);

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error('Bank Sync API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
