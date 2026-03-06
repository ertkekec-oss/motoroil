import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStrictTenantId } from '@/services/contracts/tenantContext';

export async function GET(req: Request, { params }: { params: Promise<{ envelopeId: string }> }) {
    try {
        const tenantId = await getStrictTenantId();

        const env = await prisma.envelope.findUnique({
            where: { id: (await params).envelopeId },
            include: { documentVersion: true, recipients: true }
        });

        if (!env || env.tenantId !== tenantId) return NextResponse.json({ error: "Envelope not found" }, { status: 404 });

        const pdfReady = !!env.documentVersion.fileBlobId;

        return NextResponse.json({ success: true, status: env.status, pdfReady, recipientCount: env.recipients.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
