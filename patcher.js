const fs = require('fs');

function patchCart() {
    let f = fs.readFileSync('src/app/api/network/cart/route.ts', 'utf8');

    // Add earnablePoints
    f = f.replace('let totalDiscount = 0\n        let grandTotal = 0', 'let totalDiscount = 0\n        let grandTotal = 0\n        let earnablePoints = 0');
    f = f.replace('let totalDiscount = 0\r\n        let grandTotal = 0', 'let totalDiscount = 0\n        let grandTotal = 0\n        let earnablePoints = 0');
    
    const oldCampaign = `            if (appliedCampaign) {
                const bq = Number(appliedCampaign.conditions.buyQuantity || 1);
                const rq = Number(appliedCampaign.conditions.rewardQuantity || 1);
                const bundleSize = bq; // X AL
                const freeCount = Math.floor(item.quantity / bundleSize) * rq;
                if (freeCount > 0) {
                    campaignDiscount = freeCount * effectivePrice;
                    lineDiscount += campaignDiscount;
                    campaignMessage = \`\${bundleSize} Aldınız \${bundleSize - rq} Ödeyeceksiniz! \${freeCount} Adet Ürün Bedelsiz!\`;
                }
            }`;

    const newCampaign = `            if (appliedCampaign) {
                const cType = appliedCampaign.campaignType || appliedCampaign.type;
                if (cType === "BUY_X_GET_Y") {
                    const bq = Number(appliedCampaign.conditions.buyQuantity || 1);
                    const rq = Number(appliedCampaign.conditions.rewardQuantity || 1);
                    const bundleSize = bq; // X AL
                    const freeCount = Math.floor(item.quantity / bundleSize) * rq;
                    if (freeCount > 0) {
                        campaignDiscount = freeCount * effectivePrice;
                        lineDiscount += campaignDiscount;
                        campaignMessage = \`\${bundleSize} Aldınız \${bundleSize - rq} Ödeyeceksiniz! \${freeCount} Adet Bedelsiz!\`;
                    }
                } else if (cType === "PERCENT_DISCOUNT" && appliedCampaign.discountRate) {
                    campaignDiscount = (Number(appliedCampaign.discountRate) / 100) * lineEffectiveTotal;
                    lineDiscount += campaignDiscount;
                    campaignMessage = \`Kampanya: %\${appliedCampaign.discountRate} İndirim!\`;
                } else if (cType === "FIXED_DISCOUNT" && appliedCampaign.discountRate) {
                    const maxD = Math.min(lineEffectiveTotal, Number(appliedCampaign.discountRate) * item.quantity);
                    campaignDiscount = maxD;
                    lineDiscount += campaignDiscount;
                    campaignMessage = \`Kampanya: Adet Başına \${appliedCampaign.discountRate} TL İndirim!\`;
                } else if (cType === "LOYALTY_POINTS" && appliedCampaign.discountRate) {
                    const pts = (Number(appliedCampaign.discountRate) / 100) * lineEffectiveTotal;
                    earnablePoints += pts;
                    campaignMessage = \`Kampanya: +\${pts.toFixed(0)} Parapuan Fırsatı\`;
                }
            }`;

    f = f.replace(oldCampaign, newCampaign);

    f = f.replace('freeShippingThreshold\n                },', 'freeShippingThreshold,\n                    earnablePoints\n                },');
    f = f.replace('freeShippingThreshold\r\n                },', 'freeShippingThreshold,\n                    earnablePoints\n                },');

    fs.writeFileSync('src/app/api/network/cart/route.ts', f);
    console.log("Patched cart");
}

function patchCheckout() {
    let f = fs.readFileSync('src/app/api/network/checkout/route.ts', 'utf8');

    // Add earnablePoints
    f = f.replace('let grandTotal = 0\n            const snapshotItems: any[] = []', 'let grandTotal = 0\n            let earnablePoints = 0\n            const snapshotItems: any[] = []');
    f = f.replace('let grandTotal = 0\r\n            const snapshotItems: any[] = []', 'let grandTotal = 0\n            let earnablePoints = 0\n            const snapshotItems: any[] = []');
    
    const oldCampaign = `                if (appliedCampaign) {
                    const bq = Number(appliedCampaign.conditions.buyQuantity || 1);
                    const rq = Number(appliedCampaign.conditions.rewardQuantity || 1);
                    const bundleSize = bq; // X AL
                    const freeCount = Math.floor(ci.quantity / bundleSize) * rq;
                    if (freeCount > 0) {
                        campaignDiscount = freeCount * effectivePrice;
                        lineDiscount += campaignDiscount;
                    }
                }`;

    const newCampaign = `                if (appliedCampaign) {
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
                        campaignDiscount = (Number(appliedCampaign.discountRate) / 100) * lineEffectiveTotal;
                        lineDiscount += campaignDiscount;
                    } else if (cType === "FIXED_DISCOUNT" && appliedCampaign.discountRate) {
                        campaignDiscount = Math.min(lineEffectiveTotal, Number(appliedCampaign.discountRate) * ci.quantity);
                        lineDiscount += campaignDiscount;
                    } else if (cType === "LOYALTY_POINTS" && appliedCampaign.discountRate) {
                        const pts = (Number(appliedCampaign.discountRate) / 100) * lineEffectiveTotal;
                        earnablePoints += pts;
                    }
                }`;

    f = f.replace(oldCampaign, newCampaign);

    const pointUpdateTarget = `                if (usePoints && pointsUsedAmount > 0) {
                    await tx.customer.update({
                        where: { id: foundCustomer.id },
                        data: { points: { decrement: pointsUsedAmount } }
                    })
                }`;
    
    const pointUpdateNew = `                if (usePoints && pointsUsedAmount > 0) {
                    await tx.customer.update({
                        where: { id: foundCustomer.id },
                        data: { points: { decrement: pointsUsedAmount } }
                    })
                }
                if (earnablePoints > 0 && foundCustomer) {
                    await tx.customer.update({
                        where: { id: foundCustomer.id },
                        data: { points: { increment: Math.floor(earnablePoints) } }
                    })
                }`;

    if (f.includes(pointUpdateTarget)) {
        f = f.replace(pointUpdateTarget, pointUpdateNew);
    } else {
        console.error("Could not find point update target in checkout");
    }

    fs.writeFileSync('src/app/api/network/checkout/route.ts', f);
    console.log("Patched checkout");
}

patchCart();
patchCheckout();
