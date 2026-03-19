const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const id = "5fbfb6f7-cabe-44c0-9595-d409e9f24fbe";
    
    try {
        const membership = await prisma.dealerMembership.findFirst({
            where: { id: id }
        });
        if(membership) {
            const ordersCount = await prisma.order.count({
                where: { dealerMembershipId: id }
            });
            await prisma.dealerCart.deleteMany({
                where: { membershipId: id }
            });
            await prisma.dealerCheckoutAttempt.deleteMany({
                where: { membershipId: id }
            });
            await prisma.dealerMembership.delete({
                where: { id: id }
            });
            console.log("DELETED_SUCCESS_FULL");
        }
    } catch(e) {
        require('fs').writeFileSync('scripts/err.json', JSON.stringify({
            message: e.message,
            code: e.code,
            meta: e.meta
        }, null, 2));
        console.error("FAIL");
    }
}
main();
