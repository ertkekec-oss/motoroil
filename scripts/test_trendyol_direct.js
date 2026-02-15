const { TrendyolService } = require('./src/services/marketplaces/trendyol');

async function testTrendyol() {
    const config = {
        apiKey: "5H4Yezyq27uJBRVOacHD",
        apiSecret: "0sSqWWGZDdPoaIfI3oDb",
        supplierId: "548512",
        enabled: true
    };

    const service = new TrendyolService(config);
    console.log('Testing connection...');
    const isValid = await service.validateConnection();
    console.log('Connection Valid:', isValid);

    if (isValid) {
        console.log('Fetching orders (last 30 days)...');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const orders = await service.getOrders(startDate);
        console.log('Orders found:', orders.length);
        if (orders.length > 0) {
            console.log('Sample order:', JSON.stringify(orders[0], null, 2));
        }
    }
}

testTrendyol().catch(console.error);
