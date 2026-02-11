import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bankName, iban, provider } = await req.json();

        if (!bankName || !iban) {
            return NextResponse.json({ error: 'Banka adı ve IBAN gerekli' }, { status: 400 });
        }

        const companyId = session.user.companyId;

        // 1. Create the Bank Connection
        const connection = await (prisma as any).bankConnection.create({
            data: {
                companyId,
                bankName,
                iban,
                provider: provider || 'MOCK_AGGR',
                providerRef: `EXT_${Math.random().toString(36).substr(2, 9)}`,
                currency: 'TRY',
                status: 'ACTIVE'
            }
        });

        // 2. Create the associated Kasa (Accounting SSOT)
        // This logic is also in BankSyncEngine, but doing it here for immediate feedback
        await (prisma as any).kasa.create({
            data: {
                companyId,
                name: `${bankName} (${iban.slice(-4)})`,
                type: 'bank',
                bankConnectionId: connection.id,
                currency: 'TRY',
                branch: 'Merkez',
                isActive: true,
                balance: 0
            }
        });

        return NextResponse.json({
            success: true,
            connection
        });

    } catch (error: any) {
        console.error('Bank Connection Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
