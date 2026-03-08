import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tenantId = session.companyId || (session as any).tenantId;
        const userEmail = session.user?.email || "unknown";

        const { accountId, periodStart, periodEnd, type, totalDebit, totalCredit, balanceRaw, currency, counterpartyEmail, counterpartyName, counterpartyPhone } = await req.json();

        if (!accountId || !periodEnd || !type || !counterpartyEmail) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const recon = await prisma.reconciliation.create({
            data: {
                tenantId,
                accountId,
                periodStart: periodStart ? new Date(periodStart) : null,
                periodEnd: new Date(periodEnd),
                reconciliationType: type,
                totalDebit: totalDebit || 0,
                totalCredit: totalCredit || 0,
                balanceRaw: balanceRaw || 0,
                currency: currency || "TRY",
                status: 'SENT',
                createdByUserId: session.user?.id,
                counterparties: {
                    create: {
                        email: counterpartyEmail,
                        name: counterpartyName,
                        phone: counterpartyPhone,
                        status: 'PENDING'
                    }
                }
            }
        });

        await prisma.reconciliationAuditEvent.create({
            data: {
                reconciliationId: recon.id,
                action: 'RECONCILIATION_CREATED_AND_SENT',
                createdByEmail: userEmail,
                ipAddress: req.headers.get("x-forwarded-for") || '127.0.0.1'
            }
        });

        return NextResponse.json({ success: true, reconciliation: recon });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
