const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// Identifier for the block
const targetStart = 'const grossPrice = Number(p.price || 0);';
const targetEnd = 'setProductSearchTerm(\'\');';
// That targetEnd is a bit far down.

// Let's rely on the structure of the map callback.
const mapCallbackStart = '.map(p => {';
const mapCallbackIndex = content.lastIndexOf(mapCallbackStart);

if (mapCallbackIndex !== -1) {
    // We are in the product picker map (bottom of file)
    // Find the return statement inside
    const returnIndex = content.indexOf('return (', mapCallbackIndex);
    const divKeyIndex = content.indexOf('key={p.id}', returnIndex);
    const onClickIndex = content.indexOf('onClick={() => {', divKeyIndex);

    // We want to replace the logic inside onClick
    const setInvoiceItemsStart = content.indexOf('setInvoiceItems([...invoiceItems, {', onClickIndex);
    const objStart = content.indexOf('{', setInvoiceItemsStart + 30); // inside array
    const objEnd = content.indexOf('}]);', objStart);

    if (setInvoiceItemsStart !== -1 && objEnd !== -1) {
        // Construct new object content
        const newObjContent = `{
                                                    name: p.name,
                                                    qty: 1,
                                                    price: netPrice,
                                                    vat: vatRate,
                                                    otv: otvRate,
                                                    otvType: otvType,
                                                    oiv: oivRate,
                                                    productId: p.id
                                                }`;

        content = content.substring(0, objStart) + newObjContent + content.substring(objEnd + 1); // +1 to keep }]); 

        // Also need to update the calculation variables at the top of the map function
        const varsStart = content.indexOf(targetStart, mapCallbackIndex);
        const varsEnd = content.indexOf('return (', varsStart);

        if (varsStart !== -1 && varsEnd !== -1) {
            const newVars = `const grossPrice = Number(p.price || 0);
                                    const vatRate = Number(p.salesVat || 20);
                                    const otvType = p.otvType || 'Ö.T.V yok';
                                    const otvRate = Number(p.salesOtv || 0);
                                    const oivRate = Number(p.salesOiv || 0);
                                    const effectiveVatOiv = (1 + (vatRate + oivRate)/100);
                                    
                                    let netPrice = 0;
                                    if (otvType === 'yüzdesel Ö.T.V') {
                                        netPrice = grossPrice / ((1 + otvRate/100) * effectiveVatOiv);
                                    } else if (otvType === 'maktu Ö.T.V') {
                                        netPrice = (grossPrice / effectiveVatOiv) - otvRate;
                                    } else {
                                        netPrice = grossPrice / effectiveVatOiv;
                                    }

                                    `;
            content = content.substring(0, varsStart) + newVars + content.substring(varsEnd);

            console.log('Updated product picker logic');
            fs.writeFileSync(path, content, 'utf8');
        } else {
            console.log('Could not find var declaration block');
        }
    } else {
        console.log('Could not find setInvoiceItems block');
    }
} else {
    console.log('Could not find map callback');
}
