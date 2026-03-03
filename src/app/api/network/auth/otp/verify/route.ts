import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sha256Base64 } from "@/lib/network/crypto"
import { createDealerSession } from "@/lib/network/session"
import { setDealerSessionCookie, setActiveMembershipCookie } from "@/lib/network/cookies"

const MAX_ATTEMPTS = 5

export async function POST(req: Request) {
    const { phoneE164, code, supplierTenantId } = await req.json().catch(() => ({}))
    if (!phoneE164 || !code || !supplierTenantId) {
        return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 })
    }

    const config = await prisma.tenantPortalConfig.findUnique({
        where: { tenantId: supplierTenantId },
        select: { dealerAuthMode: true }
    })
    const authMode = config?.dealerAuthMode || "PASSWORD_ONLY"

    if (authMode === "PASSWORD_ONLY") {
        return NextResponse.json({ ok: false, error: "AUTH_MODE_PASSWORD_ONLY" }, { status: 403 })
    }

    const challenge = await prisma.dealerOtpChallenge.findUnique({
        where: { phoneE164 },
        select: { codeHash: true, expiresAt: true, attempts: true },
    })
    if (!challenge) {
        return NextResponse.json({ ok: false, error: "OTP_INVALID" }, { status: 401 })
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
        return NextResponse.json({ ok: false, error: "OTP_EXPIRED" }, { status: 401 })
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
        return NextResponse.json({ ok: false, error: "OTP_LOCKED" }, { status: 429 })
    }

    const ok = sha256Base64(String(code)) === challenge.codeHash
    if (!ok) {
        await prisma.dealerOtpChallenge.update({
            where: { phoneE164 },
            data: { attempts: { increment: 1 } },
        })
        return NextResponse.json({ ok: false, error: "OTP_INVALID" }, { status: 401 })
    }

    // OTP tek kullanımlık
    await prisma.dealerOtpChallenge.delete({ where: { phoneE164 } }).catch(() => { })

    // V1 Invite-only rule: Only login existing users (created previously by Invite Redeem)
    const dealerUser = await prisma.dealerUser.findUnique({
        where: { phoneE164 },
        select: { id: true, defaultDealerCompanyId: true },
    })

    if (!dealerUser) {
        return NextResponse.json({ ok: false, error: "NOT_INVITED" }, { status: 403 })
    }

    const rawSession = await createDealerSession(dealerUser.id)

    const firstMembership = await prisma.dealerMembership.findFirst({
        where: {
            dealerUserId: dealerUser.id,
            status: "ACTIVE"
        },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
    })

    const res = NextResponse.json({ ok: true, needsMembershipSelect: !firstMembership })

    await setDealerSessionCookie(rawSession)
    if (firstMembership) {
        await setActiveMembershipCookie(firstMembership.id)
    }

    return res
}
