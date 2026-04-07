const fs = require('fs');

const files = [
    'src/app/(app)/admin/disputes/page.tsx',
    'src/app/(app)/admin/ops/orders/page.tsx',
    'src/app/(app)/admin/payments-escrow/providers/page.tsx',
    'src/app/(app)/admin/payments-escrow/policies/page.tsx',
    'src/app/(app)/admin/ops/providers/page.tsx',
    'src/app/(app)/admin/ops/shipments/page.tsx',
    'src/app/(app)/admin/payments-escrow/audit/page.tsx',
    'src/app/(app)/admin/payments-escrow/commissions/page.tsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) {
        console.log('Skipping missing:', file);
        continue;
    }
    
    let code = fs.readFileSync(file, 'utf-8');
    
    // Ensure import
    if (!code.includes('EnterprisePageShell')) {
        code = code.replace(/import {([^}]*)} from ['"]lucide-react['"];/, 'import { $1 } from "lucide-react";\nimport { EnterprisePageShell } from "@/components/ui/enterprise";');
    }

    // Common start marker
    const startRegex = /<div className="bg-slate-50 dark:bg-\[#0f172a\][^>]*>\s*<div className="max-w-\[1600px\][^>]*>/;
    
    const matchStart = code.match(startRegex);
    if (!matchStart) {
        console.log('No container found in:', file);
        continue;
    }
    
    // Try to extract title and description using regex from the header area
    // Usually it looks like: <h1 className="..."> <Icon/> Title </h1> <p> Description </p>
    let title = "Başlık";
    let desc = "Açıklama...";
    
    const h1Match = code.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (h1Match) {
         // strip icons
         title = h1Match[1].replace(/<[A-Z][a-zA-Z]* [^>]*\/>/g, '').trim();
    }
    
    const pMatch = code.match(/<p className="text-sm text-slate-500[^>]*>([\s\S]*?)<\/p>/);
    if (pMatch) desc = pMatch[1].trim();
    
    // Header flex block logic (up to the next grid or comment)
    // We can just use the manual line builder like we did with audit-logs
    
    const lines = code.split('\n');
    let newLines = [];
    let skipMode = false;
    let headerActionLines = [];
    let collectingActions = false;
    let processed = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (!processed && (line.includes('<div className="bg-slate-50') || line.includes('<div className="max-w-[1600px]'))) {
             if (line.includes('<div className="bg-slate-50')) {
                 skipMode = true;
             }
             continue;
        }
        
        // Find the title element to start seeing if there's a button
        if (skipMode && line.includes('</h1>')) {
            // Check next lines for button
            let buttonFound = false;
            for(let j=i+1; j < i+10 && j < lines.length; j++){
               if(lines[j].includes('<button') || lines[j].includes('<Link')) {
                   buttonFound = true;
                   break;
               }
               if(lines[j].includes('</div>')) break; // End of header side
            }
        }
        
        // If we hit the end of the header
        if (skipMode && (line.includes('{/* Filters */}') || line.includes('{/* Stats */}') || line.includes('{/* Metrics */}') || line.includes('className="grid'))) {
            skipMode = false;
            processed = true;
            
            newLines.push('        <EnterprisePageShell');
            newLines.push('            title="' + title + '"');
            newLines.push('            description="' + desc + '"');
            newLines.push('        >');
            newLines.push('            <div className="animate-in fade-in duration-300 space-y-6">');
            
            newLines.push(line);
            continue;
        }
        
        if (!skipMode) {
            newLines.push(line);
        }
    }
    
    // Fix closing tags
    const joinedCode = newLines.join('\n');
    let finalCode = joinedCode.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/s, '            </div>\n        </EnterprisePageShell>\n    );\n}\n');
    finalCode = finalCode.replace(/<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/s, '            </div>\n        </EnterprisePageShell>\n    );\n}\n');
    
    fs.writeFileSync(file, finalCode);
    console.log('Migrated UI for:', file);
}
