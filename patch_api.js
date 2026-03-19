const fs = require('fs');

const route_path = 'src/app/api/products/route.ts';
let content = fs.readFileSync(route_path, 'utf8');

// POST handler changes
content = content.replace(
    'purchaseDiscount, purchaseOtv',
    'purchaseDiscount, purchaseOtv, globalCategoryId'
);

content = content.replace(
    "category: category || 'Genel',",
    "category: category || 'Genel',\n                    globalCategoryId: globalCategoryId || null,"
);

fs.writeFileSync(route_path, content, 'utf8');

const id_route_path = 'src/app/api/products/[id]/route.ts';
let id_content = fs.readFileSync(id_route_path, 'utf8');

id_content = id_content.replace(
    'tags: body.tags,',
    'tags: body.tags,\n                    globalCategoryId: body.globalCategoryId !== undefined ? body.globalCategoryId : undefined,'
);

id_content = id_content.replace(
    'gtin: body.gtin,',
    'gtin: body.gtin,\n                    globalCategoryId: body.globalCategoryId !== undefined ? body.globalCategoryId : undefined,'
);

fs.writeFileSync(id_route_path, id_content, 'utf8');
console.log('Routes patched!');
