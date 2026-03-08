import { NextResponse } from "next/server";
import { updateVerificationStatus } from "@/domains/company-identity/services/companyIdentity.service";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const isPlatformAdmin = session?.role === "SUPER_ADMIN" || session?.tenantId === "PLATFORM_ADMIN";

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        if (!body.companyId) {
            return NextResponse.json({ error: "companyId required" }, { status: 400 });
        }

        const updated = await updateVerificationStatus(body.companyId, "REJECTED");
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Failed to reject company" }, { status: 500 });
    }
}
