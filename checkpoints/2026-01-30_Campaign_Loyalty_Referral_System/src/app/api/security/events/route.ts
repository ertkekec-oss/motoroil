
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
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
        const body = await request.json();
        const { detectedPhrase, confidence, hasSaleInLast5Min, branch, staff, details } = body;

        const event = await prisma.securityEvent.create({
            data: {
                detectedPhrase,
                confidence: Number(confidence),
                hasSaleInLast5Min: Boolean(hasSaleInLast5Min),
                branch,
                staff,
                details
            }
        });

        return NextResponse.json({ success: true, event });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
