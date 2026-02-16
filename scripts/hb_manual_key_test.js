
async function manualHBTest() {
    const username = 'motoroil_dev';
    const password = '3desgg5vveSu';
    const merchantId = 'f225561c-5ae7-4268-9e6e-3541340b7229';

    console.log(`--- Manual HB Test with New Key ---`);
    console.log(`User: ${username} | Pass: ${password} | Merchant: ${merchantId}`);

    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const bDate = "2026-01-17 00:00:00";
    const eDate = "2026-02-17 00:00:00";

    const url = `https://oms-external.hepsiburada.com/orders/merchantid/${merchantId}?offset=0&limit=5&begindate=${encodeURIComponent(bDate)}&enddate=${encodeURIComponent(eDate)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'Periodya_OMS_v1',
                'Accept': 'application/json'
            }
        });

        console.log(`[RESPONSE] Status: ${response.status} ${response.statusText}`);
        const totalCount = response.headers.get('x-total-count') || response.headers.get('totalcount');
        console.log(`[HEADERS] TotalCount: ${totalCount}`);

        const body = await response.text();
        console.log(`[BODY] ${body.substring(0, 1000)}`);
    } catch (err) {
        console.error(`[ERROR] ${err.message}`);
    }
}

manualHBTest();
