import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const company = await prisma.company.findFirst();
        if (!company) {
            console.log("No company found.");
            return;
        }

        const product = await prisma.product.create({
            data: {
                name: "S3 Test Ürünü",
                code: "TEST-S3-001",
                price: 1500,
                stock: 10,
                companyId: company.id,
                category: "Aksesuar"
            }
        });

        console.log(JSON.stringify(product));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
