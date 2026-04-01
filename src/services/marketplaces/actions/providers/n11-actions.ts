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
        const acquired = redisConnection ? await redisConnection.set(lockKey, 'BUSY', 'EX', 60, 'NX') : true;

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
                    if (labelResult.fallbackData) {
                        const errMsg = labelResult.error;
                        await (prisma as any).marketplaceActionAudit.update({
                            where: { id: audit.id },
                            data: { status: 'FAILED', responsePayload: { fallbackData: labelResult.fallbackData }, errorMessage: errMsg }
                        });
                        metrics.externalCall(marketplace, actionKey, 'FAILED');
                        return { 
                            status: "FAILED", 
                            errorMessage: errMsg,
                            errorCode: MarketplaceActionErrorCode.E_REMOTE_API_ERROR,
                            auditId: audit.id,
                            result: { fallbackData: labelResult.fallbackData }
                        };
                    }
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
            } else if (actionKey === 'SYNC_SETTLEMENT') {
                const order = await prisma.order.findFirst({
                    where: { id: orderId, companyId }
                });
                if (!order || !order.orderNumber) throw new Error('Sipariş verisi eksik');

                console.log(`${ctx} Sipariş bulundu (${order.orderNumber}), N11 Finans/Mutabakat API çekiliyor...`);

                const [settlements, deductions] = await Promise.all([
                    (service as any).getOrderSettlements(order.orderNumber, Number(order.totalAmount) || 0),
                    (service as any).getOrderDeductions(order.orderNumber, Number(order.totalAmount) || 0)
                ]);

                let newLedgerCount = 0;
                let netRevenue = 0;
                let totalCommission = 0;
                let totalCargo = 0;
                let totalOther = 0;

                const { Prisma } = require('@prisma/client');

                const processRow = async (row: any, tType: string, isCargo: boolean = false) => {
                    const extRef = row.id?.toString() || row.transactionId?.toString() || row.receiptId?.toString() || `UNKNOWN_${Math.random()}`;
                    if (extRef.startsWith('UNKNOWN')) return;

                    const existing = await prisma.marketplaceTransactionLedger.findUnique({ where: { externalReference: extRef } });
                    if (existing) return;

                    let amount = parseFloat(row.amount || row.fee || row.commission || row.price || 0);
                    if (isNaN(amount)) amount = 0;

                    const isCommission = row.transactionType === 'Commission' || row.feeType === 'Commission' || row.type === 'COMMISSION';
                    const isPenalty = row.transactionType === 'Penalty' || row.transactionType === 'Deduction' || row.type === 'PENALTY';

                    if (tType === 'Sale') netRevenue += parseFloat(row.sellerRevenue || row.totalPrice || row.price || row.sellerAmount || 0);
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
                    const isCg = d.deductionType?.toLowerCase().includes('cargo') || d.feeType?.toLowerCase().includes('shipping') || d.type === 'CARGO';
                    await processRow(d, 'Deduction', !!isCg);
                }

                const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items as any[]);
                
                if (items && items.length > 0 && newLedgerCount > 0) {
                    const totalOrderValue = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity) || 0), 0);

                    for (const item of items) {
                        const barcode = item.sku || item.barcode;
                        const quantity = Number(item.quantity) || 1;
                        const itemValue = Number(item.price) * quantity;
                        
                        const weight = totalOrderValue > 0 ? (itemValue / totalOrderValue) : (1 / items.length);

                        const allocatedRevenue = netRevenue * weight;
                        const allocatedCommission = totalCommission * weight;
                        const allocatedCargo = totalCargo * weight;
                        const allocatedOther = totalOther * weight;

                        const maps = await prisma.marketplaceProductMap.findMany({
                            where: { companyId, marketplace, marketplaceCode: String(barcode) },
                            include: { product: true }
                        });
                        
                        if (maps.length > 0) {
                            const pMap = maps[0];
                            const currentCogs = Number(pMap.product.buyPrice) || 0;
                            const totalCost = currentCogs * quantity;
                            const expectedProfit = allocatedRevenue - allocatedCommission - allocatedCargo - allocatedOther - totalCost;

                            const incrementData = {
                                grossRevenue: { increment: allocatedRevenue },
                                commissionTotal: { increment: allocatedCommission },
                                shippingTotal: { increment: allocatedCargo },
                                otherFeesTotal: { increment: allocatedOther },
                                fifoCostTotal: { increment: totalCost },
                                netProfit: { increment: expectedProfit },
                                saleCount: { increment: quantity }
                            };

                            // V1: Eski PNL Tablosu (Legacy Uyum)
                            await prisma.marketplaceProductPnl.upsert({
                                where: { companyId_productId_marketplace: { companyId, productId: pMap.productId, marketplace } },
                                update: incrementData,
                                create: {
                                    companyId, marketplace, productId: pMap.productId,
                                    grossRevenue: allocatedRevenue, commissionTotal: allocatedCommission,
                                    shippingTotal: allocatedCargo, otherFeesTotal: allocatedOther,
                                    fifoCostTotal: totalCost, netProfit: expectedProfit,
                                    saleCount: quantity, refundCount: 0, refundedQuantity: 0, profitMargin: 0
                                }
                            });

                            // V2: Yeni Finansal Veri Ambarı Katmanı (Zaman Serisi Küpü)
                            const orderDate = order.orderDate ? new Date(order.orderDate) : new Date();
                            const dateOnly = new Date(Date.UTC(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()));

                            await prisma.marketplaceProductDailyPnl.upsert({
                                where: { companyId_productId_marketplace_date: { companyId, productId: pMap.productId, marketplace, date: dateOnly } },
                                update: {
                                    grossRevenue: { increment: allocatedRevenue },
                                    commissionTotal: { increment: allocatedCommission },
                                    shippingTotal: { increment: allocatedCargo },
                                    otherFeesTotal: { increment: allocatedOther },
                                    penaltyTotal: { increment: 0 }, 
                                    saleCount: { increment: quantity },
                                    cogsAtSale: { increment: totalCost }
                                },
                                create: {
                                    companyId, marketplace, productId: pMap.productId,  date: dateOnly,
                                    grossRevenue: allocatedRevenue, commissionTotal: allocatedCommission,
                                    shippingTotal: allocatedCargo, otherFeesTotal: allocatedOther,
                                    saleCount: quantity, cogsAtSale: totalCost
                                }
                            });
                        }
                    }
                }

                result = { syncedLedgers: newLedgerCount, totals: { netRevenue, totalCommission, totalCargo, totalOther } };
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
            if (redisConnection) await redisConnection.del(lockKey);
        }
    }
}
