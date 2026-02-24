import type { NextRequest } from "next/server";

export function getPublicClientIp(req: NextRequest): string | null {
    // NextRequest.ip works in Vercel/Edge; otherwise check X-Forwarded-For
    const direct = (req as any).ip;
    if (direct) return direct;

    const xff = req.headers.get("x-forwarded-for");
    if (!xff) return null;

    // X-Forwarded-For: <client>, <proxy1>, <proxy2>
    return xff.split(",")[0]?.trim() ?? null;
}
