const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Reverting corrupted ON_LEAVE records...");
    const result = await prisma.attendance.updateMany({
        where: {
            status: 'ON_LEAVE',
            checkOut: { not: null }
        },
        data: {
            checkOut: null,
            locationOut: null,
            workingHours: 0
        }
    });
    console.log("Updated ON_LEAVE count:", result.count);
}

run().then(() => prisma.$disconnect()).catch(console.error);
