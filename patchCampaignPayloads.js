const fs = require('fs');

function patch() {
    let f1 = fs.readFileSync('src/app/(app)/campaigns/create/page.tsx', 'utf8');
    f1 = f1.replace('discountRate: formData.campaignType === "LOYALTY_POINTS" ? null : Number(formData.discountRate),', 'discountRate: Number(formData.discountRate),');
    fs.writeFileSync('src/app/(app)/campaigns/create/page.tsx', f1);

    let f2 = fs.readFileSync('src/app/(app)/campaigns/edit/[id]/page.tsx', 'utf8');
    f2 = f2.replace('discountRate: formData.campaignType === "LOYALTY_POINTS" ? null : Number(formData.discountRate),', 'discountRate: Number(formData.discountRate),');
    fs.writeFileSync('src/app/(app)/campaigns/edit/[id]/page.tsx', f2);
    
    console.log("Patched both edit and create payload discountRates");
}

patch();
