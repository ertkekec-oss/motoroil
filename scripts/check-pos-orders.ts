import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { marketplace: 'POS' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("POS Orders:", JSON.stringify(orders, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
