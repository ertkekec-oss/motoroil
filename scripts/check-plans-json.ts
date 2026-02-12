import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- PLANS & FEATURES DIAGNOSTIC JSON ---');

    // 1. List all Features
    const features = await prisma.feature.findMany();

    // 2. List all Plans and their Features
    const plans = await prisma.plan.findMany({
        include: {
            features: {
                include: {
                    feature: true
                }
            }
        }
    });

    const report = {
        allFeatures: features.map(f => ({ key: f.key, name: f.name })),
        plans: plans.map(p => ({
            id: p.id,
            name: p.name,
            features: p.features.map(pf => ({
                key: pf.feature.key,
                name: pf.feature.name
            }))
        }))
    };

    fs.writeFileSync('plans-report.json', JSON.stringify(report, null, 2));
    console.log('✅ Report saved to plans-report.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
