import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const take = parseInt(searchParams.get("take") || "20", 10);

    try {
        const queryArgs: any = {
            where: { sellerTenantId: auth.user.companyId },
            take: take > 50 ? 50 : take,
            orderBy: [{ issuedAt: "desc" }, { id: "asc" }],
            include: {
                subscription: { select: { billingBlocked: true } }
            }
        };

        if (cursor) {
            queryArgs.cursor = { id: cursor };
            queryArgs.skip = 1;
        }

        const invoices = await prisma.boostInvoice.findMany(queryArgs);

        let healthData = { status: "CURRENT", billingBlocked: false, graceEndsAt: null, overdueSince: null };
        const activeBlocked = invoices.find(i => i.collectionStatus !== "CURRENT" && i.collectionStatus !== "PAID" && i.status !== "PAID");

        if (activeBlocked) {
            healthData.status = activeBlocked.collectionStatus;
            healthData.billingBlocked = activeBlocked.subscription?.billingBlocked || false;
            if (activeBlocked.graceEndsAt) healthData.graceEndsAt = activeBlocked.graceEndsAt as any;
            if (activeBlocked.overdueAt) healthData.overdueSince = activeBlocked.overdueAt as any;
        }

        const nextCursor = invoices.length === queryArgs.take ? invoices[invoices.length - 1].id : null;

        return NextResponse.json({
            health: healthData,
            items: invoices.map(i => ({
                id: i.id,
                period: i.periodKey,
                amount: i.amount,
                status: i.status === "ISSUED" ? i.collectionStatus : i.status,
                dueAt: i.dueAt,
                paidAt: i.paidAt,
                createdAt: i.createdAt,
                ledgerGroupId: i.ledgerGroupId
            })),
            nextCursor
        });
    } catch (e: any) {
        console.error("Boost Invoices API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
