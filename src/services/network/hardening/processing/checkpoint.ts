import prisma from '@/lib/prisma';

function getExpiryDate(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
}

export async function shouldProcess(idempotencyKey: string, processorType: string, entityType: string, entityId: string) {
    const checkpoint = await prisma.networkProcessingCheckpoint.findUnique({
        where: { idempotencyKey }
    });

    if (!checkpoint) {
        await prisma.networkProcessingCheckpoint.create({
            data: { processorType, entityType, entityId, idempotencyKey, processingStatus: 'PENDING' }
        });
        return true;
    }

    if (checkpoint.processingStatus === 'PROCESSED' || checkpoint.processingStatus === 'SKIPPED') return false;

    // Allow retry on FAILED if under threshold
    if (checkpoint.processingStatus === 'FAILED' && checkpoint.retryCount < 3) {
        return true;
    }

    return false;
}

export async function markProcessed(idempotencyKey: string, resultHash?: string) {
    return prisma.networkProcessingCheckpoint.update({
        where: { idempotencyKey },
        data: {
            processingStatus: 'PROCESSED',
            lastProcessedAt: new Date(),
            resultHash,
            expiresAt: getExpiryDate(7) // 7 days retention for successful items
        }
    });
}

export async function markFailed(idempotencyKey: string, errorCode: string) {
    return prisma.networkProcessingCheckpoint.update({
        where: { idempotencyKey },
        data: {
            processingStatus: 'FAILED',
            errorCode,
            retryCount: { increment: 1 },
            expiresAt: getExpiryDate(30) // 30 days retention for failures
        }
    });
}

export async function markSkipped(idempotencyKey: string, reason: string) {
    return prisma.networkProcessingCheckpoint.update({
        where: { idempotencyKey },
        data: {
            processingStatus: 'SKIPPED',
            errorCode: reason,
            expiresAt: getExpiryDate(7) // 7 days retention
        }
    });
}

export async function purgeExpiredCheckpoints() {
    return prisma.networkProcessingCheckpoint.deleteMany({
        where: {
            expiresAt: { lte: new Date() }
        }
    });
}
