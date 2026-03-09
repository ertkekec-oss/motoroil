import { CampaignEngine, CampaignEngineContext } from '../src/services/marketing/campaignEngine';
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log("=== Campaign Engine V2 Test Suite ===");

    const tenantId = "test-tenant-123";
    const companyId = "test-company-123";

    // Create mock campaigns
    console.log("Creating mock campaigns...");
    try {
        await prisma.campaign.create({
            data: {
                tenantId,
                companyId,
                name: "POS Özel İndirimi",
                type: "PERCENT_DISCOUNT",
                discountRate: 10,
                channels: ["POS"],
                priority: 1,
                stackingRule: "STACKABLE",
                conditions: {},
            }
        });

        await prisma.campaign.create({
            data: {
                tenantId,
                companyId,
                name: "HUB Özel %5 İndirim",
                type: "PERCENT_DISCOUNT",
                discountRate: 5,
                channels: ["HUB"],
                priority: 2,
                stackingRule: "EXCLUSIVE",
                conditions: {},
            }
        });
        console.log("Mock campaigns created.");
    } catch (e: any) {
        console.log("Skipping creation, maybe they exist: ", e.message);
    }

    // Test 1: POS Sales
    console.log("\n--- TEST 1: POS Sales ---");
    const posContext: CampaignEngineContext = {
        tenantId,
        companyId,
        channel: "POS",
        cartItems: [
            { productId: "p1", quantity: 2, price: 100 }, // 200
            { productId: "p2", quantity: 1, price: 50 },  // 50
        ] // Total = 250
    };
    const posResult = await CampaignEngine.evaluate(posContext);
    console.log(`POS Result: Total: ${posResult.originalTotal}, Final: ${posResult.finalTotal}, Discounts:`, posResult.appliedCampaigns);

    // Test 2: HUB Sales
    console.log("\n--- TEST 2: HUB Sales ---");
    const hubContext: CampaignEngineContext = {
        tenantId,
        companyId,
        channel: "HUB",
        cartItems: [
            { productId: "p1", quantity: 1, price: 100 },
        ] // Total = 100
    };
    const hubResult = await CampaignEngine.evaluate(hubContext);
    console.log(`HUB Result: Total: ${hubResult.originalTotal}, Final: ${hubResult.finalTotal}, Discounts:`, hubResult.appliedCampaigns);

    console.log("\n=== Test Suite Finished ===");
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
