import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../../lib/queue';
import prisma from '../../../lib/prisma';
import { MarketplaceServiceFactory } from '../index';
import { TrendyolService } from '../trendyol';
import { MarketplaceActionInput } from './types';
import { logger, metrics } from '../../../lib/observability';

export const marketplaceWorker = new Worker(
    'marketplace-actions',
    async (job: Job<MarketplaceActionInput>) => {
        const start = Date.now();
        const { companyId, marketplace, orderId, actionKey, idempotencyKey, payload } = job.data;
        const logCtx = { companyId, marketplace, actionKey, idempotencyKey, jobId: job.id, retryCount: job.attemptsMade };

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
                    data: { status: updatedOrder.status },
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

            // Update Failure History in DB
            const historyUpdate = {
                error: error.message,
                at: new Date().toISOString(),
                attempt: job.attemptsMade + 1
            };

            await (prisma as any).marketplaceActionAudit.update({
                where: { idempotencyKey },
                data: {
                    status: job.attemptsMade < (job.opts.attempts || 1) - 1 ? 'PENDING' : 'FAILED',
                    errorMessage: error.message,
                    retryCount: job.attemptsMade + 1,
                    failureHistory: {
                        push: historyUpdate
                    }
                }
            });

            logger.error('Worker processing FAILED', error, logCtx);
            throw error;
        }
    },
    { connection: redisConnection as any }
);
