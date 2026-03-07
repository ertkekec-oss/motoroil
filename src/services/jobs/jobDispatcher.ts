import { PrismaClient, SystemJobStatus } from '@prisma/client';
import { JobRegistry } from './jobRegistry';

const prisma = new PrismaClient();

export class JobDispatcher {

    static async dispatchJob(input: {
        jobType: string,
        payload: any,
        tenantId?: string,
        idempotencyKey?: string,
        priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
    }) {
        const def = JobRegistry.getJobDefinition(input.jobType);
        if (!def) throw new Error(`JOB_HANDLER_NOT_REGISTERED: ${input.jobType}`);

        if (input.idempotencyKey && def.idempotencyRequired) {
            const existing = await prisma.systemJob.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
            if (existing && existing.status !== 'FAILED') {
                console.log(`[JOB_DISPATCHER] Duplicate blocked for Idempotency: ${input.idempotencyKey}`);
                return existing;
            }
        }

        const payloadHash = Buffer.from(JSON.stringify(input.payload)).toString('base64');

        return await prisma.systemJob.create({
            data: {
                queueName: def.defaultQueue,
                jobType: def.jobType,
                tenantId: input.tenantId,
                moduleScope: def.moduleScope,
                status: 'PENDING',
                priority: input.priority || def.defaultPriority,
                idempotencyKey: input.idempotencyKey,
                payloadHash,
                maxRetries: def.maxRetries,
                backoffStrategy: def.backoff,
                metadata: { payload: input.payload }
            }
        });
    }

    static async dispatchDelayedJob(input: {
        jobType: string,
        payload: any,
        scheduledFor: Date,
        tenantId?: string,
        idempotencyKey?: string
    }) {
        const def = JobRegistry.getJobDefinition(input.jobType);
        if (!def || !def.supportsScheduling) throw new Error(`Scheduling not supported for ${input.jobType}`);

        const payloadHash = Buffer.from(JSON.stringify(input.payload)).toString('base64');

        return await prisma.systemJob.create({
            data: {
                queueName: def.defaultQueue,
                jobType: def.jobType,
                tenantId: input.tenantId,
                moduleScope: def.moduleScope,
                status: 'SCHEDULED',
                priority: def.defaultPriority,
                idempotencyKey: input.idempotencyKey,
                payloadHash,
                scheduledFor: input.scheduledFor,
                maxRetries: def.maxRetries,
                backoffStrategy: def.backoff,
                metadata: { payload: input.payload }
            }
        });
    }

    static async cancelJob(jobId: string) {
        return await prisma.systemJob.update({
            where: { id: jobId },
            data: { status: 'CANCELED', updatedAt: new Date() }
        });
    }

    static async rescheduleJob(jobId: string, scheduledFor: Date) {
        return await prisma.systemJob.update({
            where: { id: jobId },
            data: { status: 'SCHEDULED', scheduledFor, updatedAt: new Date() }
        });
    }
}
