
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
                        customer: { select: { id: true, name: true, city: true, district: true, phone: true } }
                    },
                    orderBy: { sequence: 'asc' }
                }
            }
        });

        if (!route) {
            return NextResponse.json({ error: 'Rota bulunamadı' }, { status: 404 });
        }

        return NextResponse.json(route);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { name, date, status, staffId } = body;

        const updated = await (prisma as any).route.update({
            where: { id },
            data: {
                ...(name ? { name } : {}),
                ...(date ? { date: new Date(date) } : {}),
                ...(status ? { status } : {}),
                ...(staffId ? { staffId } : {}),
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Önce durakları sil, sonra rotayı sil
        await (prisma as any).routeStop.deleteMany({ where: { routeId: id } });
        await (prisma as any).route.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
