const fs = require('fs');
const path = require('path');

const modals = [
    'src/components/modals/TransactionDetailModal.tsx',
    'src/components/modals/SupplierPurchaseModal.tsx'
];

modals.forEach((file) => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // add import checking
    if (content.includes('import {') && !content.includes('EnterpriseInput')) {
        content = content.replace(/import\s+\{.*\}\s+from\s+['"]lucide-react['"];?/, (match) => {
            return match + '\nimport { EnterpriseInput, EnterpriseSelect, EnterpriseButton, EnterpriseTextarea } from "@/components/ui/enterprise";';
        });
    }

    // Replace <input type="text">
    content = content.replace(
        /<input\n\s*type="text"\n\s*value=\{([^}]+)\}\n\s*onChange=\{([^}]+)\}\n\s*className="[^"]*w-full p-2[^"]*"\n\s+placeholder="([^"]+)"\n\s*\/>/g,
        '<EnterpriseInput value={$1} onChange={$2} placeholder="$3" />'
    );
    
    // Replace <input type="number">
    content = content.replace(
        /<input\n\s*type="number"\n\s*value=\{([^}]+)\}\n\s*onChange=\{([^}]+)\}\n\s*className="[^"]*w-full p-2[^"]*"\n\s*\/>/g,
        '<EnterpriseInput type="number" value={$1} onChange={$2} />'
    );
    
    // Any remaining simple text inputs
    content = content.replace(
        /<input\s+type="text"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*"\s*\/>/g,
        '<EnterpriseInput value={$1} onChange={$2} />'
    );

    content = content.replace(
        /<input\s+type="number"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*"\s*\/>/g,
        '<EnterpriseInput type="number" value={$1} onChange={$2} />'
    );

    // Date inputs
    content = content.replace(
        /<input\n\s*type="date"\n\s*value=\{([^}]+)\}\n\s*onChange=\{([^}]+)\}\n\s*className="[^"]*w-full p-2[^"]*"\n\s*\/>/g,
        '<EnterpriseInput type="date" value={$1} onChange={$2} />'
    );

    content = content.replace(
        /<input\s+type="date"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*"\s*\/>/g,
        '<EnterpriseInput type="date" value={$1} onChange={$2} />'
    );
    
    // Select
    content = content.replace(
        /<select\n\s*value=\{([^}]+)\}\n\s*onChange=\{([^}]+)\}\n\s*className="[^"]*w-full p-2[^"]*"\n\s*>([\s\S]*?)<\/select>/g,
        '<EnterpriseSelect value={$1} onChange={$2}>\n$3\n                                    </EnterpriseSelect>'
    );

    content = content.replace(
        /<select\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*">\s*([\s\S]*?)<\/select>/g,
        '<EnterpriseSelect value={$1} onChange={$2}>\n$3\n                                    </EnterpriseSelect>'
    );

    // Replace primary buttons
    content = content.replace(
        /<button\s+onClick=\{([^\}]+)\}\s+disabled=\{([^\}]+)\}\s+className="[^"]*bg-slate-900[^"]*"\s*>\s*(.*?)\s*<\/button>/g,
        '<EnterpriseButton onClick={$1} disabled={$2}>$3</EnterpriseButton>'
    );
    
    // Secondary Buttons (Cancel)
    content = content.replace(
        /<button\s+onClick=\{([^\}]+)\}\s+disabled=\{([^\}]+)\}\s+className="[^"]*bg-white[^"]*"\s*>\s*(.*?)\s*<\/button>/g,
        '<EnterpriseButton variant="secondary" onClick={$1} disabled={$2}>$3</EnterpriseButton>'
    );
    
    fs.writeFileSync(fullPath, content);
});
console.log('Done refactoring modals');
