const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  const orders = await prisma.order.findMany({ 
    where: { marketplace: 'POS' }, 
    orderBy: { orderDate: 'desc' }, 
    take: 10 
  });
  console.dir(orders.map(o => ({ id: o.id, number: o.orderNumber, branch: o.branch, time: o.orderDate })));
}

checkOrders().catch(console.error).finally(()=>prisma.$disconnect());
