import prisma from './prisma';

export async function trackOnboardingStep(tenantId: string, actionKey: string) {
    if (!tenantId || !actionKey) return;

    try {
        const progress = await prisma.productOnboardingProgress.findUnique({
            where: { tenantId }
        });

        if (!progress) {
            await prisma.productOnboardingProgress.create({
                data: {
                    tenantId,
                    completedKeys: [actionKey]
                }
            });
            return;
        }

        if (!progress.completedKeys.includes(actionKey)) {
            await prisma.productOnboardingProgress.update({
                where: { tenantId },
                data: {
                    completedKeys: {
                        push: actionKey
                    }
                }
            });
        }
    } catch (error) {
        console.error('Failed to track onboarding step:', error);
    }
}
