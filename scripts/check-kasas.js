const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const c = await prisma.company.findMany();
  for(let comp of c) {
     const k = await prisma.kasa.findMany({where: {companyId: comp.id}});
     console.log(`Company: ${comp.name}, Kasas: ${k.length}`);
     if(k.length > 0) {
        console.log("Kasalar:", k.map(x=>({id:x.id, n:x.name, type:x.type, active:x.isActive})));
     }
  }
}

check().catch(console.error).finally(()=>prisma.$disconnect());
