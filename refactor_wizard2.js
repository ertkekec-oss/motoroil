const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/(app)/inventory/components/ProductWizardModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The rest of the inputs using simpler regex targeting common combinations
content = content.replace(
    /<input\s+type="text"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*"\s+placeholder="([^"]+)"\s*\/>/g,
    '<EnterpriseInput value={$1} onChange={$2} placeholder="$3" />'
);

content = content.replace(
    /<input\s+type="text"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*"\s*\/>/g,
    '<EnterpriseInput value={$1} onChange={$2} />'
);

content = content.replace(
    /<input\s+type="text"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*"\s+maxLength=\{([^}]+)\}\s*\/>/g,
    '<EnterpriseInput value={$1} onChange={$2} maxLength={$3} />'
);

content = content.replace(
    /<input\s+type="text"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*uppercase[^"]*"\s+placeholder="([^"]+)"\s+maxLength=\{([^}]+)\}\s*\/>/g,
    '<EnterpriseInput value={$1} onChange={$2} placeholder="$3" maxLength={$4} className="uppercase" />'
);

content = content.replace(
    /<input\s+type="number"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*"\s*\/>/g,
    '<EnterpriseInput type="number" value={$1} onChange={$2} />'
);

content = content.replace(
    /<input\s+type="number"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*"\s+placeholder="([^"]+)"\s*\/>/g,
    '<EnterpriseInput type="number" value={$1} onChange={$2} placeholder="$3" />'
);

// PriceLists specific manual
content = content.replace(
    /<input type="number" className="w-full h-10[^"]*"\s+placeholder="0.00"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s*\/>/g,
    '<EnterpriseInput type="number" value={$1} onChange={$2} placeholder="0.00" />'
);

// Variants manual mapping
content = content.replace(
    /<input type="text" className="w-full h-8[^"]*"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s*\/>/g,
    '<EnterpriseInput value={$1} onChange={$2} />'
);

content = content.replace(
    /<input type="number" className="w-full h-8[^"]*"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s*\/>/g,
    '<EnterpriseInput type="number" value={$1} onChange={$2} />'
);

// remaining select
content = content.replace(
    /<select\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="[^"]*w-full h-12[^"]*">\s*([\s\S]*?)<\/select>/g,
    '<EnterpriseSelect value={$1} onChange={$2}>\n$3\n                        </EnterpriseSelect>'
);

fs.writeFileSync(filePath, content);
console.log('Done cleaning up ProductWizardModal.');
