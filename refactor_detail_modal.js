const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/inventory/components/InventoryDetailModal.tsx', 'utf8');

// Imports
if (!content.includes('EnterpriseInput')) {
  content = content.replace(
    "import { ProductPricesTab } from '@/components/pricing/ProductPricesTab';",
    "import { ProductPricesTab } from '@/components/pricing/ProductPricesTab';\nimport { EnterpriseInput, EnterpriseSelect, EnterpriseButton, EnterpriseTextarea } from '@/components/ui/enterprise';"
  );
}

// Global replace standard text inputs -> <EnterpriseInput />
content = content.replace(
  /<input\s+type="text"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+disabled=\{!canEdit\}\s+className="[^"]*"\s*\/>/g,
  '<EnterpriseInput value={$1} onChange={$2} disabled={!canEdit} />'
);

// Global replace standard number inputs -> <EnterpriseInput />
content = content.replace(
  /<input\s+type="number"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+disabled=\{!canEdit\}\s+className="[^"]*"\s*\/>/g,
  '<EnterpriseInput type="number" value={$1} onChange={$2} disabled={!canEdit} />'
);

// General pattern for other inputs
content = content.replace(
    /<input\s+type="([^"]+)"\s+value=\{([^}]+)\}\s+onChange=\{\(e\) => setSelectedProduct\(([^)]+)\)\}\s+disabled=\{!canEdit\}\s+className="[^"]*"\s*\/>/g,
    '<EnterpriseInput type="$1" value={$2} onChange={(e) => setSelectedProduct($3)} disabled={!canEdit} />'
);

// Replace selects
content = content.replace(
    /<select\s+value=\{([^}]+)\}\s+onChange=\{\(e\) => setSelectedProduct\(([^)]+)\)\}\s+disabled=\{!canEdit\}\s+className="[^"]*"\s*>([\s\S]*?)<\/select>/g,
    '<EnterpriseSelect value={$1} onChange={(e) => setSelectedProduct($2)} disabled={!canEdit}>\n$3\n                                            </EnterpriseSelect>'
);

// Replace Textarea
content = content.replace(
    /<textarea\s+rows=\{3\}\s+value=\{([^}]+)\}\s+onChange=\{\(e\) => setSelectedProduct\(([^)]+)\)\}\s+disabled=\{!canEdit\}\s+className="[^"]*"\s*\/>/g,
    '<EnterpriseTextarea rows={3} value={$1} onChange={(e) => setSelectedProduct($2)} disabled={!canEdit} />'
);

// Replace Buttons
content = content.replace(
    /<button\s+type="button"\s+onClick=\{onClose\}\s+className="[^"]*"\s*>\s*(.*?)\s*<\/button>/g,
    (match, text) => {
        if(text.includes('Vazgeç') || text.includes('Kapat')) {
            return `<EnterpriseButton variant="secondary" onClick={onClose}>${text}</EnterpriseButton>`;
        }
        return match;
    }
);

content = content.replace(
    /<button\s+type="button"\s+onClick=\{onSave\}\s+className="[^"]*"\s*>\s*(.*?)\s*<\/button>/g,
    `<EnterpriseButton onClick={onSave}>Değişiklikleri Kaydet</EnterpriseButton>`
);

content = content.replace(
    /<button\s+type="button"\s+onClick=\{onDelete\}\s+className="[^"]*"\s*>\s*(.*?)\s*<\/button>/g,
    `<EnterpriseButton variant="danger" onClick={onDelete}>Ürünü Sil</EnterpriseButton>`
);

fs.writeFileSync('src/app/(app)/inventory/components/InventoryDetailModal.tsx', content);
console.log("Refactoring complete.");
