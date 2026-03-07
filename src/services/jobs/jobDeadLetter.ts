import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class JobDeadLetter {

    static async moveToDeadLetter(job: any, error: any) {
        // Step 1: Save failed job into quarantine
        const dlq = await prisma.systemDeadLetterJob.create({
            data: {
                originalJobId: job.id,
                queueName: job.queueName,
                jobType: job.jobType,
                tenantId: job.tenantId,
                payloadHash: job.payloadHash,
                idempotencyKey: job.idempotencyKey,
                errorCode: error.name || 'UNKNOWN',
                errorMessage: error.message || 'Execution failed permanently',
                failedAttempts: job.retryCount + 1,
                metadata: { originalPayload: job.metadata?.payload, module: job.moduleScope }
            }
        });

        // Step 2: Mark original permanently DEAD_LETTER
        await prisma.systemJob.update({
            where: { id: job.id },
            data: {
                status: 'DEAD_LETTER',
                failedAt: new Date(),
                lockedByWorker: null,
                lockExpiresAt: null,
                lastErrorCode: error.name,
                lastErrorMessage: error.message
            }
        });

        console.error(`[DEAD_LETTER] Job ${job.id} (${job.jobType}) quarantined to DLQ. ID: ${dlq.id}`);
        return dlq;
    }

    static async listDeadLetters(filters: any = {}) {
        const whereClause: any = {};
        if (filters.jobType) whereClause.jobType = filters.jobType;
        if (filters.queueName) whereClause.queueName = filters.queueName;

        return await prisma.systemDeadLetterJob.findMany({
            where: whereClause,
            orderBy: { movedAt: 'desc' },
            take: 100
        });
    }

    static async requeueDeadLetter(deadLetterId: string) {
        const dlq = await prisma.systemDeadLetterJob.findUnique({ where: { id: deadLetterId } });
        if (!dlq) throw new Error('Dead letter not found');

        // Restore to system queue
        const jobDefinition = require('./jobRegistry').JobRegistry.getJobDefinition(dlq.jobType);

        if (!jobDefinition) throw new Error('Job type handler is no longer registered. Cannot restore.');

        const revivedJob = await prisma.systemJob.create({
            data: {
                queueName: dlq.queueName,
                jobType: dlq.jobType,
                tenantId: dlq.tenantId,
                moduleScope: jobDefinition.moduleScope,
                status: 'PENDING',
                priority: jobDefinition.defaultPriority,
                idempotencyKey: dlq.idempotencyKey,
                payloadHash: dlq.payloadHash,
                maxRetries: jobDefinition.maxRetries,
                backoffStrategy: jobDefinition.backoff,
                metadata: dlq.metadata
            }
        });

        // Cleanup DLQ entry
        await prisma.systemDeadLetterJob.delete({ where: { id: dlq.id } });

        console.log(`[DEAD_LETTER] Restored DLQ ${dlq.id} to new Job ${revivedJob.id}`);
        return revivedJob;
    }
}
