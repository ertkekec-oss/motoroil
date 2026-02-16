
async function crossCheckHB() {
    const username = 'motoroil_dev';
    const password = '3desgg5vveSu';
    const merchantId = 'f225561c-5ae7-4268-9e6e-3541340b7229';

    const endpoints = [
        'https://oms-external.hepsiburada.com',
        'https://oms-external-sit.hepsiburada.com'
    ];

    console.log(`--- HB Cross-Check Test ---`);
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const bDate = "2026-01-17 00:00:00";
    const eDate = "2026-02-17 00:00:00";

    for (const base of endpoints) {
        const url = `${base}/orders/merchantid/${merchantId}?offset=0&limit=1&begindate=${encodeURIComponent(bDate)}&enddate=${encodeURIComponent(eDate)}`;
        console.log(`\nTesting: ${base}`);

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'User-Agent': 'Periodya_OMS_v1',
                    'Accept': 'application/json'
                }
            });

            console.log(`   Status: ${response.status} ${response.statusText}`);
            if (response.ok) {
                const body = await response.text();
                console.log(`   SUCCESS! Body: ${body.substring(0, 100)}`);
            } else {
                const body = await response.text();
                console.log(`   Error Body: ${body}`);
            }
        } catch (err) {
            console.log(`   Fetch Error: ${err.message}`);
        }
    }
}

crossCheckHB();
