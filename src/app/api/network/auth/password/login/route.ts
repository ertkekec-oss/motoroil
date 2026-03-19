import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { createDealerSession } from "@/lib/network/session"
import { setDealerSessionCookie, setActiveMembershipCookie } from "@/lib/network/cookies"
import { comparePassword } from "@/lib/auth"
import { consumeRateLimit, RateLimitError, cleanupRateLimitEvents } from "@/lib/network/rateLimit"
import { getClientIp } from "@/lib/network/ip"

export async function POST(req: Request) {
    const { email, password, supplierTenantId } = await req.json().catch(() => ({}))
    if (!email || !password || !supplierTenantId) {
        return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 })
    }

    const ip = await getClientIp()

    try {
        await consumeRateLimit({ key: `pwd:ip:5m:${ip}`, windowMs: 5 * 60_000, limit: 20 })
        await consumeRateLimit({ key: `pwd:email:1m:${email}`, windowMs: 60_000, limit: 5 })
    } catch (e: any) {
        if (e instanceof RateLimitError) {
            return NextResponse.json(
                { ok: false, error: "RATE_LIMITED", retryAfterSec: e.retryAfterSec },
                { status: 429, headers: { "Retry-After": String(e.retryAfterSec) } }
            )
        }
        return NextResponse.json({ ok: false, error: "RATE_LIMIT_CHECK_FAILED" }, { status: 500 })
    }

    if (Math.random() < 0.01) cleanupRateLimitEvents().catch(() => { })

    const dealerUser = await prisma.dealerUser.findUnique({
        where: { email },
        select: { id: true, passwordHash: true, defaultDealerCompanyId: true },
    })

    if (!dealerUser || !dealerUser.passwordHash) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND_OR_NO_PASSWORD" }, { status: 401 })
    }

    const valid = await comparePassword(password, dealerUser.passwordHash)
    if (!valid) {
        return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 })
    }

    const membershipWhere: any = {
        dealerUserId: dealerUser.id,
        status: "ACTIVE"
    };

    if (supplierTenantId && supplierTenantId !== "motoroils") {
        membershipWhere.tenantId = supplierTenantId;
    }

    const membership = await prisma.dealerMembership.findFirst({
        where: membershipWhere,
        select: { id: true, tenantId: true }
    })

    if (!membership) {
        return NextResponse.json({ ok: false, error: "NO_ACTIVE_MEMBERSHIP_FOR_TENANT" }, { status: 403 })
    }

    const config = await prisma.tenantPortalConfig.findUnique({
        where: { tenantId: membership.tenantId },
        select: { dealerAuthMode: true }
    })
    const authMode = config?.dealerAuthMode || "PASSWORD_ONLY"

    if (authMode === "OTP_ONLY") {
        return NextResponse.json({ ok: false, error: "AUTH_MODE_OTP_ONLY" }, { status: 403 })
    }

    const rawSession = await createDealerSession(dealerUser.id)

    await setDealerSessionCookie(rawSession)
    await setActiveMembershipCookie(membership.id)

    return NextResponse.json({ ok: true })
}
