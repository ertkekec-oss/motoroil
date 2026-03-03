import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireDealerSession } from "@/lib/network/session"
import { setActiveMembershipCookie } from "@/lib/network/cookies"

export async function POST(req: Request) {
    const session = await requireDealerSession()

    const { membershipId } = await req.json().catch(() => ({}))
    if (!membershipId || typeof membershipId !== "string") {
        return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 })
    }

    const dealerUser = await prisma.dealerUser.findUnique({
        where: { id: session.dealerUserId },
        select: { id: true }, // Not requiring isActive on DealerUser since it's not in schema
    })

    if (!dealerUser) {
        return NextResponse.json({ ok: false, error: "USER_INACTIVE" }, { status: 403 })
    }

    const membership = await prisma.dealerMembership.findFirst({
        where: {
            id: membershipId,
            dealerUserId: dealerUser.id,
            status: "ACTIVE",
        },
        select: { id: true },
    })

    if (!membership) {
        return NextResponse.json({ ok: false, error: "INVALID_MEMBERSHIP" }, { status: 403 })
    }

    await setActiveMembershipCookie(membership.id)
    return NextResponse.json({ ok: true })
}
