import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    let ctx;
    try {
        ctx = await getRequestContext(req);
        const notifications = await (prisma as any).notification.findMany({
            where: { userId: ctx.userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        return apiResponse(notifications, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}

export async function POST(req: NextRequest) {
    let ctx;
    try {
        ctx = await getRequestContext(req);
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
        return apiResponse(notification, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}

export async function PUT(req: NextRequest) {
    let ctx;
    try {
        ctx = await getRequestContext(req);
        const data = await req.json();
        const { id, isRead } = data;

        // Security: Ensure the notification belongs to the user
        const existing = await (prisma as any).notification.findUnique({ where: { id } });
        if (!existing) return apiError({ message: 'Notification not found', status: 404 }, ctx.requestId);
        if (existing.userId !== ctx.userId) return apiError({ message: 'Unauthorized', status: 403 }, ctx.requestId);

        const notification = await (prisma as any).notification.update({
            where: { id },
            data: { isRead }
        });
        return apiResponse(notification, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}

export async function DELETE(req: NextRequest) {
    let ctx;
    try {
        ctx = await getRequestContext(req);
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const existing = await (prisma as any).notification.findUnique({ where: { id } });
            if (!existing) return apiError({ message: 'Notification not found', status: 404 }, ctx.requestId);
            if (existing.userId !== ctx.userId) return apiError({ message: 'Unauthorized', status: 403 }, ctx.requestId);

            await (prisma as any).notification.delete({ where: { id } });
        } else {
            // Delete all for this user only
            await (prisma as any).notification.deleteMany({
                where: { userId: ctx.userId }
            });
        }
        return apiResponse({ success: true }, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}
