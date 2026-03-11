const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.marketplaceConfig.findFirst({where:{type:'hepsiburada'}}).then(o => {
    console.log(o ? o.settings : 'not found');
}).finally(()=>prisma.$disconnect());
