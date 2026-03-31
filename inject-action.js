const fs = require('fs');

const path = 'src/services/marketplaces/actions/providers/trendyol-actions.ts';
let code = fs.readFileSync(path, 'utf8');

const injection = `
            } else if (actionKey === 'SYNC_SETTLEMENT') {
                const order = await prisma.order.findFirst({
                    where: { id: orderId, companyId }
                });
                if (!order || !order.orderNumber) throw new Error('Sipariş verisi eksik');

                console.log(\`\${ctx} Sipariş bulundu (\${order.orderNumber}), Trendyol Finans API'lerinden mutabakat çekiliyor...\`);

                // 1. Fetch Sales (Commission/Revenue) & Deductions (Cargo/Penalty)
                const [settlements, deductions] = await Promise.all([
                    (service as any).getOrderSettlements(order.orderNumber),
                    (service as any).getOrderDeductions(order.orderNumber)
                ]);

                let newLedgerCount = 0;
                let netRevenue = 0;
                let totalCommission = 0;
                let totalCargo = 0;
                let totalOther = 0;

                const { Prisma } = require('@prisma/client');

                // İşlenmemiş satırları tekil olarak ledger'a işleyen ana fonksiyon
                const processRow = async (row: any, tType: string, isCargo: boolean = false) => {
                    const extRef = row.id?.toString() || row.transactionId?.toString() || \`UNKNOWN_\${Math.random()}\`;
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
`;

code = code.replace("} else if (actionKey === 'CHANGE_CARGO') {", injection.trim() + "\n            } else if (actionKey === 'CHANGE_CARGO') {");

fs.writeFileSync(path, code);
