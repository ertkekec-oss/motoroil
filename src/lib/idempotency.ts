import { PrismaClient, Prisma } from '@prisma/client';
import { AlreadyRunningError, NotFoundError } from '../services/finance/commission/errors';
import crypto from 'crypto';

export async function withIdempotency<T>(
    prisma: PrismaClient | Prisma.TransactionClient,
    key: string,
    scope: string,
    tenantId: string,
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    hashResult: (res: T) => string = () => '' // Optional result hashing for validation
): Promise<T> {
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000); // 15 mins stale limit

    return await (prisma as PrismaClient).$transaction(async (tx) => {
        // 1. Lock / check existing record
        let record = await tx.idempotencyRecord.findUnique({
            where: { key }
        });

        if (record) {
            if (record.status === 'SUCCEEDED') {
                // Technically we should return the previous successful result 
                // We throw an object or indicate it's done so the caller can fetch the existing data directly.
                // For our `createSnapshot` case, throwing a specific Error or returning null helps caller distinguish.
                throw new Error('ALREADY_SUCCEEDED');
            }

            if (record.status === 'STARTED') {
                if (record.lockedAt > cutoffTime) {
                    throw new AlreadyRunningError(`Operation ${key} is already running.`);
                }
                // Stale lock takeover
                record = await tx.idempotencyRecord.update({
                    where: { key },
                    data: { lockedAt: new Date(), status: 'STARTED' }
                });
            } else if (record.status === 'FAILED') {
                // Retry failed
                record = await tx.idempotencyRecord.update({
                    where: { key },
                    data: { lockedAt: new Date(), status: 'STARTED' }
                });
            }
        } else {
            // First attempt
            record = await tx.idempotencyRecord.create({
                data: {
                    key,
                    scope,
                    tenantId,
                    status: 'STARTED',
                    lockedAt: new Date()
                }
            });
        }

        try {
            // 2. Execute operation
            const result = await operation(tx);

            // 3. Mark success
            await tx.idempotencyRecord.update({
                where: { key },
                data: {
                    status: 'SUCCEEDED',
                    completedAt: new Date(),
                    resultHash: hashResult(result)
                }
            });

            return result;
        } catch (error: any) {
            // The transaction will be aborted, so the idempotency record changes
            // (e.g., creation or STARTED status) in this transaction will also roll back.
            // Therefore, we just rethrow the error.
            throw error;
        }
    });
}
