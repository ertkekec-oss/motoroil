
/**
 * Manual Run script for Suggestion Engine
 * usage: npx tsx scripts/run-suggestion-engine.ts <companyId>
 */

process.env.PRISMA_BYPASS_EXTENSION = "true";

import { runSuggestionEngine } from "../src/workers/suggestionEngine";
import { prisma } from "../src/lib/prisma";

async function main() {
    const companyId = process.argv[2];

    if (!companyId) {
        console.log("Usage: npx tsx scripts/run-suggestion-engine.ts <companyId>");
        console.log("Fetching first available company...");
        const firstCompany = await prisma.company.findFirst();
        if (!firstCompany) {
            console.error("No companies found.");
            process.exit(1);
        }
        console.log(`Using company: ${firstCompany.name} (${firstCompany.id})`);
        await runSuggestionEngine({ companyId: firstCompany.id });
    } else {
        await runSuggestionEngine({ companyId });
    }

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
