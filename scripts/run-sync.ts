import { HepsiburadaService } from '../src/services/marketplaces/hepsiburada';

async function r() { 
    const h = new HepsiburadaService({merchantId:'f225561c-5ae7-4208-9eb4-3541340b7229',password:'3desgg5vveSu', username: 'motoroil_dev'}); 
    const orders = await h.getOrders(new Date(Date.now()-30*24*60*60*1000), new Date()); 
    console.log(orders.find(x=>x.orderNumber==='4448396788')); 
    console.log(orders.find(x=>x.orderNumber==='4624209464')); 
} 
r();
