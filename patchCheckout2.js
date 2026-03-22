const fs = require('fs');

function patch() {
    let f = fs.readFileSync('src/app/api/network/checkout/route.ts', 'utf8');

    // 1. Add usePoints
    if (!f.includes('const usePoints = body.usePoints === true;')) {
        f = f.replace('const paymentMode = body.paymentMode === "ON_ACCOUNT" ? "ON_ACCOUNT" : "CARD"', 'const paymentMode = body.paymentMode === "ON_ACCOUNT" ? "ON_ACCOUNT" : "CARD"\n        const usePoints = body.usePoints === true;');
    }

    // 2. Add availablePoints and crmCustomer logic
    const memStr = `            if (!membership || membership.status !== "ACTIVE") throw new HttpErr(403, "INVALID_MEMBERSHIP")`;
    const newMemStr = `            if (!membership || membership.status !== "ACTIVE") throw new HttpErr(403, "INVALID_MEMBERSHIP")

            let availablePoints = 0;
            let crmCustomer = null;
            if (membership?.dealerUser?.email) {
                crmCustomer = await tx.customer.findFirst({
                    where: { email: membership.dealerUser.email, company: { tenantId: ctx.supplierTenantId }, deletedAt: null },
                    select: { id: true, points: true }
                });
            }
            if (!crmCustomer && membership?.dealerCompany?.taxNumber) {
                crmCustomer = await tx.customer.findFirst({
                    where: { taxNumber: membership.dealerCompany.taxNumber, company: { tenantId: ctx.supplierTenantId }, deletedAt: null },
                    select: { id: true, points: true }
                });
            }
            if (crmCustomer) {
                availablePoints = Number(crmCustomer.points || 0);
            }`;
    if (!f.includes('let availablePoints = 0;')) {
        f = f.replace(memStr, newMemStr);
        // Add company selects if missing
        f = f.replace('dealerCompany: { select: { companyName: true } },', 'dealerCompany: { select: { companyName: true, taxNumber: true } },');
        f = f.replace('dealerUser: { select: { email: true, phone: true } },', 'dealerUser: { select: { email: true, phone: true } },');
    }

    // 3. campaignDiscount logic
    const oldCamp = `                if (appliedCampaign) {
                    const bq = Number(appliedCampaign.conditions.buyQuantity || 1);
                    const rq = Number(appliedCampaign.conditions.rewardQuantity || 1);
                    const bundleSize = bq; // X AL
                    const freeCount = Math.floor(ci.quantity / bundleSize) * rq;
                    if (freeCount > 0) {
                        campaignDiscount = freeCount * effectivePrice;
                        lineDiscount += campaignDiscount;
                    }
                }`;
    const newCamp = `                if (appliedCampaign) {
                    const cType = appliedCampaign.campaignType || appliedCampaign.type;
                    if (cType === "BUY_X_GET_Y") {
                        const bq = Number(appliedCampaign.conditions.buyQuantity || 1);
                        const rq = Number(appliedCampaign.conditions.rewardQuantity || 1);
                        const bundleSize = bq; // X AL
                        const freeCount = Math.floor(ci.quantity / bundleSize) * rq;
                        if (freeCount > 0) {
                            campaignDiscount = freeCount * effectivePrice;
                            lineDiscount += campaignDiscount;
                        }
                    } else if (cType === "PERCENT_DISCOUNT" && appliedCampaign.discountRate) {
                        campaignDiscount = (Number(appliedCampaign.discountRate) / 100) * lineTotal;
                        lineDiscount += campaignDiscount;
                    } else if (cType === "FIXED_DISCOUNT" && appliedCampaign.discountRate) {
                        campaignDiscount = Math.min(lineTotal, Number(appliedCampaign.discountRate) * ci.quantity);
                        lineDiscount += campaignDiscount;
                    } else if (cType === "LOYALTY_POINTS" && appliedCampaign.discountRate) {
                        const pts = (Number(appliedCampaign.discountRate) / 100) * lineTotal;
                        earnablePoints += pts;
                    }
                }`;
    
    // Add earnablePoints var and replace campaign
    f = f.replace('let grandTotal = 0\n            const snapshotItems: any[] = []', 'let grandTotal = 0\n            let earnablePoints = 0\n            const snapshotItems: any[] = []');
    f = f.replace('let grandTotal = 0\r\n            const snapshotItems: any[] = []', 'let grandTotal = 0\n            let earnablePoints = 0\n            const snapshotItems: any[] = []');
    f = f.replace(oldCamp, newCamp);

    // 4. Points used amount and projectedExposure
    const expStr = `            const { creditLimit, exposureBase } = await computeExposureBase(ctx)\n            const projectedExposure = exposureBase + grandTotal`;
    const expStr2 = `            const { creditLimit, exposureBase } = await computeExposureBase(ctx)\r\n            const projectedExposure = exposureBase + grandTotal`;
    const newExp = `            const { creditLimit, exposureBase } = await computeExposureBase(ctx)
            
            let pointsUsedAmount = 0;
            if (usePoints && availablePoints > 0) {
                pointsUsedAmount = Math.min(grandTotal, availablePoints);
                if (pointsUsedAmount > 0) {
                    grandTotal -= pointsUsedAmount;
                    snapshotItems.push({
                        id: "pts-" + Date.now(),
                        productId: "parapuan_usage",
                        name: "Parapuan Kullanımı",
                        code: "P-IND-01",
                        barcode: "P-IND",
                        quantity: 1,
                        unit: "ADET",
                        unitPrice: -pointsUsedAmount,
                        listPrice: -pointsUsedAmount,
                        discountPct: 0,
                        lineTotal: -pointsUsedAmount,
                    })
                }
            }
            
            const projectedExposure = exposureBase + grandTotal`;
    if (f.includes(expStr)) f = f.replace(expStr, newExp);
    else if (f.includes(expStr2)) f = f.replace(expStr2, newExp);

    // 5. Update Points
    const logStr = `                source: "B2B_CART",\n            })`;
    const logStr2 = `                source: "B2B_CART",\r\n            })`;
    const newLog = `                source: "B2B_CART",
            })

            // Update customer points
            if (usePoints && pointsUsedAmount > 0 && crmCustomer) {
                await tx.customer.update({
                    where: { id: crmCustomer.id },
                    data: { points: { decrement: pointsUsedAmount } }
                })
            }
            if (earnablePoints > 0 && crmCustomer) {
                await tx.customer.update({
                    where: { id: crmCustomer.id },
                    data: { points: { increment: Math.floor(earnablePoints) } }
                })
            }`;
    if (f.includes(logStr)) f = f.replace(logStr, newLog);
    else if (f.includes(logStr2)) f = f.replace(logStr2, newLog);

    fs.writeFileSync('src/app/api/network/checkout/route.ts', f);
    console.log("Patched checkout securely");
}

patch();
