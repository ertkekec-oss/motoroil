import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
async function main() {
  const plans = await prisma.paymentPlan.findMany({ 
      orderBy: { createdAt: 'desc' }, 
      take: 5
  });
  fs.writeFileSync('output.json', JSON.stringify(plans, null, 2));
}
main().finally(() => prisma.$disconnect());
