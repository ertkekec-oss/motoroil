import { NextResponse } from "next/server";
import { submitVerificationDocument, getCompanyIdentity } from "@/domains/company-identity/services/companyIdentity.service";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const identity = await getCompanyIdentity(session.tenantId);

        if (!identity) {
            return NextResponse.json({ error: "Identity not found. Create identity first." }, { status: 400 });
        }

        const doc = await submitVerificationDocument({
            companyId: identity.id,
            documentType: body.documentType,
            documentUrl: body.documentUrl,
        });

        return NextResponse.json(doc);
    } catch (error) {
        return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }
}
