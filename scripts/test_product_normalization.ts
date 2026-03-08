import prisma from "../src/lib/prisma";
import { calculateProductSimilarity } from "../src/domains/product-intelligence/utils/productSimilarity";
import { compareTenantProductToCanonical } from "../src/domains/product-intelligence/services/productSimilarity.service";

async function run() {
    console.log("--- PRODUCT NORMALIZATION & SIMILARITY TESTS ---");

    try {
        // 1. Base Canonical
        const baseCanonicalName = "SKF 6203 Rulman";
        const canonical = await prisma.canonicalProduct.create({
            data: {
                name: baseCanonicalName,
                normalizedName: "skf 6203",
                brand: "skf"
            }
        });

        console.log(`Created Base Canonical: ${canonical.name} [${canonical.id}]`);

        // 2. Test Similarity Algorithm directly
        const inputs = [
            "SKF-6203 Rulman",
            "6203 SKF",
            "Skf 6203 Bearing",
            "Castrol GTX 10W40",
            "SKF 6204", // Different number
        ];

        console.log("\n--- SIMILARITY ENGINE TEST ---");
        for (const input of inputs) {
            const match = calculateProductSimilarity(canonical.name, input);
            console.log(`Compare: '${canonical.name}' vs '${input}'`);
            console.log(` Score: ${match.finalScore.toFixed(3)} | Type: ${match.matchType} | Overlap: ${match.tokenOverlapScore.toFixed(2)} | Num: ${match.numericTokenScore.toFixed(2)}`);
        }

        // 3. Test Service Pipeline
        console.log("\n--- SERVICE PIPELINE TEST ---");
        const testCases = [
            { tId: "t1", pId: "p1", name: "SKF 6203 Rulman" },        // Expect Auto-Map (Exact/High)
            { tId: "t1", pId: "p2", name: "skf-6203 b" },             // Expect Auto-Map (High)
            { tId: "t2", pId: "p3", name: "SKF Rulman Serisi" },      // Expect Suggestion (Medium)
            { tId: "t2", pId: "p4", name: "Castrol Motor Yağı GTX" }, // Expect No Match (Low/Zero)
        ];

        for (const test of testCases) {
            const result = await compareTenantProductToCanonical({
                tenantId: test.tId,
                productId: test.pId,
                productName: test.name
            });
            console.log(`Input: '${test.name}' -> Action: ${result.action}`);
        }

        // 4. Verify DB Records
        console.log("\n--- DB VERIFICATION ---");
        const clusters = await prisma.productCluster.findMany({ include: { similarities: true } });
        console.log(`Total Clusters Built: ${clusters.length}`);
        if (clusters.length > 0) {
            console.log(`First Cluster similarities count: ${clusters[0].similarities.length}`);
        }

        const suggestions = await prisma.productMatchSuggestion.findMany();
        console.log(`Total Suggestions Pending: ${suggestions.length}`);

        console.log("\nTEST SUCCESSFUL");
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

run();
