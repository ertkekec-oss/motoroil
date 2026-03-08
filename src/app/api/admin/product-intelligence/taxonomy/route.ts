import { NextResponse } from "next/server";
import { getTaxonomyTree, createTaxonomyNode } from "@/domains/product-intelligence/services/taxonomy.service";

export async function GET() {
    try {
        const tree = await getTaxonomyTree();
        return NextResponse.json(tree);
    } catch (error) {
        console.error("Error fetching taxonomy tree:", error);
        return NextResponse.json({ error: "Failed to fetch taxonomy tree" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, slug, parentId } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
        }

        const node = await createTaxonomyNode({ name, slug, parentId });
        return NextResponse.json(node, { status: 201 });
    } catch (error) {
        console.error("Error creating taxonomy node:", error);
        return NextResponse.json({ error: "Failed to create taxonomy node" }, { status: 500 });
    }
}
