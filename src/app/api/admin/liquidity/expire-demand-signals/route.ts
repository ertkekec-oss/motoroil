import { NextResponse } from "next/server";
import { processExpireDemandSignalsJob } from "@/jobs/liquidity/expireDemandSignals";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const isPlatformAdmin = session?.role === "SUPER_ADMIN" || session?.tenantId === "PLATFORM_ADMIN";

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Usually background task.
        processExpireDemandSignalsJob();
        return NextResponse.json({ success: true, message: "Started expiry job." });
    } catch (error) {
        console.error("Signal Expiry error:", error);
        return NextResponse.json({ error: "Failed to start expiry job" }, { status: 500 });
    }
}
