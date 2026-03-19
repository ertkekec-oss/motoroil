import { NextResponse } from "next/server";
import { prismaRaw as prisma } from "@/lib/prisma";
import { requireDealerContext } from "@/lib/network/context";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const ctx = await requireDealerContext();
        const { orderId } = await params;

        const intent = await prisma.dealerPaymentIntent.findFirst({
            where: {
                orderId,
                dealerMembershipId: ctx.activeMembershipId, // Guard
                status: { in: ["SUCCEEDED", "PROCESSING", "PAID_PENDING_APPROVAL", "PAID"] }
            },
            select: {
                id: true,
                scope: true,
                status: true,
                provider: true,
                referenceCode: true,
                amount: true,
                currency: true,
                orderId: true,
                createdAt: true,
                verifiedAt: true,
                paidAmount: true,
                providerResult: true, // Optional: might want to omit or selectively filter
            },
            orderBy: { createdAt: "desc" }
        });

        if (!intent) {
            return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
        }

        return NextResponse.json({
            ok: true,
            intent: {
                ...intent,
                amount: String(intent.amount),
                paidAmount: intent.paidAmount ? String(intent.paidAmount) : null,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: "INTENT_FETCH_FAILED" }, { status: 500 });
    }
}
