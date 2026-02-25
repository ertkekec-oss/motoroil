import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session: any = await getSession();
        if (!session?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { suggestionId, action } = await req.json();

        if (action === "DISMISS") {
            await prisma.buySuggestion.update({
                where: { id: suggestionId },
                data: { status: "DISMISSED" }
            });
        } else if (action === "BUY" || action === "RFQ") {
            await prisma.buySuggestion.update({
                where: { id: suggestionId },
                data: { status: "ORDERED" }
            });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Action error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
