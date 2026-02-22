
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id } = await params;
        const template = await (prisma as any).routeTemplate.findUnique({
            where: { id },
            include: { stops: { include: { customer: { select: { id: true, name: true, city: true, district: true } } }, orderBy: { sequence: 'asc' } } }
        });
        if (!template) return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
        return NextResponse.json(template);
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
        const { name } = body;

        const updated = await (prisma as any).routeTemplate.update({
            where: { id },
            data: { ...(name ? { name } : {}) },
            include: { stops: { include: { customer: { select: { id: true, name: true, city: true, district: true } } } } }
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
        // Önce durakları sil
        await (prisma as any).routeTemplateStop.deleteMany({ where: { templateId: id } });
        await (prisma as any).routeTemplate.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
