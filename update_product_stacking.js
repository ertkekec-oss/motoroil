const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// Identify the onClick block in the product picker.
// It starts with onClick={() => {
// and contains setInvoiceItems([...invoiceItems, {
// and ends with setIsProductPickerOpen(false); setProductSearchTerm(''); }}

const targetStart = `onClick={() => {
                                                setInvoiceItems([...invoiceItems, {
                                                    name: p.name,
                                                    qty: 1,`;
// This assumes formatting matches view_file output.

// Let's use a broader search to trigger the replacement logic.
const uniqueHelper = 'setInvoiceItems([...invoiceItems, {';
const pickerStart = '.map(p => {'; // Assuming this map is the one for products.

const pickerIndex = content.lastIndexOf(pickerStart);
if (pickerIndex !== -1) {
    const uniqueHelperIndex = content.indexOf(uniqueHelper, pickerIndex);

    if (uniqueHelperIndex !== -1) {
        // We found the spot. Now we need to find the full onClick block to replace.
        // It's wrapped in: onClick={() => { ... }}

        const onClickStart = content.lastIndexOf('onClick={() => {', uniqueHelperIndex);

        // Find the matching closing brace for the onClick arrow function
        // It ends with: setProductSearchTerm('');
        //                                            }}

        const endMarker = "setProductSearchTerm('');";
        const endMarkerIndex = content.indexOf(endMarker, uniqueHelperIndex);

        if (onClickStart !== -1 && endMarkerIndex !== -1) {
            // Find the closing bracket '}}' after endMarker
            const blockEnd = content.indexOf('}}', endMarkerIndex) + 2;

            const originalBlock = content.substring(onClickStart, blockEnd);

            const newBlock = `onClick={() => {
                                                const existingIndex = invoiceItems.findIndex(item => item.productId === p.id);
                                                if (existingIndex !== -1) {
                                                    const newItems = [...invoiceItems];
                                                    newItems[existingIndex].qty = (Number(newItems[existingIndex].qty) || 0) + 1;
                                                    setInvoiceItems(newItems);
                                                } else {
                                                    setInvoiceItems([...invoiceItems, {
                                                        name: p.name,
                                                        qty: 1,
                                                        price: netPrice,
                                                        vat: vatRate,
                                                        otv: otvRate,
                                                        otvType: otvType,
                                                        oiv: oivRate,
                                                        productId: p.id
                                                    }]);
                                                }
                                                setIsProductPickerOpen(false);
                                                setProductSearchTerm('');
                                            }}`;

            content = content.replace(originalBlock, newBlock);
            fs.writeFileSync(path, content, 'utf8');
            console.log('Updated product picker to stack quantities.');
        } else {
            console.log('Could not determine onClick block boundaries.');
        }
    } else {
        console.log('Could not find setInvoiceItems call in picker.');
    }
} else {
    console.log('Could not find product map.');
}
