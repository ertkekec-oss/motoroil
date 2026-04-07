const fs = require('fs');

function fixPage(file, title, escDesc) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf-8');
    
    // Add import if missing
    if (!code.includes('EnterprisePageShell')) {
        code = code.replace(/import {([^}]*)} from ['"]lucide-react['"];/, 'import { $1 } from "lucide-react";\nimport { EnterprisePageShell } from "@/components/ui/enterprise";');
    }

    const lines = code.split(/\r?\n/);
    let newLines = [];
    let skipMode = false;
    let inHeader = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Match outer layout start
        if (line.includes('<div className="bg-slate-50') && lines[i+1] && lines[i+1].includes('<div className="max-w-[1600px]')) {
            newLines.push('        <EnterprisePageShell');
            newLines.push(`            title="${title}"`);
            newLines.push(`            description="${escDesc}"`);
            
            // Try to extract action block
            let actionLines = [];
            let inAction = false;
            for(let j=i+2; j < i+40 && j < lines.length; j++){
               if (lines[j].includes('<div className="flex bg-white') || lines[j].includes('<button') && !lines[j].includes('onClick')) {
                   inAction = true;
               }
               if (inAction) {
                   actionLines.push(lines[j]);
               }
               if (inAction && (lines[j].includes('</div>') && actionLines.length > 3 || lines[j] === '                    </div>')) {
                   break;
               }
            }
            
            if (actionLines.length > 0) {
                newLines.push('            actions={');
                newLines.push('                <>');
                newLines.push(...actionLines);
                newLines.push('                </>');
                newLines.push('            }');
            }
            newLines.push('        >');
            newLines.push('            <div className="animate-in fade-in duration-300 space-y-6">');
            
            skipMode = true;
            inHeader = true;
            continue;
        }
        
        if (inHeader) {
           if (line.includes('Main Content Container') || line.includes('{/* Filters */}') || line.includes('{/* Table */}') || line.includes('{/* Stats */}') || line.includes('{/* Stats Widget */}')|| line.includes('{/* Info Cards */}')) {
               skipMode = false;
               inHeader = false;
           }
        }
        
        if (!skipMode) {
            newLines.push(line);
        }
    }
    
    // Fix closing tags
    const joinedCode = newLines.join('\n');
    let finalCode = joinedCode.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/s, '            </div>\n        </EnterprisePageShell>\n    );\n}\n');
    
    fs.writeFileSync(file, finalCode);
    console.log('Fixed', file);
}

fixPage('src/app/(app)/admin/disputes/page.tsx', 
    'Uyuşmazlık Çözüm Merkezi (Disputes)', 
    'B2B işlemlerindeki finansal riskleri, emanet iadelerini ve yasal tahkim süreçlerini (Escrow Arbitration) değerlendirin.');
