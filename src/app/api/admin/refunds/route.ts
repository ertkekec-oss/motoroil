import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize, hasPermission } from "@/lib/auth";

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (!hasPermission(auth.user, "admin_manage")) {
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    const staff = auth.user;
    const url = new URL(req.url);

    const status = url.searchParams.get("status")?.toUpperCase(); // PENDING|SUCCEEDED|FAILED
    const q = url.searchParams.get("q")?.trim() || "";
    const take = Math.min(Number(url.searchParams.get("take") ?? 25), 50);
    const cursor = url.searchParams.get("cursor");

    const where: any = { supplierTenantId: staff.tenantId };
    if (status) where.status = status;

    if (q) {
        where.OR = [
            { orderId: { contains: q } },
            { providerRefundId: { contains: q, mode: 'insensitive' } },
            { id: { contains: q } },
        ];
    }

    const rows = await prisma.dealerRefund.findMany({
        where,
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            orderId: true,
            provider: true,
            amount: true,
            currency: true,
            status: true,
            reason: true,
            providerRefundId: true,
            createdByUserId: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
        ok: true,
        items: items.map((r) => ({
            ...r,
            amount: String(r.amount),
        })),
        nextCursor,
    });
}
