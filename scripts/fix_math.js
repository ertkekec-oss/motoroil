const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const replaceBlock = `        // Calculate total of new invoice
        const rawSubtotal = invoiceItems.reduce((acc, it) => acc + (Number(it.qty || 1) * Number(it.price || 0)), 0);
        
        let discAmount = 0;
        if (discountType === 'percent') {
            discAmount = rawSubtotal * (discountValue / 100);
        } else {
            discAmount = discountValue;
        }

        let discountRatio = rawSubtotal > 0 ? (discAmount / rawSubtotal) : 0;
        if (discountRatio > 1) discountRatio = 1;

        let newSubtotal = rawSubtotal - discAmount;
        let newTotalOtv = 0;
        let newTotalOiv = 0;
        let newTotalVat = 0;

        invoiceItems.forEach(it => {
            const lineQty = Number(it.qty || 1);
            let lineNet = lineQty * Number(it.price || 0);
            lineNet = lineNet * (1 - discountRatio);

            let lineOtv = 0;
            if (it.otvType === 'Yüzdesel') {
                lineOtv = lineNet * (Number(it.otv || 0) / 100);
            } else if (it.otvType === 'Birim Başına') {
                lineOtv = Number(it.otv || 0) * lineQty;
            }
            const matrah = lineNet + lineOtv;
            newTotalOtv += lineOtv;
            newTotalOiv += matrah * (Number(it.oiv || 0) / 100);
            newTotalVat += matrah * (Number(it.vat || 20) / 100);
        });

        const newTotalAmount = newSubtotal + newTotalOtv + newTotalOiv + newTotalVat;`;

const rgx = /\/\/ Calculate total of new invoice[\s\S]*?const newTotalAmount = newSubtotal \+ newTotalOtv \+ newTotalOiv \+ newTotalVat - discAmount;/m;
if (rgx.test(content)) {
    content = content.replace(rgx, replaceBlock);
    fs.writeFileSync(file, content);
    console.log('Math logic fixed in CustomerDetailClient.tsx via regex');
} else {
    console.error('Failed to find block completely.');
}
