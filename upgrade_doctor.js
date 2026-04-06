const fs = require('fs');

function upgradeDoctor() {
    const path = 'src/app/(app)/admin/system/doctor/page.tsx';
    let code = fs.readFileSync(path, 'utf8');
    
    // Add EnterprisePageShell import if not there
    if (!code.includes('EnterprisePageShell')) {
        code = code.replace(
            "import { ShieldCheck, AlertTriangle, AlertCircle, Activity, Zap, Play, RefreshCw, Server, Globe, Database, Terminal } from 'lucide-react';",
            "import { ShieldCheck, AlertTriangle, AlertCircle, Activity, Zap, Play, RefreshCw, Server, Globe, Database, Terminal } from 'lucide-react';\nimport { EnterprisePageShell, EnterpriseCard } from '@/components/ui/enterprise';"
        );
    }

    // Replace the outer div wrapper
    code = code.replace(
        /<div className="bg-slate-50 dark:bg-\[#0f172a\] min-h-screen w-full font-sans pb-16">\s*<div className="max-w-\[1600px\] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">/,
        `<EnterprisePageShell
            title="Platform Doctor (Sistem Sağlığı)"
            description="Ağır sistem sağlığı, otonom hata tespiti ve self-healing runbook yönetim merkezi."
            actions={
                <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-indigo-500/50">
                    <RefreshCw className="w-4 h-4" /> Manuel Tarama Başlat
                </button>
            }
        >
            <div>`
    );

    // Remove the old header
    const headerRegex = /<div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white\/10 pb-6">[\s\S]*?<\/div>\s*<\/div>/;
    code = code.replace(headerRegex, "");

    // Replace the end tags
    code = code.replace(
        /<\/div>\s*<\/div>\s*\)\;/m,
        '</div>\n            </EnterprisePageShell>\n    );'
    );
    
    // Change hardcoded modules to dynamic
    code = code.replace(
        /const DIAGNOSTICS_MODULES \= \[[\s\S]*?\];/m,
        `// Dynamic integration check logic replacing hardcoded DIAGNOSTICS_MODULES`
    );
    
    code = code.replace(
        `        take: 30\n    });`,
        `        take: 30\n    });\n\n    const integrations = await prisma.systemIntegration.findMany();\n    const DIAGNOSTICS_MODULES = integrations.map((i: any) => ({\n        name: i.name,\n        icon: <Server className="w-5 h-5 text-indigo-500" />,\n        status: i.isActive ? 'HEALTHY' : 'WARNING'\n    }));\n    if (DIAGNOSTICS_MODULES.length === 0) DIAGNOSTICS_MODULES.push({name: 'Sync Engine', icon: <Database className="w-5 h-5 text-emerald-500"/>, status: 'HEALTHY'});`
    );

    fs.writeFileSync(path, code);
    console.log("Upgraded system/doctor");
}

upgradeDoctor();
