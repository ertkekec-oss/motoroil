const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/network/catalog/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Replace import statement
content = content.replace("import NetworkProductDetailModal from \"./components/NetworkProductDetailModal\"\n", "");

// Add useRouter
if (!content.includes('import { useRouter }')) {
    content = content.replace('import React, { useState, useEffect } from "react"', 'import React, { useState, useEffect } from "react"\nimport { useRouter } from "next/navigation"');
}

// Add router to component
if (!content.includes('const router = useRouter()')) {
    content = content.replace('export default function NetworkCatalogPage() {\n    const { showError, showSuccess } = useModal()', 'export default function NetworkCatalogPage() {\n    const { showError, showSuccess } = useModal()\n    const router = useRouter()');
}

// Replace button onClick
content = content.replace(/onClick=\{\(\) => setSelectedProduct\(p\)\}/g, "onClick={() => router.push('/network/catalog/' + p.id)}");

// Remove state
content = content.replace("    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)\n", "");

// Remove component usage at the bottom
const usageRegex = /<NetworkProductDetailModal[\s\S]*?\/>/g;
content = content.replace(usageRegex, "");

fs.writeFileSync(targetPath, content, 'utf8');
console.log('SUCCESS: Nav changed to page routing.');
