const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const node = await prisma.globalCategory.findFirst({
    where: { name: 'Oyuncak Figürler ve Figür Setleri' },
    include: { children: true }
  });
  console.log(JSON.stringify(node, null, 2));
}
check().finally(() => prisma.$disconnect());
