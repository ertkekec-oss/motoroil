import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authorize, hasPermission } from "@/lib/auth"
import { auditLog } from "@/lib/audit/log"

export async function GET(req: Request) {
    const auth = await authorize()
    if (!auth.authorized || !auth.user) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
    }
    if (!hasPermission(auth.user, "admin_manage") && !hasPermission(auth.user, "tenant_manage_security") && !hasPermission(auth.user, "b2b_manage")) {
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
    }

    const config = await prisma.tenantPortalConfig.findUnique({
        where: { tenantId: auth.user.tenantId }
    })

    return NextResponse.json({ ok: true, dealerAuthMode: config?.dealerAuthMode || "PASSWORD_ONLY" })
}

export async function POST(req: Request) {
    const auth = await authorize()
    if (!auth.authorized || !auth.user) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
    }
    if (!hasPermission(auth.user, "admin_manage") && !hasPermission(auth.user, "tenant_manage_security") && !hasPermission(auth.user, "b2b_manage")) {
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const mode = body.dealerAuthMode

    if (!["PASSWORD_ONLY", "OTP_ONLY", "OTP_OR_PASSWORD"].includes(mode)) {
        return NextResponse.json({ ok: false, error: "INVALID_MODE" }, { status: 400 })
    }

    await prisma.tenantPortalConfig.upsert({
        where: { tenantId: auth.user.tenantId },
        update: { dealerAuthMode: mode },
        create: { tenantId: auth.user.tenantId, dealerAuthMode: mode }
    })

    await auditLog({
        tenantId: auth.user.tenantId,
        actorUserId: auth.user.id,
        type: "DEALER_AUTH_MODE_CHANGED",
        meta: { mode }
    }).catch(e => console.error(e))

    return NextResponse.json({ ok: true, dealerAuthMode: mode })
}
