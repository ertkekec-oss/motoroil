import { cookies } from "next/headers"

function portalBasePath() {
    const p = process.env.NEXT_PUBLIC_PORTAL_BASE_PATH || "/network"
    return p.startsWith("/") ? p : `/${p}`
}

export const COOKIE = {
    DEALER_SESSION: "pdya_ds",
    ACTIVE_MEMBERSHIP: "pdya_nm",
} as const

export async function setDealerSessionCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE.DEALER_SESSION, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
    })
}

export async function clearDealerSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE.DEALER_SESSION, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    })
}

export async function setActiveMembershipCookie(membershipId: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE.ACTIVE_MEMBERSHIP, membershipId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
    })
}

export async function clearActiveMembershipCookie() {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE.ACTIVE_MEMBERSHIP, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    })
}

export async function readDealerSessionToken() {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE.DEALER_SESSION)?.value || null
}

export async function readActiveMembershipId() {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE.ACTIVE_MEMBERSHIP)?.value || null
}
