import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireDealerContext } from "@/lib/network/context";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const ctx = await requireDealerContext();
        const id = params.id;

        const intent = await prisma.dealerPaymentIntent.findFirst({
            where: {
                id,
                dealerMembershipId: ctx.activeMembershipId, // ✅ IDOR guard
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
            },
        });

        if (!intent) {
            return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
        }

        return NextResponse.json({
            ok: true,
            intent: {
                ...intent,
                amount: typeof intent.amount === "object" ? String(intent.amount) : String(intent.amount),
                paidAmount: intent.paidAmount ? String(intent.paidAmount) : null,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: "INTENT_FETCH_FAILED" }, { status: 500 });
    }
}
