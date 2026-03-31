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
        const acquired = redisConnection ? await redisConnection.set(lockKey, 'BUSY', 'EX', 60, 'NX') : true;

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

                const labelResult = await service.getCommonLabel(shipmentPackageId);

                // Update audit with response status for visibility
                await (prisma as any).marketplaceActionAudit.update({
                    where: { id: audit.id },
                    data: { responsePayload: { status: labelResult.status, error: labelResult.error } }
                });

                if (labelResult.status === 'PENDING') {
                    return { status: "PENDING", auditId: audit.id, httpStatus: labelResult.httpStatus, errorMessage: labelResult.error };
                }


                if (labelResult.status === 'FAILED') {
                    let fallbackHtmlData = null;
                    if (labelResult.error?.includes('Service Unavailable') || labelResult.error?.includes('Hatası') || labelResult.error?.includes('hata')) {
                         try {
                             fallbackHtmlData = await service.getShipmentPackageDetails(shipmentPackageId);
                         } catch(e) {}
                    }
                    if (fallbackHtmlData) {
                         return { status: "FAILED", auditId: audit.id, errorMessage: labelResult.error, result: { fallbackData: fallbackHtmlData } };
                    }
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

                console.info(`${ctx} SUCCESS: Label generated. Storage: ${storageKey}, Size: ${pdfBuffer.length} bytes, SHA256: ${sha256.substring(0, 8)}...`);
                result = { shipmentPackageId, storageKey, sha256, format: 'A4', labelReady: true, size: pdfBuffer.length };
            } else if (actionKey === 'PRINT_LABEL_ZPL') {
                const shipmentPackageId = payload?.shipmentPackageId || payload?.labelShipmentPackageId;
                if (!shipmentPackageId) throw new Error('shipmentPackageId gerekli');

                const labelResult = await service.getCommonLabel(shipmentPackageId, 'ZPL');

                if (labelResult.status === 'PENDING') {
                    return { status: "PENDING", auditId: audit.id, httpStatus: labelResult.httpStatus, errorMessage: labelResult.error };
                }

                if (labelResult.status === 'FAILED') {
                    let fallbackHtmlData = null;
                    if (labelResult.error?.includes('Service Unavailable') || labelResult.error?.includes('Hatası') || labelResult.error?.includes('hata')) {
                         try {
                             fallbackHtmlData = await service.getShipmentPackageDetails(shipmentPackageId);
                         } catch(e) {}
                    }
                    if (fallbackHtmlData) {
                         return { status: "FAILED", auditId: audit.id, errorMessage: labelResult.error, result: { fallbackData: fallbackHtmlData } };
                    }
                    throw new Error(labelResult.error || 'Etiket alınamadı');
                }

                // Success processing - Handle Fallback (PDF received instead of ZPL)
                if (!labelResult.zpl && labelResult.pdfBase64) {
                    const pdfBuffer = Buffer.from(labelResult.pdfBase64, 'base64');
                    const sha256 = createHash('sha256').update(pdfBuffer).digest('hex');
                    const storageKey = generateLabelStorageKey(companyId, marketplace, shipmentPackageId);

                    await uploadLabel(storageKey, pdfBuffer);

                    await (prisma as any).marketplaceLabel.upsert({
                        where: { companyId_marketplace_shipmentPackageId: { companyId, marketplace, shipmentPackageId } },
                        update: { storageKey, sha256, size: pdfBuffer.length },
                        create: { companyId, marketplace, shipmentPackageId, storageKey, sha256, size: pdfBuffer.length }
                    });

                    result = {
                        shipmentPackageId,
                        storageKey,
                        sha256,
                        format: 'A4', // Fallback format
                        labelReady: true,
                        size: pdfBuffer.length,
                        message: "ZPL yetkisi olmadığı için PDF formatına geri dönüldü."
                    };
                } else {
                    const zplContent = labelResult.zpl!;
                    const zplBuffer = Buffer.from(zplContent, 'utf-8');
                    const sha256 = createHash('sha256').update(zplBuffer).digest('hex');
                    const storageKey = generateLabelStorageKey(companyId, marketplace, shipmentPackageId) + ".zpl";

                    await uploadLabel(storageKey, zplBuffer);

                    await (prisma as any).marketplaceLabel.upsert({
                        where: { companyId_marketplace_shipmentPackageId: { companyId, marketplace, shipmentPackageId } },
                        update: { storageKey, sha256, size: zplBuffer.length },
                        create: { companyId, marketplace, shipmentPackageId, storageKey, sha256, size: zplBuffer.length }
                    });

                    console.info(`${ctx} SUCCESS: ZPL Label generated. Storage: ${storageKey}, Size: ${zplBuffer.length} bytes`);
                    result = { shipmentPackageId, storageKey, sha256, format: 'ZPL', labelReady: true, size: zplBuffer.length, zpl: zplContent };
                }
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
            } else if (actionKey === 'SYNC_SETTLEMENT') {
                const order = await prisma.order.findFirst({
                    where: { id: orderId, companyId }
                });
                if (!order || !order.orderNumber) throw new Error('Sipariş verisi eksik');

                console.log(`${ctx} Sipariş bulundu (${order.orderNumber}), Trendyol Finans API'lerinden mutabakat çekiliyor...`);

                // 1. Fetch Sales (Commission/Revenue) & Deductions (Cargo/Penalty)
                const [settlements, deductions] = await Promise.all([
                    (service as any).getOrderSettlements(order.orderNumber),
                    (service as any).getOrderDeductions(order.orderNumber)
                ]);

                if (settlements.length === 0 && deductions.length === 0) {
                    throw new Error("Pazaryeri API'si bu sipariş için henüz komisyon/kesinti (mutabakat) belgesi oluşturmamış. İlerleyen günlerde tekrar deneyin.");
                }

                let newLedgerCount = 0;
                let netRevenue = 0;
                let totalCommission = 0;
                let totalCargo = 0;
                let totalOther = 0;

                const { Prisma } = require('@prisma/client');

                // İşlenmemiş satırları tekil olarak ledger'a işleyen ana fonksiyon
                const processRow = async (row: any, tType: string, isCargo: boolean = false) => {
                    const extRef = row.id?.toString() || row.transactionId?.toString() || `UNKNOWN_${Math.random()}`;
                    if (extRef.startsWith('UNKNOWN')) return; // Güvenlik, idsiz kayıt atlama.

                    const existing = await prisma.marketplaceTransactionLedger.findUnique({ where: { externalReference: extRef } });
                    if (existing) return; // Zaten işlenmiş!

                    let amount = parseFloat(row.amount || row.commissionAmount || row.totalPrice || 0);
                    if (isNaN(amount)) amount = 0;

                    const isCommission = row.transactionType === 'Commission' || row.paymentType === 'Commission' || row.deductionType === 'Commission';
                    const isPenalty = row.transactionType === 'Penalty' || row.transactionType === 'Deduction' || row.deductionType === 'Discount';

                    if (tType === 'Sale') netRevenue += parseFloat(row.sellerRevenue || row.totalPrice || 0);
                    if (isCommission) totalCommission += Math.abs(amount);
                    if (isCargo) totalCargo += Math.abs(amount);
                    if (!isCommission && !isCargo && isPenalty) totalOther += Math.abs(amount);

                    await prisma.marketplaceTransactionLedger.create({
                        data: {
                            companyId,
                            marketplace,
                            externalReference: extRef,
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            transactionType: isCargo ? 'CARGO' : isCommission ? 'COMMISSION' : isPenalty ? 'DEDUCTION' : 'SALE',
                            amount: new Prisma.Decimal(amount),
                            transactionDate: row.transactionDate ? new Date(row.transactionDate) : new Date(),
                            processingStatus: 'PROCESSED'
                        }
                    });
                    newLedgerCount++;
                };

                for (const s of settlements) await processRow(s, 'Sale');
                for (const d of deductions) {
                    const isCg = d.deductionType?.toLowerCase().includes('cargo') || d.deductionType?.toLowerCase().includes('shipping');
                    await processRow(d, 'Deduction', !!isCg);
                }

                // 2. Ürün PNL (Kârlılık) Tablosunu Gerçek Verilerle Güncelle!
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items as any[]);
                if (items && items.length > 0 && newLedgerCount > 0) {
                    const mainItem = items[0];
                    const barcode = mainItem.sku;
                    
                    const maps = await prisma.marketplaceProductMap.findMany({
                        where: { companyId, marketplace, marketplaceCode: String(barcode) },
                        include: { product: true }
                    });
                    
                    if (maps.length > 0) {
                        const pMap = maps[0];
                        const fifoCost = Number(pMap.product.buyPrice) || 0;
                        const quantity = Number(mainItem.quantity) || 1;
                        const totalCost = fifoCost * quantity;

                        const expectedProfit = netRevenue - totalCommission - totalCargo - totalOther - totalCost;

                        const incrementData = {
                            grossRevenue: { increment: netRevenue },
                            commissionTotal: { increment: totalCommission },
                            shippingTotal: { increment: totalCargo },
                            otherFeesTotal: { increment: totalOther },
                            fifoCostTotal: { increment: totalCost },
                            netProfit: { increment: expectedProfit },
                            saleCount: { increment: quantity }
                        };

                        await prisma.marketplaceProductPnl.upsert({
                            where: { companyId_productId_marketplace: { companyId, productId: pMap.productId, marketplace } },
                            update: incrementData,
                            create: {
                                companyId,
                                marketplace,
                                productId: pMap.productId,
                                grossRevenue: netRevenue,
                                commissionTotal: totalCommission,
                                shippingTotal: totalCargo,
                                otherFeesTotal: totalOther,
                                fifoCostTotal: totalCost,
                                netProfit: expectedProfit,
                                saleCount: quantity,
                                refundCount: 0,
                                refundedQuantity: 0,
                                profitMargin: 0
                            }
                        });

                        // Marjı tekrar hesapla (% format)
                        const updatedPnl = await prisma.marketplaceProductPnl.findUnique({
                            where: { companyId_productId_marketplace: { companyId, productId: pMap.productId, marketplace } }
                        });
                        
                        if (updatedPnl && Number(updatedPnl.grossRevenue) > 0) {
                            let margin = (Number(updatedPnl.netProfit) / Number(updatedPnl.grossRevenue)) * 100;
                            await prisma.marketplaceProductPnl.update({
                                where: { id: updatedPnl.id },
                                data: { profitMargin: new Prisma.Decimal(margin.toFixed(2)) }
                            });
                        }
                    }
                }

                result = { syncedLedgers: newLedgerCount, totals: { netRevenue, totalCommission, totalCargo, totalOther } };
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

            return { status: "FAILED", errorMessage: error.message, errorCode: MarketplaceActionErrorCode.E_UNKNOWN, auditId };

        } finally {
            if (redisConnection) await redisConnection.del(lockKey);
        }
    }
}
