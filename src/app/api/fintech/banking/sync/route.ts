import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { BankSyncEngine } from '@/services/banking/bank-sync-engine';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user.companyId) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const { connectionId } = await req.json().catch(() => ({}));
        let results;

        if (connectionId) {
            const conn = await (prisma as any).bankConnection.findUnique({
                where: { id: connectionId }
            });
            if (!conn || conn.companyId !== session.user.companyId) {
                return NextResponse.json({ error: 'Bağlantı bulunamadı' }, { status: 404 });
            }
            results = [await BankSyncEngine.syncConnection(conn)];
        } else {
            results = await BankSyncEngine.syncAll(session.user.companyId);
        }

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error('Bank Sync API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
