import { computeSignalDedupeKey } from './signalDedupe';

// Define a type interface for the Prisma delegate to ensure it has the expected methods
interface PrismaModelDelegate {
    findFirst(args: { where: any }): Promise<any>;
    updateMany(args: { where: any, data: any }): Promise<any>;
    create(args: { data: any }): Promise<any>;
}

export async function upsertDerivedSignalSafely(
    modelDelegate: PrismaModelDelegate,
    uniqueConstraints: any,
    payload: any,
    calculationVersion: number = 1,
    expiresAt?: Date
) {
    const dedupeKey = computeSignalDedupeKey({ ...uniqueConstraints, ...payload });

    const existingActive = await modelDelegate.findFirst({
        where: { ...uniqueConstraints, status: 'ACTIVE', dedupeKey }
    });

    if (existingActive) return existingActive; // Idempotent skip if same payload

    // Mark previous as STALE/REPLACED
    await modelDelegate.updateMany({
        where: { ...uniqueConstraints, status: 'ACTIVE' },
        data: { status: 'REPLACED', isStale: true, supersededAt: new Date() }
    });

    return modelDelegate.create({
        data: {
            ...uniqueConstraints,
            ...payload,
            dedupeKey,
            calculationVersion,
            status: 'ACTIVE',
            isStale: false,
            expiresAt
        }
    });
}
