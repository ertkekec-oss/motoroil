import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tenantId = session.companyId || (session as any).tenantId;

        const envelope = await prisma.signatureEnvelope.findUnique({
            where: { id: params.id }
        });

        if (!envelope || envelope.tenantId !== tenantId) {
            return NextResponse.json({ error: "Envelope not found or access denied" }, { status: 404 });
        }

        if (['COMPLETED', 'REJECTED', 'CANCELED'].includes(envelope.status)) {
            return NextResponse.json({ error: "Envelope cannot be canceled in its current state" }, { status: 400 });
        }

        const updated = await prisma.signatureEnvelope.update({
            where: { id: params.id },
            data: { status: 'CANCELED' }
        });

        await prisma.signatureAuditEvent.create({
            data: {
                envelopeId: envelope.id,
                tenantId: tenantId,
                action: 'ENVELOPE_CANCELED',
                metaJson: { userId: session.user?.id }
            }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
