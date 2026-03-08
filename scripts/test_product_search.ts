import prisma from "../src/lib/prisma";
import { searchProducts, searchSimilarProducts, searchSupplierProducts } from "../src/domains/product-discovery/services/productSearch.service";

async function runTest() {
    console.log("--- PRODUCT DISCOVERY & SEARCH TESTS ---");

    try {
        // Determine a canonical to search for
        const baseSearch = "SKF";
        console.log(`\n1. Searching for Canonical Products Query: "${baseSearch}"`);

        // Test base search
        const canonicals = await searchProducts(baseSearch, 5);
        console.log(`Found ${canonicals.length} canonical products.`);
        if (canonicals.length > 0) {
            console.log("Top Hit:", canonicals[0].name, "| Brand:", canonicals[0].brand);

            // Test substitution / similar
            console.log(`\n2. Searching for Similar (cluster) Products to: ${canonicals[0].name}`);
            const similar = await searchSimilarProducts(canonicals[0].id, 5);
            console.log(`Found ${similar.length} similar products in cluster.`);
            similar.forEach(s => console.log(" -", s.name));

            // Test Supplier query
            console.log(`\n3. Searching Supplier Inventory for: "${canonicals[0].name}"`);
            const suppliers = await searchSupplierProducts(canonicals[0].name, undefined, 5);
            console.log(`Found ${suppliers.length} supplier listings for this query.`);
            suppliers.forEach(supp => console.log(`   Tenant: ${supp.tenantId} | Conf: ${supp.confidenceScore}`));
        } else {
            console.log("No canonicals found. Skipping deeper tests.");
        }

        console.log("\nTEST SUCCESSFUL");

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

runTest();
