
async function finalHBTry() {
    const password = '3desgg5vveSu';
    const merchantId = 'f225561c-5ae7-4268-9e6e-3541340b7229';
    const usernames = ['motoroil_dev', merchantId];

    console.log(`--- Final Header & User Combinations ---`);

    for (const user of usernames) {
        console.log(`\nTesting User: ${user}`);
        const auth = Buffer.from(`${user}:${password}`).toString('base64');
        const url = `https://oms-external.hepsiburada.com/orders/merchantid/${merchantId}?offset=0&limit=1`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'X-MerchantId': merchantId, // Extra header often required by legacy java backends
                    'User-Agent': 'Periodya_OMS_v1',
                    'Accept': 'application/json'
                }
            });

            console.log(`   Status: ${response.status} ${response.statusText}`);
            const body = await response.text();
            console.log(`   Body: ${body.substring(0, 100)}`);
        } catch (err) {
            console.log(`   Error: ${err.message}`);
        }
    }
}

finalHBTry();
