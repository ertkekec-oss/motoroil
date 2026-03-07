import prisma from '@/lib/prisma';

export async function getCurrentCalculationVersion(modelName: string): Promise<number> {
    const registry = await prisma.networkCalculationRegistry.findUnique({
        where: { modelName }
    });

    if (registry) {
        return registry.currentVersion;
    }

    // Default to 1 if not defined in registry yet
    return 1;
}

export async function bumpCalculationVersion(modelName: string, notes?: string): Promise<number> {
    const current = await getCurrentCalculationVersion(modelName);
    const newVersion = current + 1;

    await prisma.networkCalculationRegistry.upsert({
        where: { modelName },
        create: {
            modelName,
            currentVersion: newVersion,
            notes
        },
        update: {
            currentVersion: newVersion,
            notes,
            updatedAt: new Date()
        }
    });

    return newVersion;
}
