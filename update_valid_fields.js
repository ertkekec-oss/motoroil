const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\inventory\\page.tsx';

let content = fs.readFileSync(path, 'utf8');

// We need to update validFields list to include the newly added DB fields.
const oldList = `               'salesVat', 'salesVatIncluded', 'purchaseVat', 'purchaseVatIncluded', 
               'salesOiv', 'salesOtv', 'otvType'
            ];`;

const newList = `               'salesVat', 'salesVatIncluded', 'purchaseVat', 'purchaseVatIncluded', 
               'salesOiv', 'salesOtv', 'otvType',
               'gtip', 'purchaseDiscount', 'otvCode'
            ];`;

if (content.includes(oldList)) {
    content = content.replace(oldList, newList);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Updated validFields in page.tsx');
} else {
    // Try simpler match if whitespace differs
    const simplerRegex = /'otvType'\s*\];/;
    if (simplerRegex.test(content)) {
        content = content.replace(simplerRegex, "'otvType', 'gtip', 'purchaseDiscount', 'otvCode' ];");
        fs.writeFileSync(path, content, 'utf8');
        console.log('Updated validFields in page.tsx using regex.');
    } else {
        console.log('Could not find validFields array to update.');
    }
}
