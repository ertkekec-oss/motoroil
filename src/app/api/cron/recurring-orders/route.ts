import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { resolveContractPrice } from '@/lib/pricingResolver';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();

        // Find all active recurring orders whose nextRunAt is in the past or null
        const recurringOrders = await prisma.recurringOrder.findMany({
            where: {
                active: true,
                contract: { status: 'ACTIVE' },
                OR: [
                    { nextRunAt: null },
                    { nextRunAt: { lte: now } }
                ]
            },
            include: {
                contract: {
                    include: {
                        items: true
                    }
                }
            }
        });

        const processed = [];

        for (const ro of recurringOrders) {
            const { contract } = ro;
            if (!contract || contract.items.length === 0) continue;

            const buyerCompanyId = contract.buyerCompanyId;
            const sellerId = contract.sellerCompanyId;

            try {
                // Execute generation
                await prisma.$transaction(async (tx) => {
                    const orderItems: any[] = [];
                    let subtotalAmount = 0;

                    for (const item of contract.items) {
                        const listing = await tx.networkListing.findFirst({
                            where: {
                                sellerCompanyId: sellerId,
                                globalProductId: item.productId,
                                status: "ACTIVE"
                            },
                            include: { globalProduct: true }
                        });

                        if (!listing || listing.availableQty < item.minOrderQty) {
                            throw new Error(`Insufficient stock or inactive catalog for product ${item.productId}`);
                        }

                        // Get active contract pricing using tx
                        const resolved = await resolveContractPrice(buyerCompanyId, sellerId, item.productId, item.minOrderQty, tx);
                        const itemTotal = resolved.unitPrice * item.minOrderQty;
                        subtotalAmount += itemTotal;

                        orderItems.push({
                            globalProductId: item.productId,
                            erpProductId: listing.erpProductId,
                            name: listing.globalProduct?.name || "Unknown Product",
                            price: resolved.unitPrice,
                            qty: item.minOrderQty,
                            total: itemTotal,
                            isContractPriced: true
                        });

                        // Standard stock deduction
                        await tx.networkListing.update({
                            where: { id: listing.id },
                            data: { availableQty: { decrement: item.minOrderQty } }
                        });
                    }

                    const commissionAmount = subtotalAmount * 0.05; // 5% mock commission
                    const shippingAmount = 0;
                    const escrowFee = subtotalAmount * 0.01; // 1% escrow fee
                    const totalAmount = subtotalAmount + shippingAmount + escrowFee;

                    const itemsHash = crypto.createHash("sha256").update(JSON.stringify(orderItems) + ro.id + now.toISOString()).digest("hex");

                    const networkOrder = await tx.networkOrder.create({
                        data: {
                            buyerCompanyId,
                            sellerCompanyId: sellerId,
                            subtotalAmount,
                            shippingAmount,
                            commissionAmount,
                            totalAmount,
                            currency: "TRY",
                            status: "INIT",
                            itemsHash,
                            items: orderItems,
                            sourceType: 'CONTRACT' as any,
                            sourceId: contract.id,
                        }
                    });

                    // Init Payment Escrow
                    await tx.networkPayment.create({
                        data: {
                            networkOrderId: networkOrder.id,
                            provider: "MOCK",
                            mode: contract.paymentMode, // Use contract paymentMode directly !! Wait, mode is type PaymentMode!
                            status: "INITIATED",
                            amount: totalAmount,
                            currency: "TRY",
                            attemptKey: `rec_${ro.id}_${Date.now()}`,
                        }
                    });

                    // Shipment
                    await tx.shipment.create({
                        data: {
                            networkOrderId: networkOrder.id,
                            mode: "MANUAL",
                            status: "CREATED",
                            carrierCode: "UNASSIGNED",
                            sequence: 1,
                            items: orderItems
                        }
                    });

                    // Update nextRunAt
                    const nextRun = new Date(now);
                    if (ro.frequency === 'WEEKLY') {
                        nextRun.setDate(nextRun.getDate() + 7);
                    } else if (ro.frequency === 'MONTHLY') {
                        nextRun.setMonth(nextRun.getMonth() + 1);
                    }

                    await tx.recurringOrder.update({
                        where: { id: ro.id },
                        data: { nextRunAt: nextRun }
                    });
                });

                processed.push({ id: ro.id, success: true });
            } catch (err: any) {
                console.error(`Failed recurring order ${ro.id}:`, err);
                processed.push({ id: ro.id, success: false, error: err.message });
            }
        }

        return NextResponse.json({ ok: true, processed, total: recurringOrders.length });
    } catch (e: any) {
        console.error('Recurring Orders Cron Error:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
