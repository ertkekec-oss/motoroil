import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ensureBoostPlansExist() {
    const plans = [
        {
            code: 'BOOST_STARTER_50K',
            name: 'Starter - 50k Impressions',
            monthlyPrice: 2500,
            monthlyImpressionQuota: 50000
        },
        {
            code: 'BOOST_GROWTH_200K',
            name: 'Growth - 200k Impressions',
            monthlyPrice: 7500,
            monthlyImpressionQuota: 200000
        },
        {
            code: 'BOOST_PRO_1M',
            name: 'Pro - 1m Impressions',
            monthlyPrice: 25000,
            monthlyImpressionQuota: 1000000
        }
    ];

    for (const p of plans) {
        await prisma.boostPlan.upsert({
            where: { code: p.code },
            update: {
                 name: p.name,
                 monthlyPrice: p.monthlyPrice,
                 monthlyImpressionQuota: p.monthlyImpressionQuota
            },
            create: p
        });
    }

    console.log('BoostPlans seeded.');
}
