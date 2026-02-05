
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncPlans() {
    console.log('--- Syncing Iyzico Plan Codes ---');

    const plans = await prisma.plan.findMany();

    for (const plan of plans) {
        let code = '';
        if (plan.name === 'Basic' || plan.name.toLowerCase().includes('başlangıç')) {
            code = 'P6754321'; // Örnek Sandbox Kodu
        } else if (plan.name === 'Pro' || plan.name.toLowerCase().includes('pro')) {
            code = 'P8899001';
        } else if (plan.name === 'Enterprise' || plan.name.toLowerCase().includes('kurumsal')) {
            code = 'P9999999';
        } else {
            code = 'P_DEFAULT';
        }

        console.log(`Updating ${plan.name} -> ${code}`);
        await prisma.plan.update({
            where: { id: plan.id },
            data: { iyzicoPlanCode: code }
        });
    }

    console.log('--- Done ---');
}

syncPlans()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
