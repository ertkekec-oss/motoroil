import { NextResponse } from "next/server";
import { processRecalculateAllTrustProfilesJob } from "@/jobs/company-identity/recalculateAllTrustProfiles";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const isPlatformAdmin = session?.role === "SUPER_ADMIN" || session?.tenantId === "PLATFORM_ADMIN";

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Run async in background for all profiles
        processRecalculateAllTrustProfilesJob();

        return NextResponse.json({ success: true, message: "Started recalculation job in background" });
    } catch (error) {
        console.error("Recalculate All error:", error);
        return NextResponse.json({ error: "Failed to start batch recalculation" }, { status: 500 });
    }
}
