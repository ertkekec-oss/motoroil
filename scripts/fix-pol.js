const fs = require('fs');
const file = 'src/app/(app)/admin/payments-escrow/policies/page.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Fix the early return
code = code.replace(/<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"><\/div>\s*<\/EnterprisePageShell>\s*\);\s*}/, '<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>\n            </div>\n        );\n    }');

// Fix the bottom
if (!code.match(/<\/EnterprisePageShell>.*}$/ms)) {
    code = code.replace(/<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/ms, '</EnterprisePageShell>\n    );\n}\n');
}

fs.writeFileSync(file, code);
console.log('Fixed policies explicitly');
