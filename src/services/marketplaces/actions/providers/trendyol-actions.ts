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

export class TrendyolActionProvider implements MarketplaceActionProvider {
    async executeAction(input: MarketplaceActionInput): Promise<MarketplaceActionResult> {
        const { companyId, marketplace, orderId, actionKey, idempotencyKey, payload } = input;

        // Correlation Context
        const ctx = `[ACTION:${actionKey}][IDEMP:${idempotencyKey}]`;

        console.log(`${ctx} Processing SYNCHRONOUSLY (Queue Bypassed)`);

        // 1) Upsert Audit Record (Set as PENDING initially)
        const audit = await (prisma as any).marketplaceActionAudit.upsert({
            where: { idempotencyKey },
            update: {
                status: "PENDING",
                errorMessage: null
            },
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

        // If already success, return immediately
        if (audit.status === "SUCCESS" && audit.responsePayload) {
            console.log(`${ctx} Idempotency hit: SUCCESS`);
            metrics.idempotencyHit(marketplace, actionKey);
            return { status: "SUCCESS", auditId: audit.id, result: audit.responsePayload };
        }

        try {
            // 2) Get Config & Initialize Service
            const config = await (prisma as any).marketplaceConfig.findFirst({
                where: { companyId, type: marketplace, deletedAt: null },
            });
            if (!config) throw new Error('Yapılandırma bulunamadı');

            const configData = typeof config.settings === 'string'
                ? JSON.parse(config.settings)
                : config.settings;

            const service = MarketplaceServiceFactory.createService(marketplace as any, configData) as TrendyolService;
            let result: any = null;

            // 3) Execute Logic Based on Action Key
            if (actionKey === 'PRINT_LABEL_A4') {
                const shipmentPackageId = payload?.labelShipmentPackageId;
                if (!shipmentPackageId) throw new Error('shipmentPackageId gerekli');

                const pdfBase64 = await service.getCommonLabel(shipmentPackageId);
                if (!pdfBase64) throw new Error('Etiket Trendyol\'dan alınamadı (Boş yanıt)');

                const pdfBuffer = Buffer.from(pdfBase64, 'base64');
                const sha256 = createHash('sha256').update(pdfBuffer).digest('hex');
                const size = pdfBuffer.length;
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
            else if (actionKey === 'REFRESH_STATUS') {
                const order = await prisma.order.findFirst({ where: { id: orderId, companyId } });
                if (!order) throw new Error('Sipariş bulunamadı');
                if (!order.orderNumber) throw new Error('Sipariş numarası eksik');

                const updatedOrder = await service.getOrderByNumber(order.orderNumber);
                if (!updatedOrder) throw new Error('Trendyol\'da sipariş bulunamadı');

                // Dynamic update object to avoid undefined issues
                const updateData: any = {
                    status: updatedOrder.status,
                };

                if (updatedOrder.shipmentPackageId) {
                    updateData.shipmentPackageId = updatedOrder.shipmentPackageId;
                }

                // Map cargoTrackingNumber to cargoTrackingNo (Schema Name Mismatch Fix)
                if (updatedOrder.cargoTrackingNumber) {
                    updateData.cargoTrackingNo = updatedOrder.cargoTrackingNumber;
                }

                // cargoTrackingLink is not in schema, ignoring it.

                await prisma.order.update({
                    where: { id: orderId }, // Use ID directly since companyId is checked above
                    data: updateData
                });

                result = {
                    previousStatus: order.status,
                    currentStatus: updatedOrder.status,
                    shipmentPackageId: updatedOrder.shipmentPackageId || order.shipmentPackageId,
                    refreshedAt: new Date().toISOString()
                };
            }
            else if (actionKey === 'CHANGE_CARGO') {
                const shipmentPackageId = payload?.shipmentPackageId;
                const cargoProviderCode = payload?.cargoProviderCode;

                if (!shipmentPackageId || !cargoProviderCode) {
                    throw new Error('shipmentPackageId ve cargoProviderCode gerekli');
                }

                const res = await service.updateCargoProvider(shipmentPackageId, cargoProviderCode);
                if (!res.success) throw new Error(res.error || 'Kargo sağlayıcı güncellenemedi');

                // Update Local Order
                await prisma.order.updateMany({
                    where: { shipmentPackageId, companyId },
                    data: { cargoProvider: cargoProviderCode }
                });

                result = { shipmentPackageId, cargoProviderCode, updated: true };
            }
            else {
                throw new Error(`Desteklenmeyen işlem: ${actionKey}`);
            }

            // 4) Success: Update Audit & Return
            await (prisma as any).marketplaceActionAudit.update({
                where: { id: audit.id },
                data: {
                    status: 'SUCCESS',
                    responsePayload: result,
                    errorMessage: null
                }
            });

            metrics.externalCall(marketplace, actionKey, 'SUCCESS');
            return { status: "SUCCESS", auditId: audit.id, result };

        } catch (error: any) {
            console.error(`${ctx} Sync execution failed:`, error);
            metrics.externalCall(marketplace, actionKey, 'FAILED');

            // 5) Failure: Update Audit & Return
            await (prisma as any).marketplaceActionAudit.update({
                where: { id: audit.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error.message,
                    // errorCode: MarketplaceActionErrorCode.E_UNKNOWN // REMOVED: Field not in schema
                }
            });

            return {
                status: "FAILED",
                auditId: audit.id,
                errorMessage: error.message,
                errorCode: MarketplaceActionErrorCode.E_UNKNOWN
            };
        }

    }
}
