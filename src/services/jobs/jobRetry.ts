import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class JobRetryService {

    static resolveRetryDelay(job: any, nextAttemptNo: number) {
        const strategy = job.backoffStrategy || 'FIXED';
        let delayMs = 5000; // base wait

        if (strategy === 'FIXED') {
            delayMs = 30000; // 30s
        } else if (strategy === 'LINEAR') {
            delayMs = nextAttemptNo * 60000; // Attempt 1 = 1m, 2 = 2m
        } else if (strategy === 'EXPONENTIAL') {
            delayMs = Math.pow(2, nextAttemptNo) * 60000; // Attempt 1 = 2m, 2 = 4m, 3 = 8m
        }

        return new Date(Date.now() + delayMs);
    }

    static async shouldRetry(job: any, error: any) {
        if (!job.maxRetries || job.maxRetries <= 0) return false;

        // Skip retries on syntax/fatal unrecoverable payload exceptions
        if (error.message.includes('JOB_PAYLOAD_FATAL')) return false;

        return job.retryCount < job.maxRetries;
    }

    static async scheduleRetry(jobId: string, jobDetails: any, errorCode: string) {
        const nextAttempt = jobDetails.retryCount + 1;
        const scheduledFor = this.resolveRetryDelay(jobDetails, nextAttempt);

        return await prisma.systemJob.update({
            where: { id: jobId },
            data: {
                status: 'RETRYING',
                retryCount: nextAttempt,
                scheduledFor,
                lastErrorCode: errorCode,
                lockedByWorker: null,
                lockExpiresAt: null,
                failedAt: new Date(),
                updatedAt: new Date()
            }
        });
    }
}
