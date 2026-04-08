import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const site = await prisma.cmsSite.findFirst({ where: { tenantId: null } });
  if (site) {
    await prisma.cmsSite.update({
      where: { id: site.id },
      data: { name: "Periodya Enterprise | Türkiye'nin En Kapsamlı ERP Yazılımı | Periodya" }
    });
    console.log("Updated site name successfully.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
