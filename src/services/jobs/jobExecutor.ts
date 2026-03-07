import { PrismaClient } from '@prisma/client';
import { JobRegistry } from './jobRegistry';
import { JobLocking } from './jobLocking';
import { JobRetryService } from './jobRetry';
import { JobDeadLetter } from './jobDeadLetter';

const prisma = new PrismaClient();

export class JobExecutor {

    /**
     * Entry point for a queue puller worker (BullMQ / Polling emulator)
     */
    static async executeNextJob(queueName: string, workerName: string) {
        // Find next eligible
        const nextJob = await prisma.systemJob.findFirst({
            where: {
                queueName,
                lockedByWorker: null,
                OR: [
                    { status: 'PENDING' },
                    { status: 'SCHEDULED', scheduledFor: { lte: new Date() } },
                    { status: 'RETRYING', scheduledFor: { lte: new Date() } }
                ]
            },
            orderBy: [
                { priority: 'desc' }, // CRITICAL before NORMAL
                { createdAt: 'asc' }
            ]
        });

        if (!nextJob) return null; // Queue empty or waiting

        return await this.executeJob(nextJob.id, workerName);
    }

    /**
     * Executes specific job ID context
     */
    static async executeJob(jobId: string, workerName: string) {
        // Try Lock
        const locked = await JobLocking.tryAcquireJobLock(jobId, workerName, 60000);
        if (!locked) return { status: 'LOCKED_BY_OTHER_WORKER' };

        const job = await prisma.systemJob.findUnique({ where: { id: jobId } });
        if (!job) return { status: 'JOB_NOT_FOUND' };

        console.log(`[WORKER_${workerName}] Executing Job ${job.id} (${job.jobType})`);

        const handler = JobRegistry.resolveJobHandler(job.jobType);

        // Log Attempt Start
        const attemptLog = await prisma.systemJobExecutionLog.create({
            data: {
                systemJobId: job.id,
                attemptNo: job.retryCount + 1,
                workerName,
                startedAt: new Date(),
                status: 'RUNNING'
            }
        });

        const startMs = Date.now();
        let executeSuccess = false;
        let thrownError: any = null;
        let responsePayload: any = null;

        try {
            // Real handler invoke
            responsePayload = await handler(job.metadata);
            executeSuccess = true;
        } catch (error: any) {
            console.error(`[WORKER_${workerName}] Job ${job.id} Failed: ${error.message}`);
            thrownError = error;
        }

        const duration = Date.now() - startMs;

        // Finalize Attempt
        await prisma.systemJobExecutionLog.update({
            where: { id: attemptLog.id },
            data: {
                status: executeSuccess ? 'SUCCEEDED' : 'FAILED',
                completedAt: new Date(),
                errorCode: thrownError?.name,
                errorMessage: thrownError?.message,
                durationMs: duration
            }
        });

        // Job State Machine Transition
        if (executeSuccess) {
            await prisma.systemJob.update({
                where: { id: job.id },
                data: {
                    status: 'SUCCEEDED',
                    completedAt: new Date(),
                    resultSummary: 'Task achieved securely.',
                    lockedByWorker: null,
                    lockExpiresAt: null
                }
            });
        } else {
            const retryAllowed = await JobRetryService.shouldRetry(job, thrownError);

            if (retryAllowed) {
                await JobRetryService.scheduleRetry(job.id, job, thrownError.name);
            } else {
                await JobDeadLetter.moveToDeadLetter(job, thrownError);
            }
        }

        return {
            status: executeSuccess ? 'SUCCEEDED' : 'FAILED_OR_RETRY',
            jobId: job.id,
            duration
        };
    }
}
