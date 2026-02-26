import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createPayoutDestination, listPayoutDestinations } from "@/services/finance/payout/destinations";

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { rawIban, holderName, setDefault } = body;

        const dest = await createPayoutDestination({
            sellerTenantId: session.tenantId,
            rawIban,
            holderName,
            setDefault: Boolean(setDefault)
        });

        return NextResponse.json({
            id: dest.id,
            ibanMasked: dest.ibanMasked,
            holderNameMasked: dest.holderNameMasked,
            isDefault: dest.isDefault,
            status: dest.status
        });
    } catch (e: any) {
        const status = e.statusCode || 400;
        return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
}

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const list = await listPayoutDestinations(session.tenantId);
        return NextResponse.json({ destinations: list });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
