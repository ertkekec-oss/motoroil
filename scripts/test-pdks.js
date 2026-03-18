const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
    console.log("Checking attendance records...");
    const records = await prisma.attendance.findMany({
        take: 3,
        orderBy: { id: 'desc' }
    });
    
    const activeAtt = await prisma.attendance.findFirst({
        where: {
            checkOut: null
        },
        orderBy: { checkIn: 'desc' }
    });
    
    const out = {
      records,
      activeAtt
    };
    
    fs.writeFileSync('scripts/out.json', JSON.stringify(out, null, 2));
    console.log("Done");
}

run().then(() => prisma.$disconnect()).catch(console.error);
