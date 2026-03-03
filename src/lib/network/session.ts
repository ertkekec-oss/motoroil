import prisma from "@/lib/prisma"
import { sha256Base64, randomToken } from "./crypto"
import { readDealerSessionToken } from "./cookies"

const SESSION_TTL_DAYS = 30

export async function createDealerSession(dealerUserId: string) {
    const raw = randomToken()
    const tokenHash = sha256Base64(raw)

    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

    await prisma.dealerSession.create({
        data: { dealerUserId, tokenHash, expiresAt },
    })

    return raw
}

export async function requireDealerSession() {
    const raw = await readDealerSessionToken()
    if (!raw) throw new Error("UNAUTHORIZED")

    const tokenHash = sha256Base64(raw)

    const sess = await prisma.dealerSession.findUnique({
        where: { tokenHash },
        select: { id: true, dealerUserId: true, expiresAt: true },
    })
    if (!sess) throw new Error("UNAUTHORIZED")

    if (sess.expiresAt.getTime() < Date.now()) {
        // expired cleanup
        await prisma.dealerSession.delete({ where: { tokenHash } }).catch(() => { })
        throw new Error("UNAUTHORIZED")
    }

    return sess
}

export async function revokeDealerSession(rawToken: string) {
    const tokenHash = sha256Base64(rawToken)
    await prisma.dealerSession.delete({ where: { tokenHash } }).catch(() => { })
}
