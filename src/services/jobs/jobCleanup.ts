import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class JobCleanupService {

    /**
     * Delete successful jobs older than 14 days to prevent DB bloat.
     */
    static async cleanupSucceededJobs(olderThanDays: number = 14) {
        const threshold = new Date(Date.now() - olderThanDays * 86400000);

        return await prisma.systemJob.deleteMany({
            where: {
                status: 'SUCCEEDED',
                completedAt: { lt: threshold }
            }
        });
    }

    /**
     * Delete canceled jobs older than 7 days.
     */
    static async cleanupCanceledJobs(olderThanDays: number = 7) {
        const threshold = new Date(Date.now() - olderThanDays * 86400000);

        return await prisma.systemJob.deleteMany({
            where: {
                status: 'CANCELED',
                updatedAt: { lt: threshold }
            }
        });
    }

    /**
     * Delete unattached or extremely old execution log history.
     */
    static async cleanupExpiredExecutionLogs(olderThanDays: number = 30) {
        const threshold = new Date(Date.now() - olderThanDays * 86400000);

        return await prisma.systemJobExecutionLog.deleteMany({
            where: { createdAt: { lt: threshold } }
        });
    }
}
