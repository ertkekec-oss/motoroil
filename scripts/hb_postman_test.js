
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPostmanSim() {
    console.log("--- Postman Simulation (HB API Test) ---");

    const config = await prisma.marketplaceConfig.findFirst({
        where: { type: 'hepsiburada' }
    });

    if (!config) {
        console.error("Config not found!");
        process.exit(1);
    }

    const set = config.settings;
    const username = set.username || '';
    const password = set.password || '';
    const merchantId = set.merchantId || '';

    // Mask password
    const maskedPass = password.substring(0, 3) + "****" + password.substring(password.length - 3);
    console.log(`Using credentials: User=${username}, Pass=${maskedPass}, Merchant=${merchantId}`);

    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const bDate = "2026-01-17 00:00:00";
    const eDate = "2026-02-17 00:00:00";

    const url = `https://oms-external.hepsiburada.com/orders/merchantid/${merchantId}?offset=0&limit=10&begindate=${encodeURIComponent(bDate)}&enddate=${encodeURIComponent(eDate)}`;

    console.log(`\n[REQUEST] GET ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'Periodya_OMS_v1',
                'Accept': 'application/json'
            }
        });

        console.log(`[RESPONSE] Status: ${response.status}`);
        const body = await response.text();
        console.log(`[BODY] ${body.substring(0, 500)}`);
    } catch (err) {
        console.error(`[ERROR] ${err.message}`);
    }

    process.exit(0);
}

runPostmanSim();
