import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectEscrowForAdmin } from '@/services/escrow/escrowProjection';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const user = await getSession();

    try {
        const escrow = await prisma.networkEscrowHold.findUnique({
            where: { id: params.id },
            include: {
                lifecycleEvents: { orderBy: { createdAt: 'desc' } }
            }
        });

        if (!escrow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Lazy load account details to avoid join explosion
        if (escrow.buyerTenantId) {
            const acc = await prisma.networkEscrowAccount.findUnique({
                where: { tenantId: escrow.buyerTenantId },
                include: { transactions: { where: { orderId: escrow.orderId } } }
            });
            (escrow as any).escrowAccount = acc;
        }

        return NextResponse.json({ data: projectEscrowForAdmin(escrow) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
