import { NextResponse } from "next/server";
import { processRecalculateTrustProfileJob } from "@/jobs/company-identity/recalculateTrustProfile";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const isPlatformAdmin = session?.role === "SUPER_ADMIN" || session?.tenantId === "PLATFORM_ADMIN";

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        if (!body.tenantId) {
            return NextResponse.json({ error: "tenantId required" }, { status: 400 });
        }

        // Usually this is pushed to SQS/BullMQ. Here we await it directly for sync feedback.
        const result = await processRecalculateTrustProfileJob({ tenantId: body.tenantId });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error("Recalculate error:", error);
        return NextResponse.json({ error: "Failed to recalculate company trust" }, { status: 500 });
    }
}
