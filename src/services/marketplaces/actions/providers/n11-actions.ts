import prisma from "../../../../lib/prisma";
import {
    MarketplaceActionErrorCode,
    MarketplaceActionInput,
    MarketplaceActionProvider,
    MarketplaceActionResult,
} from "../types";
import { MarketplaceServiceFactory } from "../../index";
import { uploadLabel, generateLabelStorageKey } from "../../../../lib/s3";
import { metrics } from "../../../../lib/observability";
import { createHash } from "crypto";
import { N11Service } from "../../n11";
import { redisConnection } from "../../../../lib/queue/redis";

export class N11ActionProvider implements MarketplaceActionProvider {
    async executeAction(input: MarketplaceActionInput): Promise<MarketplaceActionResult> {
        const { companyId, marketplace, orderId, actionKey, idempotencyKey, payload } = input;
        const ctx = `[N11-ACTION:${actionKey}][IDEMP:${idempotencyKey}]`;

        const lockKey = `lock:action:${idempotencyKey}`;
        const acquired = await redisConnection.set(lockKey, 'BUSY', 'EX', 60, 'NX');

        if (!acquired) {
            const existingAudit = await (prisma as any).marketplaceActionAudit.findUnique({ where: { idempotencyKey } });
            return { status: "PENDING", auditId: existingAudit?.id, errorMessage: "İşlem devam ediyor..." };
        }

        try {
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
                return { status: "SUCCESS", auditId: audit.id, result: audit.responsePayload };
            }

            const config = await (prisma as any).marketplaceConfig.findFirst({
                where: { companyId, type: marketplace, deletedAt: null },
            });
            if (!config) throw new Error('N11 yapılandırması bulunamadı');

            const configData = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
            const service = MarketplaceServiceFactory.createService(marketplace as any, configData) as N11Service;
            let result: any = null;

            if (actionKey === 'PRINT_LABEL_A4') {
                const order = await prisma.order.findFirst({
                    where: { id: orderId, companyId },
                    select: { orderNumber: true, shipmentPackageId: true }
                });
                if (!order) throw new Error('Sipariş bulunamadı');

                let packageIdToFetch = payload?.shipmentPackageId || payload?.labelShipmentPackageId || order.shipmentPackageId || order.orderNumber;
                if (!packageIdToFetch) throw new Error('Paket numarası veya Sipariş numarası bulunamadı');

                console.log(`${ctx} Attempting N11 label fetch for: ${packageIdToFetch}`);
                let labelResult = await service.getCargoLabel(packageIdToFetch);

                // Smart fallback for N11: If fetch by orderNumber fails, try to resolve real package number
                if ((labelResult.error || !labelResult.pdfBase64) && packageIdToFetch === order.orderNumber) {
                    console.log(`${ctx} fetch with orderNumber failed. Attempting to resolve via getOrderByNumber...`);
                    const realOrder = await service.getOrderByNumber(order.orderNumber);
                    if (realOrder && realOrder.shipmentPackageId && realOrder.shipmentPackageId !== packageIdToFetch) {
                        console.log(`${ctx} Resolved real package number: ${realOrder.shipmentPackageId}. Fetching again...`);
                        packageIdToFetch = realOrder.shipmentPackageId;
                        labelResult = await service.getCargoLabel(packageIdToFetch);
                    }
                }

                if (labelResult.error) {
                    throw new Error(`N11 API Hatası (HTTP ${labelResult.status || '??'}): ${labelResult.error}`);
                }
                if (!labelResult.pdfBase64) throw new Error('Etiket verisi boş');

                const pdfBuffer = Buffer.from(labelResult.pdfBase64, 'base64');
                const sha256 = createHash('sha256').update(pdfBuffer).digest('hex');
                const storageKey = generateLabelStorageKey(companyId, marketplace, packageIdToFetch);

                await uploadLabel(storageKey, pdfBuffer);

                await (prisma as any).marketplaceLabel.upsert({
                    where: { companyId_marketplace_shipmentPackageId: { companyId, marketplace, shipmentPackageId: packageIdToFetch } },
                    update: { storageKey, sha256, size: pdfBuffer.length },
                    create: { companyId, marketplace, shipmentPackageId: packageIdToFetch, storageKey, sha256, size: pdfBuffer.length }
                });

                result = { shipmentPackageId: packageIdToFetch, storageKey, sha256, format: 'A4', labelReady: true, size: pdfBuffer.length };
            } else if (actionKey === 'REFRESH_STATUS') {
                const order = await prisma.order.findFirst({ where: { id: orderId, companyId } });
                if (!order || !order.orderNumber) throw new Error('Sipariş verisi eksik');

                const updated = await service.getOrderByNumber(order.orderNumber);
                if (!updated) throw new Error('N11\'de bulunamadı');

                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        status: updated.status,
                        cargoTrackingNo: updated.cargoTrackingNumber || order.cargoTrackingNo,
                        cargoProvider: updated.cargoProvider || order.cargoProvider,
                        shipmentPackageId: updated.shipmentPackageId || order.shipmentPackageId
                    }
                });
                result = { previousStatus: order.status, currentStatus: updated.status };
            } else {
                throw new Error(`N11 için henüz desteklenmeyen işlem: ${actionKey}`);
            }

            await (prisma as any).marketplaceActionAudit.update({
                where: { id: audit.id },
                data: { status: 'SUCCESS', responsePayload: result, errorMessage: null }
            });

            metrics.externalCall(marketplace, actionKey, 'SUCCESS');
            return { status: "SUCCESS", auditId: audit.id, result };

        } catch (error: any) {
            console.error(`${ctx} Failed:`, error.message);
            metrics.externalCall(marketplace, actionKey, 'FAILED');

            await (prisma as any).marketplaceActionAudit.updateMany({
                where: { idempotencyKey },
                data: { status: 'FAILED', errorMessage: error.message }
            });

            const auditFailed = await (prisma as any).marketplaceActionAudit.findUnique({ where: { idempotencyKey } });
            return { status: "FAILED", errorMessage: error.message, errorCode: MarketplaceActionErrorCode.E_REMOTE_API_ERROR, auditId: auditFailed?.id };
        } finally {
            await redisConnection.del(lockKey);
        }
    }
}
