
import { prisma } from "@/lib/prisma";
import { SuggestionType, SuggestionStatus, ProductStatus, Visibility, ActorType, CommerceAction } from "@prisma/client";
import { calculateAvailableInventory } from "@/lib/inventory";
import { applySuggestion } from "@/services/network/suggestionService";
import crypto from 'crypto';

function deterministicBucket(id: string): number {
    const hash = crypto.createHash('sha256').update(id).digest('hex');
    return parseInt(hash.substring(0, 8), 16) % 100;
}

export interface SuggestionEngineOptions {
    companyId: string;
    dryRun?: boolean;
}

// 1. GLOBAL KILL SWITCH
const GLOBAL_AUTOMATION_ENABLED = process.env.ENABLE_GLOBAL_AUTOMATION !== "false";

export async function runSuggestionEngine({ companyId, dryRun = false }: SuggestionEngineOptions) {
    console.log(`[SuggestionEngine] Running for company ${companyId}...`);

    if (!GLOBAL_AUTOMATION_ENABLED) {
        console.log(`[SuggestionEngine] Global automation disabled via kill switch.`);
        return { success: false, message: "Global automation disabled" };
    }

    let policy = await prisma.sellerAutomationPolicy.findUnique({
        where: { sellerCompanyId: companyId }
    });

    if (!policy) {
        // Create default policy if missing
        policy = await prisma.sellerAutomationPolicy.create({
            data: {
                sellerCompanyId: companyId,
                minOnHandThreshold: 100,
                lowSalesThreshold: 3,
                maxReservedRatio: 0.2,
            }
        });
    }

    if (!policy.autoPublishEnabled) {
        console.log(`[SuggestionEngine] Automation disabled for seller ${companyId}. Returning early.`);
        // We still generate suggestions, just DONT auto-publish. Wait, the prompt says "Worker başlamadan önce: if (!seller.autoPublishEnabled) return;". It means NO SUGGESTIONS either? "Amaç: otomasyonun asla yanlış çalışmaması. Eklenmesi gerekenler: Kill Switch ... Worker başlamadan önce: if (!globalAutomationEnabled) return; if (!seller.autoPublishEnabled) return;". Ok, I will return entirely.
        return { success: false, message: "Seller automation disabled" };
    }

    // 3. CIRCUIT BREAKER
    const tenMinsAgo = new Date();
    tenMinsAgo.setMinutes(tenMinsAgo.getMinutes() - 10);

    const errorCount = await prisma.commerceAuditLog.count({
        where: {
            sellerCompanyId: companyId,
            action: CommerceAction.AUTO_PUBLISH_ERROR as any, // We will add to enum, or use a workaround for now
            createdAt: { gte: tenMinsAgo }
        }
    });

    if (errorCount >= 5) {
        console.warn(`[CIRCUIT BREAKER] 5+ errors in last 10 mins for ${companyId}. Pausing automation automatically.`);

        // Auto pause their automation
        await prisma.sellerAutomationPolicy.update({
            where: { sellerCompanyId: companyId },
            data: { autoPublishEnabled: false }
        });

        // Audit the circuit breaker trip
        await prisma.commerceAuditLog.create({
            data: {
                sellerCompanyId: companyId,
                actorType: ActorType.SYSTEM,
                action: CommerceAction.POLICY_UPDATE,
                entityType: "SellerAutomationPolicy",
                entityId: policy.id,
                payloadJson: { reason: "CIRCUIT_BREAKER_TRIPPED", autoPublishEnabled: false }
            }
        });

        return { success: false, message: "Circuit breaker tripped" };
    }

    // 2. Load Products and their active listings for this company
    const products = await prisma.product.findMany({
        where: { companyId },
        include: {
            networkListings: {
                where: { sellerCompanyId: companyId }
            },
            productPrices: {
                include: { priceList: true }
            }
        }
    });

    // Calculate 30d sales velocity for all products in one go (optional optimization)
    // For simplicity, we'll do it per product in this MVP.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const suggestions: any[] = [];

    for (const product of products) {
        const listing = product.networkListings[0]; // One ERP product = One Listing (unique constraint)
        const available = await calculateAvailableInventory(product.id, product.branch || "Merkez");

        // Check Guardrail: HIGH_RESERVED_BLOCK
        const onHand = product.stock || 0;
        const reserved = Math.max(0, onHand - available);
        if (onHand > 0 && (reserved / onHand) > policy.maxReservedRatio) {
            // Log skip but maybe no suggestion needed if it's already blocked
            continue;
        }

        // Derive 30d sales
        const sales30d = await prisma.salesOrderItem.aggregate({
            _sum: { quantity: true },
            where: {
                productId: product.id,
                order: {
                    createdAt: { gte: thirtyDaysAgo },
                    companyId: companyId
                }
            }
        }).then(res => Number(res._sum.quantity || 0));

        // Check if there is an active price
        const hasActivePrice = product.productPrices.some(pp => pp.priceList.isActive);
        const currentPrice = hasActivePrice ? product.productPrices.find(pp => pp.priceList.isActive)!.price : 0;

        const todayStr = new Date().toISOString().split('T')[0];

        // RULE 1: OVERSTOCK_SLOW -> LIST or INCREASE_VISIBILITY
        if (
            available >= policy.minOnHandThreshold &&
            sales30d <= policy.lowSalesThreshold
        ) {
            if (!listing || listing.status === "PAUSED") {
                // Not listed yet
                const suggestedPrice = currentPrice > 0 ? (Number(currentPrice) * 0.95).toFixed(2) : null;

                suggestions.push({
                    productId: product.id,
                    suggestionType: hasActivePrice ? SuggestionType.LIST : SuggestionType.SET_PRICE,
                    score: calculateOverstockScore(available, sales30d, policy.minOnHandThreshold),
                    reasonsJson: {
                        rule: "OVERSTOCK_SLOW",
                        available,
                        sales30d,
                        minOnHandThreshold: policy.minOnHandThreshold,
                        lowSalesThreshold: policy.lowSalesThreshold,
                        suggestedPrice: suggestedPrice,
                        message: hasActivePrice
                            ? `Stok yüksek (${available}), son 30 gün satış düşük (${sales30d}). %5 indirimle ($${suggestedPrice}) B2B'de yayınlamayı öneriyoruz.`
                            : `Stok yüksek (${available}), ancak aktif fiyat tanımlı değil. Fiyat belirleyip yayınlayın.`
                    },
                    dedupeKey: `${companyId}:${product.id}:OVERSTOCK_SLOW:${todayStr}`,
                    _context: {
                        priceCheck: hasActivePrice,
                        inventoryCheck: available >= (listing?.minQty || policy.defaultMinOrderQty || 1),
                        approvalCheck: product.status === "ACTIVE",
                        reservedRatioCheck: onHand > 0 ? ((Math.max(0, onHand - available)) / onHand < policy.maxReservedRatio) : true
                    }
                });
            } else if (listing && listing.status === "ACTIVE") {
                // Already listed, let's suggest a boost or price adjustment
                const suggestedPrice = currentPrice > 0 ? (Number(currentPrice) * 0.95).toFixed(2) : null;

                suggestions.push({
                    productId: product.id,
                    suggestionType: SuggestionType.INCREASE_VISIBILITY, // or ADJUST_PRICE
                    score: calculateOverstockScore(available, sales30d, policy.minOnHandThreshold),
                    reasonsJson: {
                        rule: "OVERSTOCK_SLOW_ACTIVE",
                        available,
                        sales30d,
                        suggestedPrice: suggestedPrice,
                        message: `Stok yüksek (${available}) ve ilanınız aktif olmasına rağmen satış yavaş. Görünürlüğünüzü artırabilir veya %5 indirim uygulayabilirsiniz.`
                    },
                    dedupeKey: `${companyId}:${product.id}:OVERSTOCK_SLOW_ACTIVE:${todayStr}`,
                    _context: {
                        priceCheck: hasActivePrice,
                        inventoryCheck: available >= (listing?.minQty || policy.defaultMinOrderQty || 1),
                        approvalCheck: product.status === "ACTIVE",
                        reservedRatioCheck: onHand > 0 ? ((Math.max(0, onHand - available)) / onHand < policy.maxReservedRatio) : true
                    }
                });
            }
        }

        // RULE 2: LOW_STOCK -> PAUSE
        if (listing && listing.status === "ACTIVE") {
            const effectiveMinQty = listing.minQty || policy.defaultMinOrderQty || 1;
            if (available < effectiveMinQty) {
                suggestions.push({
                    productId: product.id,
                    suggestionType: SuggestionType.PAUSE,
                    score: 90, // High priority
                    reasonsJson: {
                        rule: "LOW_STOCK",
                        available,
                        minQty: effectiveMinQty,
                        message: `Mevcut stok (${available}) minimum sipariş miktarının (${effectiveMinQty}) altında. Yayını duraklatmayı öneriyoruz.`
                    },
                    dedupeKey: `${companyId}:${product.id}:LOW_STOCK:${todayStr}`,
                    _context: {
                        priceCheck: hasActivePrice,
                        inventoryCheck: available >= (listing?.minQty || policy.defaultMinOrderQty || 1),
                        approvalCheck: product.status === "ACTIVE",
                        reservedRatioCheck: onHand > 0 ? ((Math.max(0, onHand - available)) / onHand < policy.maxReservedRatio) : true
                    }
                });
            }
        }

        // RULE 3: MISSING_LISTING_FIELDS -> FIX_LISTING
        if (listing && (!listing.minQty || !listing.leadTimeDays)) {
            const missing = [];
            if (!listing.minQty) missing.push("minQty");
            if (!listing.leadTimeDays) missing.push("leadTimeDays");

            suggestions.push({
                productId: product.id,
                suggestionType: SuggestionType.FIX_LISTING,
                score: 50,
                reasonsJson: {
                    rule: "MISSING_LISTING_FIELDS",
                    missing,
                    message: `İlan detaylarında eksik alanlar var: ${missing.join(", ")}. Tamamlamanız önerilir.`
                },
                dedupeKey: `${companyId}:${product.id}:FIX_LISTING:${todayStr}`,
                _context: {
                    priceCheck: hasActivePrice,
                    inventoryCheck: available >= (listing?.minQty || policy.defaultMinOrderQty || 1),
                    approvalCheck: product.status === "ACTIVE",
                    reservedRatioCheck: onHand > 0 ? ((Math.max(0, onHand - available)) / onHand < policy.maxReservedRatio) : true
                }
            });
        }

        // RULE 4: PRICE_MISSING -> SET_PRICE (if not already handled by Rule 1)
        if (listing && listing.status === "ACTIVE" && !hasActivePrice) {
            suggestions.push({
                productId: product.id,
                suggestionType: SuggestionType.SET_PRICE,
                score: 95,
                reasonsJson: {
                    rule: "PRICE_MISSING",
                    message: "İlan aktif ancak geçerli bir fiyat tanımlı değil. Alıcılar ürünü göremeyecektir."
                },
                dedupeKey: `${companyId}:${product.id}:PRICE_MISSING:${todayStr}`,
                _context: {
                    priceCheck: hasActivePrice,
                    inventoryCheck: available >= (listing?.minQty || policy.defaultMinOrderQty || 1),
                    approvalCheck: product.status === "ACTIVE",
                    reservedRatioCheck: onHand > 0 ? ((Math.max(0, onHand - available)) / onHand < policy.maxReservedRatio) : true
                }
            });
        }
    }

    // 3. Upsert and Auto-Apply Suggestion
    let count = 0;
    let autoAppliedCount = 0;

    for (const sug of suggestions) {
        // Check if there is a non-expired dismissal
        const existing = await prisma.b2BSuggestion.findUnique({
            where: { dedupeKey: sug.dedupeKey }
        });

        if (existing && existing.status !== SuggestionStatus.OPEN) {
            // Already handled
            if (existing.status === SuggestionStatus.DISMISSED && existing.dismissedUntil && existing.dismissedUntil > new Date()) {
                continue;
            }
            continue;
        }

        const upserted = await prisma.b2BSuggestion.upsert({
            where: { dedupeKey: sug.dedupeKey },
            create: {
                sellerCompanyId: companyId,
                productId: sug.productId,
                suggestionType: sug.suggestionType,
                score: sug.score,
                reasonsJson: sug.reasonsJson,
                dedupeKey: sug.dedupeKey,
                status: SuggestionStatus.OPEN
            },
            update: {
                score: sug.score,
                reasonsJson: sug.reasonsJson,
                updatedAt: new Date()
            }
        });

        count++;

        // Decision Log & Guardrails
        const bucket = deterministicBucket(sug.productId);
        const rolloutCheck = bucket < policy.rolloutPercent;

        const priceCheck = sug._context.priceCheck;
        const inventoryCheck = sug._context.inventoryCheck;
        const approvalCheck = sug._context.approvalCheck;
        const reservedRatioCheck = sug._context.reservedRatioCheck;

        const checksJson = {
            priceCheck,
            inventoryCheck,
            approvalCheck,
            rolloutCheck,
            reservedRatioCheck,
            bucket,
            rolloutPercent: policy.rolloutPercent
        };

        let decision = "SKIP_NOT_AUTO_CAPABLE";
        let shouldAutoApply = false;

        if (policy.autoPublishEnabled && [SuggestionType.LIST, SuggestionType.PAUSE].includes(sug.suggestionType)) {
            if (dryRun) {
                decision = "PREVIEW_ONLY";
                shouldAutoApply = true;
            } else if (priceCheck && inventoryCheck && approvalCheck && reservedRatioCheck && rolloutCheck) {
                decision = "AUTO_APPLY";
                shouldAutoApply = true;
            } else {
                decision = "SKIP_FAILED_CHECKS";
            }
        }

        await prisma.automationDecisionLog.create({
            data: {
                sellerCompanyId: companyId,
                variantId: sug.productId, // treating product as variant here for simplicity
                rule: sug.reasonsJson.rule || "UNKNOWN",
                checksJson,
                decision
            }
        });

        // 4. Auto-Apply if enabled
        if (shouldAutoApply) {
            if (dryRun) {
                await prisma.b2BSuggestion.update({
                    where: { id: upserted.id },
                    data: { status: SuggestionStatus.PREVIEW_ONLY }
                });
                await prisma.commerceAuditLog.create({
                    data: {
                        sellerCompanyId: companyId,
                        actorType: ActorType.SYSTEM,
                        action: CommerceAction.AUTO_PUBLISH,
                        entityType: "B2BSuggestion",
                        entityId: upserted.id,
                        payloadJson: { type: sug.suggestionType, productId: sug.productId, dryRun: true }
                    }
                });
                autoAppliedCount++;
            } else {
                try {
                    await applySuggestion(upserted.id, companyId, ActorType.SYSTEM);
                    autoAppliedCount++;
                } catch (err: any) {
                    console.error(`[SuggestionEngine] Auto-apply failed for ${upserted.id}:`, err?.message || err);

                    await prisma.commerceAuditLog.create({
                        data: {
                            sellerCompanyId: companyId,
                            actorType: ActorType.SYSTEM,
                            action: CommerceAction.AUTO_PUBLISH_ERROR,
                            entityType: "B2BSuggestion",
                            entityId: upserted.id,
                            payloadJson: { error: err?.message || err.toString() }
                        }
                    });
                }
            }
        }
    }

    console.log(`[SuggestionEngine] Finished. Upserted: ${count}, Auto-Applied/Preview: ${autoAppliedCount}`);
    return { success: true, count, autoAppliedCount };
}

function calculateOverstockScore(available: number, sales: number, threshold: number): number {
    // Simple heuristic: higher stock and lower sales = higher score
    const stockRatio = available / threshold;
    const salesInverse = 1 / (sales + 1);
    const score = Math.min(100, (stockRatio * 10) + (salesInverse * 50));
    return Math.round(score);
}
