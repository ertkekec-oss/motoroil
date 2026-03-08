import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tenantId = session.companyId || (session as any).tenantId;
        const reconId = params.id;

        const recon = await prisma.reconciliation.findUnique({
            where: { id: reconId }
        });

        if (!recon || recon.tenantId !== tenantId) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        if (['SIGNED', 'DISPUTED'].includes(recon.status)) {
            return NextResponse.json({ error: "Cannot resend invite for completed or disputed reconciliation" }, { status: 400 });
        }

        await prisma.reconciliation.update({
            where: { id: reconId },
            data: { status: 'SENT', lastNotifiedAt: new Date() }
        });

        await prisma.reconciliationAuditEvent.create({
            data: {
                reconciliationId: reconId,
                action: 'INVITE_RESENT',
                createdByEmail: session.user?.email,
                metaJson: { ip: req.headers.get("x-forwarded-for") }
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
