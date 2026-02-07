
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Plan Temizliği Başlatılıyor ---');

    // 1. "Demo" veya "Test" içeren planları bul
    const demoPlans = await prisma.plan.findMany({
        where: {
            OR: [
                { name: { contains: 'Demo', mode: 'insensitive' } },
                { description: { contains: 'Demo', mode: 'insensitive' } },
                { name: { contains: 'Test', mode: 'insensitive' } }
            ]
        },
        include: {
            subscriptions: true
        }
    });

    console.log(`${demoPlans.length} adet demo/test planı bulundu.`);

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
