const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const c = await prisma.customer.findFirst({where: {name: {contains: 'KEKEÇ'}}});
    if (!c) return console.log('not found');
    console.log('BALANCE:', c.balance);
    const ts = await prisma.transaction.findMany({where: {customerId: c.id}, orderBy: {date: 'asc'}});
    ts.forEach(t=>console.log(t.date, t.type, t.amount, t.description));
    console.log('---');
    const ch = await prisma.check.findMany({where: {customerId: c.id}, orderBy: {createdAt: 'asc'}});
    ch.forEach(x=>console.log(x.status, x.amount));
}
main().finally(()=>prisma.$disconnect());
