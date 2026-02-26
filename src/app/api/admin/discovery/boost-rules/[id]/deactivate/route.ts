import { NextRequest, NextResponse } from "next/server";
import { deactivateBoostRule } from "@/services/network/discovery/boosts";

export async function POST(req: NextRequest, context: any) {
    const params = await context.params;
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { id } = params;
        const updated = await deactivateBoostRule(id, 'PLATFORM_ADMIN');
        return NextResponse.json({ success: true, rule: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Bad Request" }, { status: 400 });
    }
}
