const fs = require('fs');
const file_path = 'src/app/(app)/inventory/page.tsx';
let content = fs.readFileSync(file_path, 'utf8');

content = content.replace(
    '"otvCode"',
    '"otvCode",\n        "globalCategoryId"'
);

// We should also replace it in newProduct state if necessary, but it will be passed normally into the product creation if present.
// Let's add it to resetNewProduct as well just to be safe.
content = content.replace(
    'tags: "",',
    'tags: "",\n      globalCategoryId: undefined,'
);

// Also need to add globalCategoryId to newProduct initial state
content = content.replace(
    'tags: "",\n      branch:',
    'tags: "",\n      globalCategoryId: undefined,\n      branch:'
);

fs.writeFileSync(file_path, content, 'utf8');
console.log('Done validFields edit');
