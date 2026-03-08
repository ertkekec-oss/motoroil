import { NextResponse } from "next/server";
import { listTrustProfiles } from "@/domains/company-identity/services/companyTrust.service";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        const isPlatformAdmin = session?.role === "SUPER_ADMIN" || session?.tenantId === "PLATFORM_ADMIN";

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profiles = await listTrustProfiles();
        return NextResponse.json(profiles);
    } catch (error) {
        console.error("Failed to fetch admin trust profiles:", error);
        return NextResponse.json({ error: "Failed to fetch trust profiles" }, { status: 500 });
    }
}
