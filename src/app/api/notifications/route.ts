
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export async function GET(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const notifications = await (prisma as any).notification.findMany({
            where: { userId: ctx.userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        return NextResponse.json(notifications);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const data = await req.json();
        const notification = await (prisma as any).notification.create({
            data: {
                userId: ctx.userId,
                type: data.type || 'INFO',
                title: data.title || 'Bildirim',
                message: data.message || data.text,
                link: data.link
            }
        });
        return NextResponse.json(notification);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const { id, isRead } = data;

        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead }
        });
        return NextResponse.json(notification);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            await prisma.notification.delete({ where: { id } });
        } else {
            // Delete all notifications
            await prisma.notification.deleteMany({});
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
