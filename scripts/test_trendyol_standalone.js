// Native fetch used

async function testTrendyol() {
    const config = {
        apiKey: "5H4Yezyq27uJBRVOacHD",
        apiSecret: "0sSqWWGZDdPoaIfI3oDb",
        supplierId: "548512"
    };

    const baseUrl = 'https://api.trendyol.com/sapigw/suppliers';
    const authString = `${config.apiKey}:${config.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    console.log('Testing connection...');
    const url = `${baseUrl}/${config.supplierId}/orders?size=1`;
    const response = await fetch(url, {
        headers: {
            'Authorization': authHeader,
            'User-Agent': `${config.supplierId} - Periodya ERP`
        }
    });

    console.log('Status:', response.status);
    if (!response.ok) {
        console.error('Error:', await response.text());
        return;
    }

    const data = await response.json();
    console.log('Total orders in content:', data.content?.length || 0);

    // Fetch last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const wideUrl = `${baseUrl}/${config.supplierId}/orders?startDate=${startDate.getTime()}&size=50`;
    console.log('Fetching last 30 days:', wideUrl);

    const wideRes = await fetch(wideUrl, {
        headers: {
            'Authorization': authHeader,
            'User-Agent': `${config.supplierId} - Periodya ERP`
        }
    });
    const wideData = await wideRes.json();
    console.log('Orders in last 30 days:', wideData.content?.length || 0);
    if (wideData.content && wideData.content.length > 0) {
        console.log('Latest order date:', wideData.content[0].orderDate);
    }
}

testTrendyol().catch(console.error);
