const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/inventory/components/InventoryDetailModal.tsx', 'utf8');

// Imports
if (!content.includes('EnterpriseInput')) {
  content = content.replace(
    'import { ProductPricesTab } from \'@/components/pricing/ProductPricesTab\';',
    'import { ProductPricesTab } from \'@/components/pricing/ProductPricesTab\';\nimport { EnterpriseInput, EnterpriseSelect, EnterpriseButton, EnterpriseTextarea } from \'@/components/ui/enterprise\';'
  );
}

// Global replace standard inputs -> <EnterpriseInput />
content = content.replace(
  /<input\s+type=\"text\"\s+value=\{selectedProduct\.([A-Za-z0-9_]+)\}\s+onChange=\{\(e\) => setSelectedProduct\(\{\s*\.\.\.selectedProduct,\s*[A-Za-z0-9_]+:\s*e\.target\.value\s*\}\)\}\s+disabled=\{\!canEdit\}\s+className=\"[^\"]*\"\s*\/>/g,
  '<EnterpriseInput value={selectedProduct.$1} onChange={(e) => setSelectedProduct({ ...selectedProduct, $1: e.target.value })} disabled={!canEdit} />'
);

content = content.replace(
  /<input\s+type=\"number\"\s+value=\{selectedProduct\.([A-Za-z0-9_]+)\}\s+onChange=\{\(e\) => setSelectedProduct\(\{\s*\.\.\.selectedProduct,\s*[A-Za-z0-9_]+:\s*parseFloat\(e\.target\.value\)\s*\}\)\}\s+disabled=\{\!canEdit\}\s+className=\"[^\"]*\"\s*\/>/g,
  '<EnterpriseInput type="number" value={selectedProduct.$1 || 0} onChange={(e) => setSelectedProduct({ ...selectedProduct, $1: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />'
);

// Special case for barcode and code or others where they have || '' in value but the regex above doesn't match
content = content.replace(
  /<input\n\s+type=\"text\"\n\s+value=\{selectedProduct\.([A-Za-z0-9_]+) \|\| ''\}\n\s+onChange=\{\(e\) => setSelectedProduct\(\{\s*\.\.\.selectedProduct,\s*[A-Za-z0-9_]+:\s*e\.target\.value\s*\}\)\}\n\s+disabled=\{\!canEdit\}\n\s+className=\"[^\"]*\"\n\s*\/>/g,
  '<EnterpriseInput value={selectedProduct.$1 || \'\'} onChange={(e) => setSelectedProduct({ ...selectedProduct, $1: e.target.value })} disabled={!canEdit} />'
);
// In case the formatting doesn't match, let's just do a simpler targeted replace
content = content.replace(/<input\n\s+type=\"(text|number)\"\n\s+value=\{selectedProduct\.([a-zA-Z0-9_]+)[^}]*\}\n\s+onChange[\s\S]*?disabled={!canEdit}\n\s+className=\"[^\"]*\"\n\s*\/>/g, (match, type, field) => {
  if (type === 'number') {
    return `<EnterpriseInput type="number" value={selectedProduct.${field} || 0} onChange={(e) => setSelectedProduct({ ...selectedProduct, ${field}: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />`;
  }
  return `<EnterpriseInput value={selectedProduct.${field} || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, ${field}: e.target.value })} disabled={!canEdit} />`;
});

// Select
content = content.replace(/<select\n\s+value=\{selectedProduct\.([a-zA-Z0-9_]+)[^}]*\}\n\s+onChange=\{[^\}]+\}\n\s+disabled={!canEdit}\n\s+className=\"[^\"]*\"\n\s*>([\s\S]*?)<\/select>/g, (match, field, inner) => {
  const onChangeSnippet = match.match(/onChange=\{([^\}]+)\}/)[1];
  return `<EnterpriseSelect value={selectedProduct.${field} || ''} onChange={${onChangeSnippet}} disabled={!canEdit}>\n${inner}\n                                                </EnterpriseSelect>`;
});

// Textarea
content = content.replace(/<textarea\n\s+rows=\{3\}\n\s+value=\{selectedProduct\.description || ''\}\n\s+onChange=\{\(e\) => setSelectedProduct\(\{\s*\.\.\.selectedProduct,\s*description:\s*e\.target\.value\s*\}\)\}\n\s+disabled=\{!canEdit\}\n\s+className=\"[^\"]*\"\n\s*\/>/g, `<EnterpriseTextarea rows={3} value={selectedProduct.description || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })} disabled={!canEdit} />`);

content = content.replace(/<button\n\s+type=\"button\"\n\s+onClick=\{onClose\}\n\s+className=\"[^\"]*vazgeç[^\"]*\"\n\s*>/gi, '<EnterpriseButton variant="secondary" onClick={onClose}>');
content = content.replace(/<button\n\s+type=\"button\"\n\s+onClick=\{onSave\}\n\s+className=\"[^\"]*kaydet[^\"]*\"\n\s*>/gi, '<EnterpriseButton onClick={onSave}>');
content = content.replace(/<button\n\s+type=\"button\"\n\s+onClick=\{onDelete\}\n\s+className=\"[^\"]*sil[^\"]*\"\n\s*>/gi, '<EnterpriseButton variant="danger" onClick={onDelete}>');

fs.writeFileSync('src/app/(app)/inventory/components/InventoryDetailModal.tsx', content);
