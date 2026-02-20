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
import { HepsiburadaService } from "../../hepsiburada";
import { redisConnection } from "../../../../lib/queue/redis";

export class HepsiburadaActionProvider implements MarketplaceActionProvider {
    async executeAction(input: MarketplaceActionInput): Promise<MarketplaceActionResult> {
        const { companyId, marketplace, orderId, actionKey, idempotencyKey, payload } = input;
        const ctx = `[HEPSIBURADA-ACTION:${actionKey}][IDEMP:${idempotencyKey}]`;

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
            if (!config) throw new Error('Hepsiburada yapılandırması bulunamadı');

            const configData = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
            const service = MarketplaceServiceFactory.createService(marketplace as any, configData) as HepsiburadaService;
            let result: any = null;

            if (actionKey === 'PRINT_LABEL_A4') {
                const order = await prisma.order.findFirst({
                    where: { id: orderId, companyId },
                    select: { orderNumber: true, shipmentPackageId: true }
                });
                if (!order) throw new Error('Sipariş bulunamadı');

                // Fallback sequence
                let shipmentPackageId = payload?.shipmentPackageId || payload?.labelShipmentPackageId || order.shipmentPackageId || order.orderNumber;
                if (!shipmentPackageId) throw new Error('Paket numarası veya Sipariş numarası bulunamadı');

                let labelResult = await service.getCargoLabel(shipmentPackageId);

                // If 404 or error, and we suspect shipmentPackageId might be an orderNumber, try to resolve real packageNumber
                if ((labelResult.error || !labelResult.pdfBase64)) {
                    console.log(`${ctx} Label fetch failed for ${shipmentPackageId}. Attempting to resolve package via orderNumber...`);
                    const pkgData = await service.getPackageByOrderNumber(order.orderNumber || shipmentPackageId);

                    if (pkgData) {
                        // Hepsiburada can return an array, a single object, or wrapped in a data/items field
                        const pkg = Array.isArray(pkgData) ? pkgData[0] : (pkgData.items?.[0] || pkgData.data?.[0] || pkgData);

                        // Extract PackageNumber (handle both casing)
                        const realPkgNo = pkg?.PackageNumber || pkg?.packageNumber || pkg?.id || pkg?.Id || pkg?.packageNo;

                        if (realPkgNo && String(realPkgNo) !== String(shipmentPackageId)) {
                            console.log(`${ctx} Resolved real package number from order: ${realPkgNo}`);
                            shipmentPackageId = String(realPkgNo);
                            labelResult = await service.getCargoLabel(shipmentPackageId);
                        } else if (!realPkgNo) {
                            console.log(`${ctx} Could not find real package number in resolved data. Raw: ${JSON.stringify(pkgData).substring(0, 200)}`);
                        }
                    }
                }

                if (labelResult.error) throw new Error(labelResult.error);
                if (!labelResult.pdfBase64) throw new Error('Etiket verisi boş');

                const pdfBuffer = Buffer.from(labelResult.pdfBase64, 'base64');
                const sha256 = createHash('sha256').update(pdfBuffer).digest('hex');
                const storageKey = generateLabelStorageKey(companyId, marketplace, shipmentPackageId);

                await uploadLabel(storageKey, pdfBuffer);

                await (prisma as any).marketplaceLabel.upsert({
                    where: { companyId_marketplace_shipmentPackageId: { companyId, marketplace, shipmentPackageId } },
                    update: { storageKey, sha256, size: pdfBuffer.length },
                    create: { companyId, marketplace, shipmentPackageId, storageKey, sha256, size: pdfBuffer.length }
                });

                result = { shipmentPackageId, storageKey, sha256, format: 'A4', labelReady: true, size: pdfBuffer.length };
            } else if (actionKey === 'REFRESH_STATUS') {
                const order = await prisma.order.findFirst({ where: { id: orderId, companyId } });
                if (!order || !order.orderNumber) throw new Error('Sipariş verisi eksik');

                const updated = await service.getOrderByNumber(order.orderNumber);
                if (!updated) throw new Error('Hepsiburada\'da bulunamadı');

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
                throw new Error(`Hepsiburada için henüz desteklenmeyen işlem: ${actionKey}`);
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
            return { status: "FAILED", errorMessage: error.message, errorCode: MarketplaceActionErrorCode.E_UNKNOWN, auditId: auditFailed?.id };
        } finally {
            await redisConnection.del(lockKey);
        }
    }
}
