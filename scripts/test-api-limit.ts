import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        const customers = await prisma.customer.findMany({
            where: { deletedAt: null },
            take: 100,
            select: {
                id: true,
                name: true,
                phone: true,
                branch: true,
                balance: true,
                email: true,
                address: true,
                city: true,
                district: true,
                supplierClass: true,
                customerClass: true,
                points: true,
                referralCode: true,
                updatedAt: true,
                category: {
                    select: { name: true, priceListId: true }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        const cem = customers.find(c => c.name?.toLowerCase().includes('cem'));
        console.log("Total loaded:", customers.length);
        console.log("Found cem in loaded 100?", !!cem, cem);
        
        // Also let's check total count in DB
        const total = await prisma.customer.count({ where: { deletedAt: null } });
        console.log("Total in DB:", total);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
