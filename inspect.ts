import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findFirst({
        where: { marketplace: "Pazarama" },
        orderBy: { createdAt: 'desc' }
    });

    if (!order) {
        console.log("No Pazarama order found.");
    } else {
        console.log("Order Number:", order.orderNumber);
        console.log("Raw Data:");
        console.log(JSON.stringify(order.rawData, null, 2));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
