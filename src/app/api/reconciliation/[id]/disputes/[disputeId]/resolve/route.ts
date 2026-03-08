import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string, disputeId: string }> }) {
    const params = await props.params;
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tenantId = session.companyId || (session as any).tenantId;

        const { resolutionNote } = await req.json();

        const dispute = await prisma.reconciliationDispute.findUnique({
            where: { id: params.disputeId },
            include: { reconciliation: true }
        });

        if (!dispute || dispute.reconciliation.tenantId !== tenantId) {
            return NextResponse.json({ error: "Dispute not found or unauthorized" }, { status: 404 });
        }

        if (dispute.status === 'RESOLVED') {
            return NextResponse.json({ error: "Dispute is already resolved" }, { status: 400 });
        }

        await prisma.reconciliationDispute.update({
            where: { id: params.disputeId },
            data: {
                status: 'RESOLVED',
                resolutionNote: resolutionNote || 'Automatically marked as resolved'
            }
        });

        const activeDisputes = await prisma.reconciliationDispute.count({
            where: {
                reconciliationId: params.id,
                status: { not: 'RESOLVED' }
            }
        });

        if (activeDisputes === 0) {
            await prisma.reconciliation.update({
                where: { id: params.id },
                data: { status: 'VIEWED' } // Change back to viewed or sent so they can re-sign
            });
        }

        await prisma.reconciliationAuditEvent.create({
            data: {
                reconciliationId: params.id,
                action: 'DISPUTE_RESOLVED',
                createdByEmail: session.user?.email,
                metaJson: { disputeId: params.disputeId, resolutionNote }
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
