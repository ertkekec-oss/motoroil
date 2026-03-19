const fs = require('fs');
const files = [
    'src/app/api/network/orders/[id]/route.ts',
    'src/app/api/network/payments/intents/[id]/route.ts',
    'src/app/api/network/payments/intents/by-order/[orderId]/route.ts',
    'src/app/api/network/cart/items/[id]/route.ts'
];

for (const f of files) {
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        content = content.replace(/import prisma from ["']@\/lib\/prisma["']/g, 'import { prismaRaw as prisma } from "@/lib/prisma"');
        fs.writeFileSync(f, content);
    }
}
