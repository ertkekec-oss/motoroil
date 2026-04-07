const fs = require('fs');

function fixAuditLogs() {
    let file = 'src/app/(app)/admin/audit-logs/page.tsx';
    let code = fs.readFileSync(file, 'utf-8');
    
    const lines = code.split('\n');
    let newLines = [];
    let skipMode = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Match outer layout start
        if (line.includes('<div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen w-full font-sans pb-16">')) {
            newLines.push('        <EnterprisePageShell');
            newLines.push('            title="Denetim Kayıtları (Audit Logs)"');
            newLines.push('            description="Platform genelindeki tüm veri mutasyonlarını, oturum açma eylemlerini ve hassas işlemleri izleyin."');
            newLines.push('            actions={');
            newLines.push('                <button');
            newLines.push('                    onClick={() => fetchLogs()}');
            newLines.push('                    disabled={isLoading}');
            newLines.push('                    className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"');
            newLines.push('                    title="Tabloyu Yenile"');
            newLines.push('                >');
            newLines.push('                    <RefreshCw className={`w-5 h-5 ${isLoading ? \'animate-spin text-indigo-500\' : \'\'}`} />');
            newLines.push('                </button>');
            newLines.push('            }');
            newLines.push('        >');
            newLines.push('            <div className="animate-in fade-in duration-300">');
            
            // Skip the next lines until "Filters" comment
            skipMode = true;
            continue;
        }
        
        if (skipMode && line.includes('{/* Filters */}')) {
            skipMode = false;
        }
        
        if (!skipMode) {
            newLines.push(line);
        }
    }
    
    // Fix closing tags
    const joinedCode = newLines.join('\n');
    const finalCode = joinedCode.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/s, '            </div>\n        </EnterprisePageShell>\n    );\n}\n');
    
    fs.writeFileSync(file, finalCode);
    console.log('Fixed audit-logs using safe line builder.');
}

fixAuditLogs();
