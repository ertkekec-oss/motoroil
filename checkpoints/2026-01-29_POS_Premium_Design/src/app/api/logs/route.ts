
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 100
        });

        return NextResponse.json({ success: true, logs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, entity, entityId, details, userId, userName } = body;

        const log = await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                details: typeof details === 'object' ? JSON.stringify(details) : details,
                userId,
                userName
            }
        });

        return NextResponse.json({ success: true, log });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
