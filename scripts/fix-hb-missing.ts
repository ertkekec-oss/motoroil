import { PrismaClient } from '@prisma/client';
import { HepsiburadaService } from '../src/services/marketplaces/hepsiburada';

const prisma = new PrismaClient();

async function run() {
    console.log("Looking for HB orders missing data...");
    
    // Find all HB orders with 'Müşteri' or amount 0
    const brokenOrders = await prisma.order.findMany({
        where: {
            marketplace: 'Hepsiburada',
            OR: [
                { customerName: 'Müşteri' },
                { totalAmount: 0 }
            ]
        }
    });

    console.log(`Found ${brokenOrders.length} broken HB orders.`);
    if (brokenOrders.length === 0) return;

    // Group by companyId
    const companyIds = [...new Set(brokenOrders.map(o => o.companyId))];

    for (const cid of companyIds) {
        console.log(`Processing company ${cid}...`);
        let config = await prisma.marketplaceConfig.findFirst({
            where: { companyId: cid, type: 'hepsiburada' }
        });

        if (!config || !config.settings) {
             console.log("No config found for company", cid, "Trying fallback global...");
             const fallback = await prisma.marketplaceConfig.findFirst({
                 where: { type: 'hepsiburada' }
             });
             if (!fallback || !fallback.settings) continue;
             config = fallback;
        }
        
        let credentials: any = {};
        try {
             credentials = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
        } catch(e) { continue; }

        if (!credentials.merchantId) continue;

        const hb = new HepsiburadaService({
            merchantId: credentials.merchantId,
            username: credentials.username || credentials.apiKey || '',
            password: credentials.password || credentials.apiSecret || '',
            isTest: false
        });

        const ordersToFix = brokenOrders.filter(o => o.companyId === cid);

        for (const o of ordersToFix) {
             console.log(`Fetching full details for ${o.orderNumber}...`);
             const fullOrder = await hb.getOrderByNumber(o.orderNumber);
             if (fullOrder && fullOrder.customerName && fullOrder.customerName !== 'Müşteri') {
                 console.log(` > Healed: ${fullOrder.customerName}, ${fullOrder.totalAmount} TRY`);
                 
                 const newItems = (fullOrder.items?.length || 0) > 0 ? fullOrder.items : (o.items || []);
                 const newTotal = Number(fullOrder.totalAmount) > 0 ? Number(fullOrder.totalAmount) : Number(o.totalAmount || 0);
                 
                 await prisma.order.update({
                      where: { id: o.id },
                      data: {
                          customerName: fullOrder.customerName,
                          totalAmount: newTotal,
                          orderDate: fullOrder.orderDate,
                          items: newItems as any,
                          rawData: fullOrder as any,
                          status: fullOrder.status !== 'UNKNOWN' ? fullOrder.status : o.status
                      }
                 });
             } else {
                 console.log(` > Could not fetch full details for ${o.orderNumber}. Format missing?`);
             }
        }
    }
}
run();
