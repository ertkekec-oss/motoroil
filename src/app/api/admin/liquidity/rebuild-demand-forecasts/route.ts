import { NextResponse } from "next/server";
import { processRebuildDemandForecastsJob } from "@/jobs/liquidity/rebuildDemandForecasts";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const isPlatformAdmin = session?.role === "SUPER_ADMIN" || session?.tenantId === "PLATFORM_ADMIN";

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Usually background task.
        processRebuildDemandForecastsJob();
        return NextResponse.json({ success: true, message: "Started forecast rebuild job." });
    } catch (error) {
        console.error("Forecast Rebuild error:", error);
        return NextResponse.json({ error: "Failed to start forecast rebuild" }, { status: 500 });
    }
}
