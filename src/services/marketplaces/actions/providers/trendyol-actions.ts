import prisma from "../../../../lib/prisma";
import {
    MarketplaceActionErrorCode,
    MarketplaceActionInput,
    MarketplaceActionProvider,
    MarketplaceActionResult,
} from "../types";
import { MarketplaceServiceFactory } from "../../index";
import { uploadLabel, generateLabelStorageKey } from "../../../../lib/s3";
import { metrics, logger } from "../../../../lib/observability";
import { createHash } from "crypto";
import { TrendyolService } from "../../trendyol";
import { redisConnection } from "../../../../lib/queue/redis";

export class TrendyolActionProvider implements MarketplaceActionProvider {
    async executeAction(input: MarketplaceActionInput): Promise<MarketplaceActionResult> {
        const { companyId, marketplace, orderId, actionKey, idempotencyKey, payload } = input;
        const ctx = `[ACTION:${actionKey}][IDEMP:${idempotencyKey}]`;

        // 1) Redis Lock Check
        const lockKey = `lock:action:${idempotencyKey}`;
        const acquired = await redisConnection.set(lockKey, 'BUSY', 'NX', 'EX', 60);

        console.log(`${ctx} Redis lock acquired: ${!!acquired}`);

        if (!acquired) {
            console.log(`${ctx} Busy (Parallel process running). returning PENDING.`);
            const existingAudit = await (prisma as any).marketplaceActionAudit.findUnique({ where: { idempotencyKey } });
            return { status: "PENDING", auditId: existingAudit?.id, errorMessage: "İşlem devam ediyor..." };
        }

        try {
            // ... (rest of the logic)
            // ... (rest of the logic)
            // 2) Audit Record Management
            const audit = await (prisma as any).marketplaceActionAudit.upsert({
                where: { idempotencyKey },
                update: { status: "PENDING", errorMessage: null },
                create: {
                    companyId,
                    marketplace,
                    orderId,
                    actionKey,
                    idempotencyKey,
                    status: "PENDING",
                    requestPayload: payload ?? undefined,
                },
            });

            if (audit.status === "SUCCESS" && audit.responsePayload) {
                console.log(`${ctx} Idempotency SUCCESS.`);
                return { status: "SUCCESS", auditId: audit.id, result: audit.responsePayload };
            }

            console.log(`${ctx} Executing...`);

            // 3) Initialize Service
            const config = await (prisma as any).marketplaceConfig.findFirst({
                where: { companyId, type: marketplace, deletedAt: null },
            });
            if (!config) throw new Error('Yapılandırma bulunamadı');

            const configData = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
            const service = MarketplaceServiceFactory.createService(marketplace as any, configData) as TrendyolService;
            let result: any = null;

            // 4) Logic Dispatch
            if (actionKey === 'PRINT_LABEL_A4') {
                const shipmentPackageId = payload?.shipmentPackageId || payload?.labelShipmentPackageId;
                if (!shipmentPackageId) throw new Error('shipmentPackageId gerekli');

                const order = await prisma.order.findFirst({
                    where: { id: orderId, companyId },
                    select: { cargoTrackingNo: true }
                });

                const labelResult = await service.getCommonLabel(shipmentPackageId, order?.cargoTrackingNo || undefined);

                // Update audit with raw response for visibility
                await (prisma as any).marketplaceActionAudit.update({
                    where: { id: audit.id },
                    data: { responsePayload: labelResult.raw }
                });

                if (labelResult.status === 'PENDING') {
                    return { status: "PENDING", auditId: audit.id, httpStatus: labelResult.httpStatus, errorMessage: labelResult.error };
                }

                if (labelResult.status === 'FAILED') {
                    throw new Error(labelResult.error || 'Etiket alınamadı');
                }

                // Success processing
                const pdfBuffer = Buffer.from(labelResult.pdfBase64!, 'base64');
                const sha256 = createHash('sha256').update(pdfBuffer).digest('hex');
                const storageKey = generateLabelStorageKey(companyId, marketplace, shipmentPackageId);

                await uploadLabel(storageKey, pdfBuffer);

                await (prisma as any).marketplaceLabel.upsert({
                    where: { companyId_marketplace_shipmentPackageId: { companyId, marketplace, shipmentPackageId } },
                    update: { storageKey, sha256, size: pdfBuffer.length },
                    create: { companyId, marketplace, shipmentPackageId, storageKey, sha256, size: pdfBuffer.length }
                });

                result = { shipmentPackageId, storageKey, sha256, format: 'A4', labelReady: true };
            } else if (actionKey === 'REFRESH_STATUS') {
                const order = await prisma.order.findFirst({ where: { id: orderId, companyId } });
                if (!order || !order.orderNumber) throw new Error('Sipariş verisi eksik');

                const updated = await service.getOrderByNumber(order.orderNumber);
                if (!updated) throw new Error('Trendyol\'da bulunamadı');

                const updateData: any = { status: updated.status };
                if (updated.shipmentPackageId) updateData.shipmentPackageId = String(updated.shipmentPackageId);
                if (updated.cargoTrackingNumber) updateData.cargoTrackingNo = String(updated.cargoTrackingNumber);

                await prisma.order.update({ where: { id: orderId }, data: updateData });
                result = { previousStatus: order.status, currentStatus: updated.status };
            } else if (actionKey === 'CHANGE_CARGO') {
                const shipmentPackageId = payload?.shipmentPackageId;
                const code = payload?.cargoProviderCode;
                if (!shipmentPackageId || !code) throw new Error('Eksik parametre');

                const res = await service.updateCargoProvider(shipmentPackageId, code);
                if (!res.success) throw new Error(res.error || 'Hata');

                await prisma.order.updateMany({ where: { shipmentPackageId, companyId }, data: { cargoProvider: code } });
                result = { updated: true };
            } else {
                throw new Error(`Bilinmeyen işlem: ${actionKey}`);
            }

            // 5) Final Audit Update
            await (prisma as any).marketplaceActionAudit.update({
                where: { id: audit.id },
                data: { status: 'SUCCESS', responsePayload: result, errorMessage: null }
            });

            metrics.externalCall(marketplace, actionKey, 'SUCCESS');
            return { status: "SUCCESS", auditId: audit.id, result };

        } catch (error: any) {
            console.error(`${ctx} Failed:`, error.message);
            metrics.externalCall(marketplace, actionKey, 'FAILED');

            const auditId = (prisma as any).marketplaceActionAudit.findUnique({ where: { idempotencyKey } })
                .then((a: any) => a?.id).catch(() => undefined);

            await (prisma as any).marketplaceActionAudit.updateMany({
                where: { idempotencyKey },
                data: { status: 'FAILED', errorMessage: error.message }
            });

            return { status: "FAILED", errorMessage: error.message, errorCode: MarketplaceActionErrorCode.E_UNKNOWN };

        } finally {
            await redisConnection.del(lockKey);
        }
    }
}
