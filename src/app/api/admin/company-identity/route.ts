import { NextResponse } from "next/server";
import { listCompaniesForVerification } from "@/domains/company-identity/services/companyIdentity.service";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        // Assuming platform admins have PLATFORM_ADMIN tenantId or SUPER_ADMIN role
        const isPlatformAdmin = session?.role === "SUPER_ADMIN" || session?.tenantId === "PLATFORM_ADMIN";

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const identities = await listCompaniesForVerification();
        return NextResponse.json(identities);
    } catch (error) {
        return NextResponse.json({ error: "Failed to list company identities" }, { status: 500 });
    }
}
