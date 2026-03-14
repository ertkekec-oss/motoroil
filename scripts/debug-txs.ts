import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { orderDate: 'desc' }
  });
  console.log("LAST 5 ORDERS:");
  orders.forEach(o => {
    console.log(`- ID: ${o.id}, Number: ${o.orderNumber}, rawData: ${JSON.stringify(o.rawData)}`);
  });

  const txs = await prisma.transaction.findMany({
    where: { type: 'Sales' },
    take: 5,
    orderBy: { date: 'desc' }
  });
  console.log("\nLAST 5 SALE TXS:");
  txs.forEach(t => {
    console.log(`- ID: ${t.id}, Desc: ${t.description}`);
  });
}

main().finally(() => prisma.$disconnect());
