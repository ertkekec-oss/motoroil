import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { executeRelease } from '@/services/escrow/escrowReleaseEngine';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await getSession();

    try {
        const hold = await prisma.networkEscrowHold.findUnique({ where: { id: params.id } });
        if (!hold) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const released = await executeRelease(hold.id);

        return NextResponse.json({ success: true, message: 'Force released', data: released });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
