
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const body = await req.json();
        const { requestId, action } = body; // action: 'APPROVE' or 'REJECT'

        if (!requestId || !['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const request = await (prisma as any).customerLocationRequest.findUnique({
            where: { id: requestId },
            include: { customer: true }
        });

        if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        if (request.status !== 'PENDING') return NextResponse.json({ error: 'Request already processed' }, { status: 400 });

        if (action === 'APPROVE') {
            // Update Customer Location
            await prisma.$transaction([
                (prisma as any).customer.update({
                    where: { id: request.customerId },
                    data: {
                        lat: request.requestedLat,
                        lng: request.requestedLng,
                        locationPinnedAt: new Date()
                    }
                }),
                (prisma as any).customerLocationRequest.update({
                    where: { id: requestId },
                    data: { status: 'APPROVED' }
                })
            ]);
        } else {
            await (prisma as any).customerLocationRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED' }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
