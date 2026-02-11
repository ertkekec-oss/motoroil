import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { kasaId, connectionId } = await req.json();

        if (!kasaId || !connectionId) {
            return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
        }

        // Link the manual kasa to the bank connection
        await (prisma as any).kasa.update({
            where: { id: kasaId },
            data: {
                bankConnectionId: connectionId
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Hesaplar başarıyla birleştirildi.'
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
