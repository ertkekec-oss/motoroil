import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
    const orders = await p.order.findMany({
        where: { marketplace: 'POS' },
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    const trs = await p.transaction.findMany({
        where: { type: 'Sales' },
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    
    let out = 'ORDERS:\n';
    out += 'ID | OrderNo | Status | CompanyID | CreatedAt\n';
    out += orders.map(o => `${o.id} | ${o.orderNumber} | ${o.status} | ${o.companyId} | ${o.createdAt.toISOString()}`).join('\n');
    
    out += '\n\nTRANSACTIONS:\n';
    out += 'ID | Amount | Desc | CompanyID | KasaID | CreatedAt\n';
    out += trs.map(t => `${t.id} | ${t.amount} | ${t.description} | ${t.companyId} | ${t.kasaId} | ${t.createdAt.toISOString()}`).join('\n');
    
    fs.writeFileSync('./clean_out_comp.txt', out, 'utf8');
}
main().finally(() => p.$disconnect());
