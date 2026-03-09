import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const tenantId = session.companyId || (session as any).tenantId;
        const body = await req.json();

        const { documentId, version, methodUsed, otpCode } = body;

        if (!documentId || !version || !methodUsed) {
            return new NextResponse('Missing parameters', { status: 400 });
        }

        const doc = await prisma.platformDocument.findUnique({
            where: { id: documentId }
        });

        if (!doc) {
            return new NextResponse('Document not found', { status: 404 });
        }

        if (doc.version !== version) {
            return new NextResponse('Document version mismatch. Reload required.', { status: 400 });
        }

        if (doc.approvalMethod === 'OTP') {
            if (!otpCode) {
                return new NextResponse('OTP is required for this document', { status: 400 });
            }
            // For now, simple mock check. Since we don't have a real SMS OTP gateway integrated for this yet,
            // we will accept "123456" as success or random code for testing.
            if (otpCode !== '123456') { // In real app, verify against Redis/DB
                return new NextResponse('Invalid OTP code', { status: 400 });
            }
        }

        let ipAddress = null;
        try {
            ipAddress = req.headers.get('x-forwarded-for') || 'Unknown';
        } catch (e) { }

        let userAgent = null;
        try {
            userAgent = req.headers.get('user-agent') || 'Unknown';
        } catch (e) { }

        await prisma.tenantDocumentApproval.upsert({
            where: {
                tenantId_documentId_documentVersion: {
                    tenantId,
                    documentId,
                    documentVersion: version
                }
            },
            update: {},
            create: {
                tenantId,
                documentId,
                documentVersion: version,
                approvedByUserId: session.user.id || session.userId,
                methodUsed: methodUsed as any,
                otpVerifiedToken: methodUsed === 'OTP' ? 'SIMULATED-OTP-TOKEN-1234' : null,
                ipAddress,
                userAgent
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Platform Docs Approve Error]:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
