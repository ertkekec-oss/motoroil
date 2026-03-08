import { NextResponse } from "next/server";
import { listDemandForecasts } from "@/domains/liquidity/services/demandForecast.service";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const forecasts = await listDemandForecasts(session.tenantId);
        return NextResponse.json(forecasts);
    } catch (error) {
        console.error("Failed to fetch tenant demand forecasts:", error);
        return NextResponse.json({ error: "Failed to fetch forecasts" }, { status: 500 });
    }
}
