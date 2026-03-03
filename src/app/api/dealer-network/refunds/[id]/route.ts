import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize, hasPermission } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (!hasPermission(auth.user, "admin_manage") && !hasPermission(auth.user, "b2b_manage")) {
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    const staff = auth.user;
    const { id } = await params;

    const r = await prisma.dealerRefund.findFirst({
        where: { id, supplierTenantId: staff.tenantId },
        select: {
            id: true,
            orderId: true,
            provider: true,
            amount: true,
            currency: true,
            status: true,
            reason: true,
            idempotencyKey: true,
            providerRefundId: true,
            providerResult: true,
            createdByUserId: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!r) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({
        ok: true,
        refund: { ...r, amount: String(r.amount) },
    });
}
