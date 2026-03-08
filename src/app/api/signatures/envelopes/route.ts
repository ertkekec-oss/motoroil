import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSignatureInvitation } from "@/services/signatures/invitation";
import { embedVerificationQRCode } from "@/services/signatures/qrCodeService";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tenantId = session.companyId || (session as any).tenantId;
        const userId = session.user?.id;
        const userEmail = session.user?.email;

        const body = await req.json();
        const { title, documentKey, documentFileName, recipients, category, otpRequired } = body;

        if (!title || !documentKey || !recipients || recipients.length === 0) {
            return NextResponse.json({ error: "Missing required fields or recipients" }, { status: 400 });
        }

        // Create the envelope
        const envelope = await prisma.signatureEnvelope.create({
            data: {
                tenantId,
                companyId: session.companyId || null,
                title,
                documentKey,
                documentFileName: documentFileName || "belge.pdf",
                documentCategory: category || "CONTRACT",
                status: 'PENDING',
                createdByUserId: userId,
                otpRequired: otpRequired === true,
                recipients: {
                    create: recipients.map((r: any, idx: number) => ({
                        email: r.email,
                        phone: r.phone || null,
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

        // Add QR Code asynchronously (wait for it to ensure DB is clean, or just await it)
        await embedVerificationQRCode(envelope.id, envelope.documentKey);

        // Trigger invitations immediately upon creation
        try {
            await sendSignatureInvitation(envelope.id);
        } catch (inviteError) {
            console.error("Failed to send invitations for envelope", envelope.id, inviteError);
            // We shouldn't fail the whole envelope creation just because the email failed, but log it
        }

        return NextResponse.json({ success: true, envelope });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
