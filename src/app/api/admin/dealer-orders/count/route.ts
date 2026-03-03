import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize, hasPermission } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const auth = await authorize();
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    if (!hasPermission(auth.user, "admin_manage") && !hasPermission(auth.user, "b2b_manage")) {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 },
      );
    }
    const staff = auth.user;
    const url = new URL(req.url);
    const statusParam = (
      url.searchParams.get("status") || "PENDING_APPROVAL"
    ).toUpperCase();
    const statuses = statusParam.split(",");

    // sadece B2B dealer siparişleri
    const count = await prisma.order.count({
      where: {
        company: { tenantId: staff.tenantId },
        salesChannel: "DEALER_B2B",
        status: { in: statuses },
      },
    });

    return NextResponse.json({ ok: true, count });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "FETCH_FAILED" },
      { status: 500 },
    );
  }
}

