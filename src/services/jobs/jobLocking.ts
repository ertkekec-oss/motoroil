import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class JobLocking {

    /**
     * Attempts to acquire an exclusive lock on an available job for processing.
     */
    static async tryAcquireJobLock(jobId: string, workerName: string, durationMs: number = 30000) {
        // Optimistic locking scenario applied to database row
        const expiresAt = new Date(Date.now() + durationMs);

        const result = await prisma.systemJob.updateMany({
            where: {
                id: jobId,
                lockedByWorker: null,
                OR: [
                    { status: 'PENDING' },
                    { status: 'SCHEDULED', scheduledFor: { lte: new Date() } },
                    { status: 'RETRYING', scheduledFor: { lte: new Date() } }
                ]
            },
            data: {
                lockedByWorker: workerName,
                lockExpiresAt: expiresAt,
                status: 'RUNNING',
                startedAt: new Date(),
                updatedAt: new Date()
            }
        });

        return result.count > 0;
    }

    /**
     * Heartbeat style lock renewal for long running computations.
     */
    static async renewJobLock(jobId: string, workerName: string, additionalMs: number = 30000) {
        const expiresAt = new Date(Date.now() + additionalMs);

        const result = await prisma.systemJob.updateMany({
            where: { id: jobId, lockedByWorker: workerName },
            data: { lockExpiresAt: expiresAt, updatedAt: new Date() }
        });

        return result.count > 0;
    }

    /**
     * Releases lock back when successful or terminal failure to avoid wait.
     */
    static async releaseJobLock(jobId: string, workerName: string, newStatus: any) {
        await prisma.systemJob.updateMany({
            where: { id: jobId, lockedByWorker: workerName },
            data: {
                lockedByWorker: null,
                lockExpiresAt: null,
                status: newStatus,
                updatedAt: new Date()
            }
        });
    }

    /**
     * Identify locks expired and recover them back to pending pool.
     */
    static async recoverExpiredLocks() {
        return await prisma.systemJob.updateMany({
            where: {
                lockedByWorker: { not: null },
                lockExpiresAt: { lte: new Date() },
                status: 'RUNNING'
            },
            data: {
                lockedByWorker: null,
                lockExpiresAt: null,
                status: 'PENDING',
                updatedAt: new Date()
            }
        });
    }
}
