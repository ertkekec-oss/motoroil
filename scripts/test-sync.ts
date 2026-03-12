import { HepsiburadaService } from './src/services/marketplaces/hepsiburada';
import { PrismaClient } from '@prisma/client';

async function run() {
    const config = {
        merchantId: 'f225561c-5ae7-4208-9eb4-3541340b7229',
        username: 'motoroil_dev',
        password: '3desgg5vveSu',
        isTest: false
    };
    const hb = new HepsiburadaService(config);
    // test getOrders explicitly to see what we fetch
    const orders = await hb.getOrders(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), new Date());
    
    // Find our specific orders
    console.log("Total orders:", orders.length);
    const o1 = orders.find(o => o.orderNumber === '4448396788');
    const o2 = orders.find(o => o.orderNumber === '4299669947');
    const o3 = orders.find(o => o.orderNumber === '4624209464');
    
    console.log("4448396788:", !!o1, o1?.customerName, o1?.totalAmount);
    console.log("4299669947:", !!o2, o2?.customerName, o2?.totalAmount);
    console.log("4624209464:", !!o3, o3?.customerName, o3?.totalAmount);
}
run();
