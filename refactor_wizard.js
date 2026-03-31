const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/(app)/inventory/components/ProductWizardModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Imports
if (!content.includes('EnterpriseInput')) {
    content = content.replace(
        'import { useModal } from "@/contexts/ModalContext";',
        'import { useModal } from "@/contexts/ModalContext";\nimport { EnterpriseInput, EnterpriseSelect, EnterpriseTextarea } from "@/components/ui/enterprise";'
    );
}

// 2. Replace <input type="text" ... />
content = content.replace(
    /<input\s+type="text"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*w-full h-12[^"]*"\s+placeholder="([^"]+)"\s*\/>/g,
    '<EnterpriseInput value={$1} onChange={$2} placeholder="$3" />'
);

// Specifically handle inputs without placeholder
content = content.replace(
    /<input\s+type="text"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*w-full h-12[^"]*"\s*\/>/g,
    '<EnterpriseInput value={$1} onChange={$2} />'
);

// 3. Replace <input type="number" ... />
content = content.replace(
    /<input\s+type="number"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*flex-1 h-12[^"]*"\s*\/>/g,
    '<EnterpriseInput type="number" value={$1} onChange={$2} />'
);
content = content.replace(
    /<input\s+type="number"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*w-full h-12[^"]*"\s*(?:placeholder="([^"]+)")?\s*\/>/g,
    (match, val, onChange, placeholder) => {
        const ph = placeholder ? ` placeholder="${placeholder}"` : '';
        return `<EnterpriseInput type="number" value={${val}} onChange={${onChange}}${ph} />`;
    }
);

// Replace variant inputs
content = content.replace(
    /<input\s+type="text"\s+placeholder="([^"]+)"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*flex-1 bg-transparent[^"]*"\s*\/>/g,
    '<EnterpriseInput placeholder="$1" value={$2} onChange={$3} />'
);

content = content.replace(
    /<input\s+type="text"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*w-full bg-slate-50[^"]*"\s*\/>/g,
    '<EnterpriseInput value={$1} onChange={$2} />'
);

// 4. Replace <select>
content = content.replace(
    /<select\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*w-full h-12[^"]*">\s*([\s\S]*?)<\/select>/g,
    '<EnterpriseSelect value={$1} onChange={$2}>\n$3\n                        </EnterpriseSelect>'
);

content = content.replace(
    /<select\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*w-24 h-12[^"]*">\s*([\s\S]*?)<\/select>/g,
    '<EnterpriseSelect value={$1} onChange={$2} className="w-24">\n$3\n                                </EnterpriseSelect>'
);

content = content.replace(
    /<select\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*col-span-1 bg-white[^"]*">\s*([\s\S]*?)<\/select>/g,
    '<EnterpriseSelect value={$1} onChange={$2}>\n$3\n                                    </EnterpriseSelect>'
);

// 5. Replace <textarea>
content = content.replace(
    /<textarea\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+rows=\{([^}]+)\}\s+className="[^"]*w-full p-4[^"]*"\s+placeholder="([^"]+)"\s*\/>/g,
    '<EnterpriseTextarea value={$1} onChange={$2} rows={$3} placeholder="$4" />'
);

// Clean up some other inputs specifically hardcoded in StepOtherInfo or variants
content = content.replace(
    /<input\s+type="number"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="w-full h-12[^"]*"\s*\/>/g,
    '<EnterpriseInput type="number" value={$1} onChange={$2} />'
);

fs.writeFileSync(filePath, content);
console.log('Wizard Modal successfully refactored.');
