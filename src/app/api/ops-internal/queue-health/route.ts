import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const key = process.env.HEALTHCHECK_KEY;
    if (!key) {
        return NextResponse.json({ ok: false, error: "missing HEALTHCHECK_KEY" }, { status: 500 });
    }

    // Using absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://periodya.com';
    const targetUrl = `${baseUrl}/api/admin/marketplace/queue/health`;

    const r = await fetch(targetUrl, {
        headers: { "x-health-key": key },
        cache: "no-store",
    });

    const ct = r.headers.get("content-type") || "";
    const body = ct.includes("application/json")
        ? await r.json().catch(() => null)
        : await r.text().catch(() => "");

    return NextResponse.json(
        { ok: r.ok, upstreamStatus: r.status, body },
        { status: r.ok ? 200 : r.status }
    );
}
