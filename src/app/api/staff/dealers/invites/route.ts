import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { randomToken, sha256Base64 } from "@/lib/network/crypto"
import { getSession } from "@/lib/auth"

function portalBasePath() {
    const p = process.env.NEXT_PUBLIC_PORTAL_BASE_PATH || "/network"
    return p.startsWith("/") ? p : `/${p}`
}

function publicBaseUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || ""
}

export async function POST(req: Request) {
    const session = await getSession();

    if (!session || !session.user || !session.user.tenantId) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
    }

    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    const body = await req.json().catch(() => ({}))

    const phoneE164 = body.phoneE164 ? String(body.phoneE164) : null
    const email = body.email ? String(body.email).toLowerCase() : null

    const expiresInDays = Number.isFinite(body.expiresInDays) ? Number(body.expiresInDays) : 7
    const maxRedemptions = Number.isFinite(body.maxRedemptions) ? Number(body.maxRedemptions) : 1

    if (expiresInDays < 1 || expiresInDays > 30) {
        return NextResponse.json({ ok: false, error: "INVALID_EXPIRES" }, { status: 400 })
    }
    if (maxRedemptions < 1 || maxRedemptions > 5) {
        return NextResponse.json({ ok: false, error: "INVALID_MAX_REDEMPTIONS" }, { status: 400 })
    }

    const raw = randomToken()
    const tokenHash = sha256Base64(raw)
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

    const invite = await prisma.dealerInvite.create({
        data: {
            supplierTenantId: tenantId,
            tokenHash,
            expiresAt,
            status: "ISSUED",
            issuedToPhoneE164: phoneE164,
            issuedToEmail: email,
            maxRedemptions,
            redemptionCount: 0,
            createdByUserId: userId,
        },
        select: { id: true, expiresAt: true },
    })

    const redeemUrl =
        publicBaseUrl()
            ? `${publicBaseUrl()}${portalBasePath()}/invite/${raw}`
            : `${portalBasePath()}/invite/${raw}`

    return NextResponse.json({
        ok: true,
        invite: {
            id: invite.id,
            expiresAt: invite.expiresAt,
            token: raw,
            redeemUrl,
        },
    })
}
