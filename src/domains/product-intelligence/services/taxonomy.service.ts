import prisma from "@/lib/prisma";

export async function createTaxonomyNode(data: {
    name: string;
    slug: string;
    parentId?: string;
}) {
    const level = data.parentId
        ? ((await prisma.productTaxonomyNode.findUnique({ where: { id: data.parentId } }))?.level ?? -1) + 1
        : 0;

    return prisma.productTaxonomyNode.create({
        data: {
            name: data.name,
            slug: data.slug,
            parentId: data.parentId,
            level,
        },
    });
}

export async function getTaxonomyTree() {
    const nodes = await prisma.productTaxonomyNode.findMany({
        include: {
            children: true,
        },
    });

    return nodes.filter((n) => !n.parentId);
}

export async function findNodeBySlug(slug: string) {
    return prisma.productTaxonomyNode.findFirst({
        where: { slug },
        include: {
            children: true,
            parent: true,
        },
    });
}

export async function mapTenantCategoryToTaxonomy(tenantCategoryId: string, taxonomyNodeId: string) {
    // Phase A mock implementation
    console.log(`Mapped tenant category ${tenantCategoryId} to taxonomy node ${taxonomyNodeId}`);
    return { tenantCategoryId, taxonomyNodeId };
}
