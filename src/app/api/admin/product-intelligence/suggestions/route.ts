import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const status = searchParams.get("status");

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const suggestions = await prisma.productMatchSuggestion.findMany({
            where,
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(suggestions);
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
    }
}
