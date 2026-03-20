const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/api/network/catalog/route.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// Replace cursor logic with page logic
content = content.replace(
    'const take = parseInt(url.searchParams.get("take") || "20", 10)\n        let cursor = url.searchParams.get("cursor") || undefined',
    'const take = parseInt(url.searchParams.get("take") || "12", 10)\n        const page = parseInt(url.searchParams.get("page") || "1", 10)\n        const skip = (page - 1) * take;'
);

const whereRegex = /where: \{\s*supplierTenantId: membership.tenantId,[\s\S]*?\},/g;
let whereMatch = content.match(whereRegex);
if(whereMatch) {
    const totalCountQuery = `const totalCount = await prisma.dealerCatalogItem.count({ ${whereMatch[0]} });\n        const totalPages = Math.ceil(totalCount / take);`;
    
    // Replace the findMany query options to use skip
    content = content.replace(
        'take: take + 1,\n            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),',
        'take: take,\n            skip: skip,'
    );

    // Insert the count query right before findMany
    content = content.replace('const catalogItems = await prisma.dealerCatalogItem.findMany({', totalCountQuery + '\n        const catalogItems = await prisma.dealerCatalogItem.findMany({');
}

// Remove nextCursor logic
content = content.replace(
    /let nextCursor: string \| undefined = undefined;[\s\S]*?nextCursor = nextItem\?\.id;\n\s*\}/g,
    ""
);

// Map products
content = content.replace(
    /return NextResponse.json\(\{\s*ok: true,\s*products,\s*nextCursor\s*\}\)/g,
    "return NextResponse.json({ ok: true, products, pagination: { page, limit: take, totalCount, totalPages } })"
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('SUCCESS: API pagination applied!');
