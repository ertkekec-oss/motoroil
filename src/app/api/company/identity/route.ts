import { NextResponse } from "next/server";
import { getCompanyIdentity, createCompanyIdentity, updateCompanyIdentity } from "@/domains/company-identity/services/companyIdentity.service";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const identity = await getCompanyIdentity(session.tenantId);
        return NextResponse.json(identity || { status: "NOT_FOUND" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to get company identity" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const existing = await getCompanyIdentity(session.tenantId);

        if (existing) {
            const updated = await updateCompanyIdentity(session.tenantId, body);
            return NextResponse.json(updated);
        } else {
            const created = await createCompanyIdentity({
                tenantId: session.tenantId,
                legalName: body.legalName,
                taxNumber: body.taxNumber,
                tradeRegistryNo: body.tradeRegistryNo,
                country: body.country,
                city: body.city,
                address: body.address,
                website: body.website,
                phone: body.phone,
            });
            return NextResponse.json(created);
        }
    } catch (error) {
        return NextResponse.json({ error: "Failed to save company identity" }, { status: 500 });
    }
}
