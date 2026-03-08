import { NextResponse } from "next/server";
import { listDemandSignals } from "@/domains/liquidity/services/demandSignal.service";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const signals = await listDemandSignals(session.tenantId);
        return NextResponse.json(signals);
    } catch (error) {
        console.error("Failed to fetch tenant demand signals:", error);
        return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 });
    }
}
