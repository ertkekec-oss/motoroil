import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const taxonomyNodeId = searchParams.get("taxonomyNodeId");

        const whereClause: any = {};
        if (taxonomyNodeId) {
            whereClause.taxonomyNodeId = taxonomyNodeId;
        }

        const canonicalProducts = await prisma.canonicalProduct.findMany({
            where: whereClause,
            include: {
                taxonomyNode: true,
            },
            take: 50,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(canonicalProducts);
    } catch (error) {
        console.error("Error fetching canonical products:", error);
        return NextResponse.json({ error: "Failed to fetch canonical products" }, { status: 500 });
    }
}
