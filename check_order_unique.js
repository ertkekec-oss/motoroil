const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const order = await prisma.order.findUnique({
            where: {
                id: 'cmmy15zss0004mrsjls79ar5t',
                dealerMembershipId: 'some-id',
                salesChannel: "DEALER_B2B"
            }
        });
        console.log("WORKED:", order);
    } catch(e) {
        console.log("PRISMA ERROR:", e.message);
    }
    prisma.$disconnect();
}
check();
