import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import prisma from '@/lib/prisma';
import { BankSyncEngine } from '@/services/banking/bank-sync-engine';

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        if (!ctx.companyId && ctx.tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const { connectionId } = await req.json().catch(() => ({}));
        let results;

        if (connectionId) {
            const conn = await (prisma as any).bankConnection.findUnique({
                where: { id: connectionId }
            });
            if (!conn || (ctx.tenantId !== 'PLATFORM_ADMIN' && conn.companyId !== ctx.companyId)) {
                return NextResponse.json({ error: 'Bağlantı bulunamadı' }, { status: 404 });
            }
            results = [await BankSyncEngine.syncConnection(conn)];
        } else {
            results = await BankSyncEngine.syncAll(ctx.companyId || '');
        }

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error('Bank Sync API Error:', error);
        if (error.status) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
