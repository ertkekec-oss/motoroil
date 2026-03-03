import { NextResponse } from "next/server"
import { readDealerSessionToken, clearDealerSessionCookie, clearActiveMembershipCookie } from "@/lib/network/cookies"
import { revokeDealerSession } from "@/lib/network/session"

export async function POST() {
    const raw = await readDealerSessionToken()
    if (raw) await revokeDealerSession(raw)

    await clearDealerSessionCookie()
    await clearActiveMembershipCookie()

    return NextResponse.json({ ok: true })
}
