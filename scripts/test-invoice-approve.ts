import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const inv = await prisma.purchaseInvoice.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { supplier: true }
    });
    const result = {
        invId: inv?.id,
        invoiceNo: inv?.invoiceNo,
        status: inv?.status,
        supplier: inv?.supplier?.name,
        companyId: inv?.companyId,
        items: inv?.items
    };
    fs.writeFileSync('C:\\Users\\ertke\\OneDrive\\Masaüstü\\periodya\\muhasebeapp\\motoroil\\out.json', JSON.stringify(result, null, 2));

    // Also let's check the product mapping
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, name: true, stock: true }
    });
    fs.writeFileSync('C:\\Users\\ertke\\OneDrive\\Masaüstü\\periodya\\muhasebeapp\\motoroil\\prods.json', JSON.stringify(products, null, 2));
}
run();
