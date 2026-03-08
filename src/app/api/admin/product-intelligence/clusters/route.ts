import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");

        const clusters = await prisma.productCluster.findMany({
            include: {
                canonicalProduct: true,
                _count: {
                    select: { similarities: true },
                },
            },
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(clusters);
    } catch (error) {
        console.error("Error fetching clusters:", error);
        return NextResponse.json({ error: "Failed to fetch clusters" }, { status: 500 });
    }
}
