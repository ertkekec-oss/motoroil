import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const [customers, transactions, invoices, companies, users, products] = await Promise.all([
        prisma.customer.count(),
        prisma.transaction.count(),
        (prisma as any).salesInvoice.count(),
        prisma.company.count(),
        (prisma as any).user.count(),
        prisma.product.count()
    ]);

    console.log('=== VERİTABANI DURUM RAPORU ===');
    console.log(`Şirketler:      ${companies}`);
    console.log(`Kullanıcılar:   ${users}`);
    console.log(`Müşteriler:     ${customers}`);
    console.log(`İşlemler:       ${transactions}`);
    console.log(`Faturalar:      ${invoices}`);
    console.log(`Ürünler:        ${products}`);
    console.log('================================');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
