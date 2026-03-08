import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tenantId = session.companyId || (session as any).tenantId;
        const userId = session.user?.id;
        const userEmail = session.user?.email;

        const body = await req.json();
        const { title, documentKey, documentFileName, recipients, category } = body;

        if (!title || !documentKey || !recipients || recipients.length === 0) {
            return NextResponse.json({ error: "Missing required fields or recipients" }, { status: 400 });
        }

        // Create the envelope
        const envelope = await prisma.signatureEnvelope.create({
            data: {
                tenantId,
                title,
                documentKey,
                documentFileName: documentFileName || "belge.pdf",
                documentCategory: category || "CONTRACT",
                status: 'PENDING',
                createdByUserId: userId,
                recipients: {
                    create: recipients.map((r: any, idx: number) => ({
                        email: r.email,
                        name: r.name,
                        role: r.role || 'SIGNER',
                        status: 'PENDING',
                        orderIndex: idx + 1
                    }))
                }
            }
        });

        // Add Event
        await prisma.signatureAuditEvent.create({
            data: {
                tenantId,
                envelopeId: envelope.id,
                action: 'ENVELOPE_CREATED',
                metaJson: { createdBy: userEmail, recipients: recipients.length }
            }
        });

        return NextResponse.json({ success: true, envelope });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
