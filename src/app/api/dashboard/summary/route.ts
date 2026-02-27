import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import crypto from "crypto";
import { getDashboardSummaryProvider } from "@/services/dashboard/summaryProvider";

// In-memory rate limiting and cache for serverless environments (best-effort)
const summaryCache = new Map<string, { data: any; expiresAt: number }>();
const rateLimits = new Map<string, { count: number; expiresAt: number }>();

function generateETag(data: any): string {
    return `"${crypto.createHash("md5").update(JSON.stringify(data)).digest("hex")}"`;
}

// Simple PII redaction middleware to ensure no leaks
function redactPII(data: any) {
    // Explicitly stripping known PII fields just as an extra boundary guard
    const { email, phone, taxNo, ...safeData } = data as any;
    return safeData;
}

export async function GET(req: Request) {
    const startTime = Date.now();
    try {
        const session: any = await getSession();
        const user = session?.user || session;

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const companyId = user.companyId || session?.companyId || session?.settings?.companyId;

        if (!companyId && user.role !== "SUPER_ADMIN" && user.role !== "admin") {
            return NextResponse.json({ error: "No company context" }, { status: 403 });
        }

        const roleGroup = user.role || "GUEST";
        const requestKey = `${companyId || "global"}:${roleGroup}`;

        // Rate limiting: 60 requests per 5 minutes per company+role
        const now = Date.now();
        const rl = rateLimits.get(requestKey);
        if (rl && rl.expiresAt > now) {
            if (rl.count >= 60) {
                return NextResponse.json({ error: "Too many requests" }, { status: 429 });
            }
            rl.count++;
        } else {
            rateLimits.set(requestKey, { count: 1, expiresAt: now + 5 * 60 * 1000 });
        }

        // Cache hit
        const cached = summaryCache.get(requestKey);
        let summaryData: any;

        if (cached && cached.expiresAt > now) {
            summaryData = cached.data;
        } else {
            const provider = getDashboardSummaryProvider();
            summaryData = await provider.getSummary(session);

            // Set Cache (30-60 secs, let's pick 45s)
            summaryCache.set(requestKey, {
                data: summaryData,
                expiresAt: now + 45 * 1000
            });
        }

        const safeData = redactPII(summaryData);
        const etag = generateETag(safeData);

        // Check If-None-Match
        const ifNoneMatch = req.headers.get("if-none-match");
        if (ifNoneMatch === etag) {
            // ETag hit -> return 304
            return new NextResponse(null, { status: 304, headers: { ETag: etag } });
        }

        const duration = Date.now() - startTime;
        // Strict generic log structure, no payload dumps
        console.log(`[DashboardSummary] requestId=${crypto.randomUUID()} companyId=${companyId} role=${roleGroup} duration=${duration}ms cacheHit=${cached && cached.expiresAt > now}`);

        return NextResponse.json(safeData, {
            headers: {
                ETag: etag,
                "Cache-Control": "public, max-age=45, stale-while-revalidate=60"
            }
        });

    } catch (err: any) {
        console.error("Dashboard Summary Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
