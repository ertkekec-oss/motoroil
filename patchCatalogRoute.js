const fs = require('fs');

function patch() {
    let f = fs.readFileSync('src/app/api/network/catalog/[id]/route.ts', 'utf8');

    const oldFind = `const campaigns = await prisma.campaign.findMany({ where: { tenantId: membership.tenantId, isActive: true, deletedAt: null, campaignType: "BUY_X_GET_Y" } });`;
    const newFind = `const allCampaigns = await prisma.campaign.findMany({ where: { tenantId: membership.tenantId, isActive: true, deletedAt: null } });
        const campaigns = allCampaigns.filter(c => !c.channels || c.channels.length === 0 || c.channels.includes("B2B") || c.channels.includes("GLOBAL"));`;

    f = f.replace(oldFind, newFind);

    const oldReturn = `campaign: appliedCampaign ? { name: appliedCampaign.name, buyQuantity: appliedCampaign.conditions.buyQuantity, rewardQuantity: appliedCampaign.conditions.rewardQuantity } : null`;
    const newReturn = `campaign: appliedCampaign ? { name: appliedCampaign.name, type: appliedCampaign.campaignType || appliedCampaign.type, buyQuantity: appliedCampaign.conditions.buyQuantity, rewardQuantity: appliedCampaign.conditions.rewardQuantity, discountRate: appliedCampaign.discountRate } : null`;

    f = f.replace(oldReturn, newReturn);
    
    fs.writeFileSync('src/app/api/network/catalog/[id]/route.ts', f);
    console.log("Patched catalog UI route");
}

patch();
