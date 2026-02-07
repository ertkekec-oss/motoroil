
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Plan Temizliği Başlatılıyor ---');

    const demoPlans = await prisma.plan.findMany({
        where: {
            OR: [
                { name: { contains: 'demo', mode: 'insensitive' } },
                { description: { contains: 'demo', mode: 'insensitive' } },
                { name: { contains: 'deneme', mode: 'insensitive' } }
            ]
        },
        include: {
            subscriptions: true
        }
    });

    console.log(`${demoPlans.length} adet demo/deneme planı bulundu.`);

    for (const plan of demoPlans) {
        if (plan.subscriptions.length > 0) {
            console.log(`⚠️  '${plan.name}' planına bağlı ${plan.subscriptions.length} üyelik var. Silinmiyor.`);
            continue;
        }

        console.log(`🗑️  '${plan.name}' siliniyor...`);
        await prisma.plan.delete({ where: { id: plan.id } });
    }

    console.log('--- İşlem Tamamlandı ---');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
