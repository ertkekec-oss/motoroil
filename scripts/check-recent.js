const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const m = await prisma.stockMovement.findMany({ 
    orderBy: { createdAt: 'desc' }, 
    take: 5 
  });
  console.log("Latest Stock Movements:", m.map(x=>({id:x.id, type:x.type, q:x.quantity, b:x.branch, time: x.createdAt})));

  const o = await prisma.order.findMany({ 
    orderBy: { orderDate: 'desc' }, 
    take: 5 
  });
  console.log("Latest Orders:", o.map(x=>({id:x.id, status:x.status, b:x.branch, time: x.orderDate})));
}

check().catch(console.error).finally(()=>prisma.$disconnect());
