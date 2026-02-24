
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Update Plans with Enterprise Pricing...');

    // 1. Update Standard Plan (KOBİ)
    const standardPlan = await prisma.plan.findFirst({ where: { name: 'Standard Plan' } });
    if (standardPlan) {
        await prisma.plan.update({
            where: { id: standardPlan.id },
            data: {
                price: 199.00,
                currency: 'TRY',
                interval: 'MONTHLY',
                description: 'KOBİ paket. Temel e-fatura ihtiyaçları için.',
                // limits also need to be ensured? Let's assume limits exist or add them.
            }
        });

        // Ensure Limits for Standard
        const upsertLimit = async (resource: string, limit: number) => {
            const exists = await prisma.planLimit.findUnique({
                where: { planId_resource: { planId: standardPlan.id, resource } }
            });

            if (exists) {
                await prisma.planLimit.update({
                    where: { id: exists.id },
                    data: { limit }
                });
            } else {
                await prisma.planLimit.create({
                    data: { planId: standardPlan.id, resource, limit }
                });
            }
        };

        await upsertLimit('monthly_documents', 50);
        await upsertLimit('users', 2);
        await upsertLimit('companies', 1);

        console.log('Updated Standard Plan: 199 TRY / 50 Docs');
    }

    // 2. Pro Plan
    let proPlan = await prisma.plan.findFirst({ where: { name: 'Pro Plan' } });
    if (!proPlan) {
        proPlan = await prisma.plan.create({
            data: {
                name: 'Pro Plan',
                description: 'Büyüyen işletmeler için. E-Arşiv ve yüksek limitler.',
                isActive: true,
                price: 499.00,
                currency: 'TRY',
                interval: 'MONTHLY'
            }
        });
    } else {
        await prisma.plan.update({
            where: { id: proPlan.id },
            data: { price: 499.00, currency: 'TRY', interval: 'MONTHLY' }
        });
    }

    if (proPlan) {
        const upsertLimitPro = async (resource: string, limit: number) => {
            const exists = await prisma.planLimit.findUnique({
                where: { planId_resource: { planId: proPlan!.id, resource } }
            });
            if (exists) {
                await prisma.planLimit.update({ where: { id: exists.id }, data: { limit } });
            } else {
                await prisma.planLimit.create({ data: { planId: proPlan!.id, resource, limit } });
            }
        };
        await upsertLimitPro('monthly_documents', 500);
        await upsertLimitPro('users', 5);
        await upsertLimitPro('companies', 3);
    }

    // 3. Enterprise Plan
    let entPlan = await prisma.plan.findFirst({ where: { name: 'Enterprise' } });
    if (!entPlan) {
        entPlan = await prisma.plan.create({
            data: {
                name: 'Enterprise',
                description: 'Kurumsal çözümler. Sınırsız destek ve özel entegrasyonlar.',
                isActive: true,
                price: 1499.00,
                currency: 'TRY',
                interval: 'MONTHLY'
            }
        });
    } else {
        await prisma.plan.update({
            where: { id: entPlan.id },
            data: { price: 1499.00, currency: 'TRY', interval: 'MONTHLY' }
        });
    }

    if (entPlan) {
        const upsertLimitEnt = async (resource: string, limit: number) => {
            const exists = await prisma.planLimit.findUnique({
                where: { planId_resource: { planId: entPlan!.id, resource } }
            });
            if (exists) {
                await prisma.planLimit.update({ where: { id: exists.id }, data: { limit } });
            } else {
                await prisma.planLimit.create({ data: { planId: entPlan!.id, resource, limit } });
            }
        };
        await upsertLimitEnt('monthly_documents', 5000);
        await upsertLimitEnt('users', 20);
        await upsertLimitEnt('companies', 10);
    }

    // 4. Features
    let feat = await prisma.feature.findUnique({ where: { key: 'e_invoice' } });
    if (!feat) {
        feat = await prisma.feature.create({
            data: { key: 'e_invoice', name: 'E-Fatura Entegrasyonu' }
        });
    }

    // Assign to Standard
    if (standardPlan && feat) {
        const link = await prisma.planFeature.findUnique({
            where: { planId_featureId: { planId: standardPlan.id, featureId: feat.id } }
        });
        if (!link) {
            await prisma.planFeature.create({ data: { planId: standardPlan.id, featureId: feat.id } });
        }
    }

    // Assign to Pro
    if (proPlan && feat) {
        const link = await prisma.planFeature.findUnique({
            where: { planId_featureId: { planId: proPlan.id, featureId: feat.id } }
        });
        if (!link) {
            await prisma.planFeature.create({ data: { planId: proPlan.id, featureId: feat.id } });
        }
    }

    // Assign to Enterprise
    if (entPlan && feat) {
        const link = await prisma.planFeature.findUnique({
            where: { planId_featureId: { planId: entPlan.id, featureId: feat.id } }
        });
        if (!link) {
            await prisma.planFeature.create({ data: { planId: entPlan.id, featureId: feat.id } });
        }
    }

    console.log('Plans updated successfully.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
