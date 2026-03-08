import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");

        const similarities = await prisma.productSimilarity.findMany({
            include: {
                cluster: true,
                canonicalProduct: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(similarities);
    } catch (error) {
        console.error("Error fetching similarities:", error);
        return NextResponse.json({ error: "Failed to fetch similarities" }, { status: 500 });
    }
}
