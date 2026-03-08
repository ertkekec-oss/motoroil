import prisma from "../src/lib/prisma";
import { createTaxonomyNode, getTaxonomyTree } from "../src/domains/product-intelligence/services/taxonomy.service";
import { findOrCreateCanonicalProduct, directMapTenantProductToCanonical } from "../src/domains/product-intelligence/services/canonicalProduct.service";

async function run() {
    console.log("--- PRODUCT TAXONOMY & INTELLIGENCE TESTS ---");

    try {
        // 1. Create Taxonomy
        console.log("Creating taxonomy nodes...");

        const rootNode = await createTaxonomyNode({ name: "Motor Yağları", slug: "motor-yaglari" });
        console.log(`Created Root Taxonomy Node: ${rootNode.name} (${rootNode.id})`);

        const subNode = await createTaxonomyNode({ name: "10W-40", slug: "10w-40", parentId: rootNode.id });
        console.log(`Created Sub Taxonomy Node: ${subNode.name} (${subNode.id})`);

        // 2. Create Canonical Product
        console.log("Creating canonical product...");

        // Test normalization and creation
        const rawName = "CASTROL GTX 10W40 Motor Yağı";
        const canonicalProduct = await findOrCreateCanonicalProduct(rawName, subNode.id);

        console.log(`Created Canonical Product: ${canonicalProduct.name}`);
        console.log(`Normalized Name: ${canonicalProduct.normalizedName}`);
        console.log(`Brand Extracted: ${canonicalProduct.brand}`);
        console.log(`Assigned to Taxonomy ID: ${canonicalProduct.taxonomyNodeId}`);

        // 3. Map Tenant Product
        console.log("Mapping tenant products...");

        const tenantId_A = "tenant_a_123";
        const productId_A = "prod_a_999";

        const tenantId_B = "tenant_b_456";
        const productId_B = "prod_b_888";

        const mappingA = await directMapTenantProductToCanonical(tenantId_A, productId_A, canonicalProduct.id, 0.95);
        const mappingB = await directMapTenantProductToCanonical(tenantId_B, productId_B, canonicalProduct.id, 0.88);

        console.log(`Mapped Tenant A Product ${mappingA.productId} to Canonical ${mappingA.canonicalProductId} (Score: ${mappingA.confidenceScore})`);
        console.log(`Mapped Tenant B Product ${mappingB.productId} to Canonical ${mappingB.canonicalProductId} (Score: ${mappingB.confidenceScore})`);

        // Final Validation
        console.log("--- FINAL TREE & MAPPINGS ---");
        const tree = await getTaxonomyTree();
        console.log(`Total Root Nodes: ${tree.length}`);
        if (tree.length > 0) {
            console.log(`First Root Children Count: ${tree[0].children.length}`);
        }

        const testCanonical = await prisma.canonicalProduct.findUnique({
            where: { id: canonicalProduct.id },
            include: {
                tenantMappings: true,
                taxonomyNode: true,
            }
        });

        console.log(`Test Canonical Name: ${testCanonical?.name}`);
        console.log(`Test Canonical Tenant Mappings Count: ${testCanonical?.tenantMappings.length}`);

        console.log("TEST SUCCESSFUL");
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

run();
