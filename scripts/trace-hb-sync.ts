import { HepsiburadaService } from '../src/services/marketplaces/hepsiburada';
import prisma from '../src/lib/prisma';

async function run() {
    const config = {
        merchantId: 'f225561c-5ae7-4208-9eb4-3541340b7229',
        username: 'motoroil_dev',
        password: '3desgg5vveSu',
        isTest: false
    };

    // Override console.error/warn to see what's failing in the loop
    const originalError = console.error;
    console.error = (...args) => originalError("TRAPPED ERROR:", ...args);

    const hb = new HepsiburadaService(config);

    console.log("Starting sync manually...");
    const orders = await hb.getOrders(new Date("2026-03-01"), new Date());
    
    console.log(`Fetched ${orders.length} orders total.`);
    
    // Check what happens
    const badOrders = orders.filter(o => o.customerName === 'Müşteri' || !o.customerEmail);
    console.log(`Orders missing details mapping: ${badOrders.length}`);
    if (badOrders.length > 0) {
       console.log("Example missing detail order:", JSON.stringify(badOrders[0], null, 2));
    }
}
run();
