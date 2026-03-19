import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const id = "5fbfb6f7-cabe-44c0-9595-d409e9f24fbe";
    
    try {
        const membership = await prisma.dealerMembership.findFirst({
            where: { id: id }
        });
        console.log("Found:", membership);
        if(membership) {
            console.log("Attempting to count orders...");
            const ordersCount = await prisma.order.count({
                where: { dealerMembershipId: id }
            });
            console.log("Orders count:", ordersCount);
            
            console.log("Cleaning relations...");
            await prisma.dealerCart.deleteMany({
                where: { dealerMembershipId: id }
            });
            await prisma.dealerCheckoutAttempt.deleteMany({
                where: { dealerMembershipId: id }
            });
            console.log("Relations cleaned. Deleting membership...");
            
            await prisma.dealerMembership.delete({
                where: { id: id }
            });
            console.log("Deleted successfully.");
        }
    } catch(e) {
        console.error("Prisma Error:", e);
    }
}
main();
