import prisma from '@/lib/prisma';
import { getCurrentCalculationVersion } from './versioning';

export async function markOutdatedRows(modelName: string) {
    const version = await getCurrentCalculationVersion(modelName);
    const delegate = (prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];

    if (!delegate) throw new Error(`Model delegate not found for ${modelName}`);

    return delegate.updateMany({
        where: { calculationVersion: { lt: version }, status: 'ACTIVE' },
        data: { status: 'STALE', isStale: true }
    });
}
