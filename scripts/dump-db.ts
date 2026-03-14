import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { orderDate: 'desc' },
    select: { id: true, orderNumber: true, rawData: true }
  });
  
  const txs = await prisma.transaction.findMany({
    where: { type: 'Sales' },
    take: 5,
    orderBy: { date: 'desc' },
    select: { id: true, description: true }
  });

  fs.writeFileSync('scripts/db-dump.json', JSON.stringify({ orders, txs }, null, 2));
}

main().finally(() => prisma.$disconnect());
