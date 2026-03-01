const fs = require('fs');

function transformFile(filePath) {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if we already injected imports to avoid double importing
    if (content.includes("from '@/components/ui/enterprise'")) {
        console.log('Already transformed:', filePath);
        return;
    }

    const imports = [
        "EnterpriseCard",
        "EnterpriseInput",
        "EnterpriseSelect",
        "EnterpriseTextarea",
        "EnterpriseButton",
        "EnterpriseSwitch",
        "EnterpriseSectionHeader",
        "EnterpriseTable",
        "EnterpriseModal"
    ];

    const importStr = `import { ${imports.join(', ')} } from '@/components/ui/enterprise';\n`;

    // Inject at the end of the top imports
    const match = content.match(/import\s+.*?[\"'];?\n/g);
    if (match) {
        const lastImport = match[match.length - 1];
        const lastIdx = content.lastIndexOf(lastImport) + lastImport.length;
        content = content.slice(0, lastIdx) + importStr + content.slice(lastIdx);
    } else {
        content = importStr + content;
    }

    // 1. Replace Inputs (except hidden and checkboxes handled explicitly)
    // using a more careful approach since `<input` can be multiline.
    // Replace <input... with <EnterpriseInput...
    content = content.replace(/<input(?=[\s\S]*?>)/g, (match, offset, str) => {
        // Look ahead within the same tag up to '>'
        const tagContent = str.slice(offset, str.indexOf('>', offset));
        if (tagContent.includes('type="checkbox"') || tagContent.includes('type="hidden"') || tagContent.includes("type='hidden'") || tagContent.includes("type='checkbox'") || tagContent.includes('type="file"')) {
            return '<input';
        }
        return '<EnterpriseInput';
    });

    // Important: input tags in React can be self closing `<input />` or have children (rarely). `<EnterpriseInput />` will be fine.

    // 2. Selects
    content = content.replace(/<select/g, '<EnterpriseSelect');
    content = content.replace(/<\/select>/g, '</EnterpriseSelect>');

    // 3. Textareas
    content = content.replace(/<textarea/g, '<EnterpriseTextarea');
    content = content.replace(/<\/textarea>/g, '</EnterpriseTextarea>');

    // 4. Cards
    // Replacing specific standard tailwind strings we introduced in the last step
    // e.g., bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm
    const cardClassRegex = /className=["'](?:[^"']*?)\bbg-white dark:bg-\[\#111827\] rounded-\[20px\] border border-slate-200 dark:border-slate-800 shadow-sm\b(?:[^"']*?)["']/g;
    content = content.replace(/<div([^>]*?)className=["'](?:[^"']*?)\bbg-white dark:bg-\[\#111827\] rounded-\[20px\] border border-slate-200 dark:border-slate-800 shadow-sm\b(?:[^"']*?)["']([^>]*?)>/g, '<EnterpriseCard$1$2>');

    // 5. Switches / Checkboxes 
    // The prompt requested: <EnterpriseSwitch />
    // Our old specific UI pattern was `<label className="..."><div className="w-12 h-6..."><input type="checkbox"...`
    // Replacing this with regex recursively is impossible via regex. We'll leave `EnterpriseSwitch` for manual or ignore if it's already perfectly looking (the prompt asks to adopt the token/component, which is conceptually identical if it has same classes. But to strictly obey: I won't auto-regex nested divs).

    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Transformed:', filePath);
}

transformFile('src/app/(app)/settings/page.tsx');
transformFile('src/components/IntegrationsContent.tsx');
transformFile('src/app/(app)/settings/branch/page.tsx');
