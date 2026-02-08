
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Check if stop belongs to user company
        const stop = await (prisma as any).routeStop.findUnique({
            where: { id },
            include: { route: { select: { companyId: true } } }
        });

        if (!stop) return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
        if (session.tenantId !== stop.route.companyId && session.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await (prisma as any).routeStop.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
