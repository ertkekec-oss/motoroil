import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { submitTrustScoreRecalc } from "@/services/finance/trust/recalcWorker";

const prisma = new PrismaClient();

// Only platform finance admins
export async function POST(req: NextRequest, context: any) {
    const params = await context.params;
    // Basic Auth Check Example - Replace with your Admin Middleware
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { sellerTenantId } = params;

        // Perform Recalc
        const result = await submitTrustScoreRecalc(sellerTenantId, 'MANUAL_ADMIN');

        // Audit Log Add
        await prisma.financeAuditLog.create({
            data: {
                tenantId: sellerTenantId,
                action: 'MANUAL_TRUST_SCORE_RECALC',
                actor: 'PLATFORM_ADMIN',
                entityId: sellerTenantId,
                entityType: 'SellerTrustScore',
                payloadJson: { source: 'Admin API', resultId: result.id }
            }
        });

        return NextResponse.json({ success: true, jobId: result.id });
    } catch (e: any) {
        if (e.message === 'ALREADY_SUCCEEDED') {
            return NextResponse.json({ message: 'Recalc already running or ran recently for today.' });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
