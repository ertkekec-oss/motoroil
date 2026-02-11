import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.user.companyId;

        // 1. Get all bank connections
        const connections = await (prisma as any).bankConnection.findMany({
            where: { companyId }
        });

        // 2. Get all manual bank kasalar (no connection linked yet)
        const manualKasalar = await (prisma as any).kasa.findMany({
            where: {
                companyId,
                type: 'bank',
                bankConnectionId: null
            }
        });

        // 3. Detect duplicates by IBAN
        const duplicates = [];
        for (const conn of connections) {
            const match = manualKasalar.find((k: any) => k.iban === conn.iban);
            if (match) {
                duplicates.push({
                    connectionId: conn.id,
                    bankName: conn.bankName,
                    iban: conn.iban,
                    kasaId: match.id,
                    kasaName: match.name
                });
            }
        }

        return NextResponse.json({
            success: true,
            duplicates
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
