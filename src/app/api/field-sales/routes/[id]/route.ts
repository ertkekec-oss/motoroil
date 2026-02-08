
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        const route = await (prisma as any).route.findUnique({
            where: { id },
            include: {
                staff: { select: { id: true, name: true } },
                stops: {
                    include: {
                        customer: { select: { id: true, name: true, city: true, district: true } }
                    },
                    orderBy: { sequence: 'asc' }
                }
            }
        });

        if (!route) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        return NextResponse.json(route);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await (prisma as any).route.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
