import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../../lib/queue/redis';
import { marketplaceDlq } from '../../../lib/queue';
import prisma from '../../../lib/prisma';
import { MarketplaceServiceFactory } from '../index';
import { TrendyolService } from '../trendyol';
import { MarketplaceActionInput } from './types';
import { logger, metrics } from '../../../lib/observability';
import { classifyMarketplaceError } from './errors';

// ============================================================================
// MARKETPLACE ACTION WORKER
// ============================================================================

export const marketplaceWorker = new Worker(
    'marketplace-actions',
    async (job: Job<MarketplaceActionInput>) => {
        const start = Date.now();
        const { companyId, marketplace, orderId, actionKey, idempotencyKey, payload } = job.data;
        const logCtx = {
            companyId,
            marketplace,
            actionKey,
            idempotencyKey,
            jobId: job.id,
            retryCount: job.attemptsMade
        };

        logger.info('Worker processing started', logCtx);

        try {
            // 1. Get Audit Record to check if we should continue
            const audit = await (prisma as any).marketplaceActionAudit.findUnique({
                where: { idempotencyKey }
            });

            if (!audit || audit.status === 'SUCCESS') {
                logger.warn('Audit record missing or already successful. Skipping job.', logCtx);
                return;
            }

            // 2. Get Config
            const config = await (prisma as any).marketplaceConfig.findFirst({
                where: { companyId, type: marketplace },
            });
            if (!config) throw new Error('Yapılandırma bulunamadı');

            const configData = typeof config.settings === 'string'
                ? JSON.parse(config.settings)
                : config.settings;

            const service = MarketplaceServiceFactory.createService(
                marketplace,
                configData
            ) as TrendyolService;

            let result: any = null;

            if (actionKey === 'REFRESH_STATUS') {
                const order = await prisma.order.findFirst({ where: { id: orderId, companyId } });
                if (!order) throw new Error('Sipariş bulunamadı');

                const updatedOrder = await service.getOrderByNumber(order.orderNumber);
                if (!updatedOrder) throw new Error('Pazaryerinde sipariş bulunamadı');

                await prisma.order.updateMany({
                    where: { id: orderId, companyId },
                    data: {
                        status: updatedOrder.status,
                        shipmentPackageId: updatedOrder.shipmentPackageId || order.shipmentPackageId, // Update if available
                    },
                });

                result = {
                    previousStatus: order.status,
                    currentStatus: updatedOrder.status,
                    refreshedAt: new Date().toISOString()
                };
            }
            else if (actionKey === 'PRINT_LABEL_A4') {
                const shipmentPackageId = payload?.labelShipmentPackageId;
                if (!shipmentPackageId) throw new Error('shipmentPackageId gerekli');

                const pdfBase64 = await service.getCommonLabel(shipmentPackageId);
                if (!pdfBase64) throw new Error('Etiket alınamadı');

                const pdfBuffer = Buffer.from(pdfBase64, 'base64');
                const { createHash } = await import('crypto');
                const sha256 = createHash('sha256').update(pdfBuffer).digest('hex');
                const size = pdfBuffer.length;

                const { uploadLabel, generateLabelStorageKey } = await import('../../../lib/s3');
                const storageKey = generateLabelStorageKey(companyId, marketplace, shipmentPackageId);

                await uploadLabel(storageKey, pdfBuffer);

                await (prisma as any).marketplaceLabel.upsert({
                    where: {
                        companyId_marketplace_shipmentPackageId: {
                            companyId,
                            marketplace,
                            shipmentPackageId
                        }
                    },
                    update: { storageKey, sha256, size },
                    create: { companyId, marketplace, shipmentPackageId, storageKey, sha256, size }
                });

                metrics.labelStored(marketplace, size);
                result = { shipmentPackageId, storageKey, sha256, format: 'A4', labelReady: true };
            }
            else if (actionKey === 'CHANGE_CARGO') {
                const shipmentPackageId = payload?.shipmentPackageId;
                const cargoProviderCode = payload?.cargoProviderCode;

                if (!shipmentPackageId || !cargoProviderCode) {
                    throw new Error('shipmentPackageId ve cargoProviderCode gerekli');
                }

                const res = await service.updateCargoProvider(shipmentPackageId, cargoProviderCode);
                if (!res.success) throw new Error(res.error || 'Kargo sağlayıcı güncellenemedi');

                // Update Local Order if possible
                await prisma.order.updateMany({
                    where: { shipmentPackageId, companyId },
                    data: { cargoProvider: cargoProviderCode }
                });

                result = { shipmentPackageId, cargoProviderCode, updated: true };
            }

            // 3. Finalize Audit Record as SUCCESS
            await (prisma as any).marketplaceActionAudit.update({
                where: { idempotencyKey },
                data: {
                    status: 'SUCCESS',
                    responsePayload: result,
                    jobId: job.id,
                    retryCount: job.attemptsMade,
                    errorMessage: null
                }
            });

            metrics.externalCall(marketplace, actionKey, 'SUCCESS');
            metrics.queueLatency(actionKey, Date.now() - start);
            logger.info('Worker processing SUCCESS', logCtx);
            return result;

        } catch (error: any) {
            metrics.externalCall(marketplace, actionKey, 'FAILED');

            const classified = classifyMarketplaceError(error);

            // Update Failure History in DB
            const historyUpdate = {
                error: classified.message,
                errorCode: classified.errorCode,
                at: new Date().toISOString(),
                attempt: job.attemptsMade + 1,
                retryable: classified.isRetryable
            };

            const shouldRetry = classified.isRetryable && job.attemptsMade < (job.opts.attempts || 1) - 1;

            await (prisma as any).marketplaceActionAudit.update({
                where: { idempotencyKey },
                data: {
                    status: shouldRetry ? 'PENDING' : 'FAILED',
                    errorMessage: classified.message,
                    errorCode: classified.errorCode,
                    retryCount: job.attemptsMade + 1,
                    failureHistory: {
                        push: historyUpdate
                    }
                }
            });

            logger.error('Worker processing FAILED', {
                ...logCtx,
                errorCode: classified.errorCode,
                isRetryable: classified.isRetryable,
                error: classified.message
            });

            // If not retryable or max attempts reached, move to DLQ
            if (!shouldRetry) {
                try {
                    await marketplaceDlq.add(`dead:${actionKey}`, {
                        originalJobId: job.id,
                        input: job.data,
                        error: {
                            message: classified.message,
                            errorCode: classified.errorCode,
                            stack: error.stack,
                        },
                        failedAt: new Date().toISOString(),
                        attemptsMade: job.attemptsMade + 1,
                    }, {
                        jobId: `dlq:${idempotencyKey}` // Deterministic DLQ ID
                    });

                    logger.info(`Job moved to DLQ: ${idempotencyKey}`, logCtx);
                } catch (dlqError) {
                    logger.error('Failed to move job to DLQ', dlqError, logCtx);
                }

                await job.discard();
                return; // Stop. Don't throw so BullMQ doesn't auto-retry
            }

            throw error;
        }
    },
    {
        connection: redisConnection as any,
        concurrency: 5, // Process up to 5 jobs simultaneously
    }
);

// ============================================================================
// EVENT LISTENERS
// ============================================================================

marketplaceWorker.on('completed', (job) => {
    console.log(JSON.stringify({
        event: 'job_completed',
        timestamp: new Date().toISOString(),
        jobId: job.id,
        jobName: job.name,
        duration: job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : null,
    }));
});

marketplaceWorker.on('failed', (job, err) => {
    console.error(JSON.stringify({
        event: 'job_failed',
        timestamp: new Date().toISOString(),
        jobId: job?.id,
        jobName: job?.name,
        error: err.message,
        attemptsMade: job?.attemptsMade,
    }));
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const handleShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down worker gracefully...`);

    try {
        await marketplaceWorker.close();
        console.log('✅ Worker closed. No more jobs will be processed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during worker shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

console.log('🤖 Marketplace Action Worker is listening for jobs...');


