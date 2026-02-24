
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const events = await prisma.securityEvent.findMany({
            orderBy: {
                timestamp: 'desc'
            },
            take: 200
        });

        return NextResponse.json({ success: true, events });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const companyId = auth.user.companyId;

        const body = await request.json();
        const { detectedPhrase, confidence, hasSaleInLast5Min, branch, staff, details } = body;

        const event = await prisma.securityEvent.create({
            data: {
                detectedPhrase,
                confidence: Number(confidence),
                hasSaleInLast5Min: Boolean(hasSaleInLast5Min),
                branch,
                staff,
                details,
                companyId
            }
        });

        return NextResponse.json({ success: true, event });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            await prisma.securityEvent.delete({
                where: { id }
            });
        } else {
            await prisma.securityEvent.deleteMany({});
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
