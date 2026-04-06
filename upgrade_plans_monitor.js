const fs = require('fs');

function upgradePlans() {
    let code = fs.readFileSync('src/app/(app)/admin/plans/page.tsx', 'utf8');
    if (code.includes('EnterprisePageShell')) return;
    
    code = code.replace(
        "import { useModal } from '@/contexts/ModalContext';",
        "import { useModal } from '@/contexts/ModalContext';\nimport { EnterprisePageShell, EnterpriseCard } from '@/components/ui/enterprise';"
    );
    
    code = code.replace(
        /<div className="space-y-8 animate-in fade-in duration-500">/,
        `<EnterprisePageShell
            title="Paketler & Fiyatlandırma"
            description="Abonelik planlarını ve fiyatlarını yönetin."
            actions={
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
                >
                    + Yeni Paket Ekle
                </button>
            }
        >
        `
    );
    
    const headerRegex = /<div className="flex justify-between items-end">[\s\S]*?<\/div>\s*<\/div>/;
    code = code.replace(headerRegex, "");

    code = code.replace(
        />\s*<\/div>\s*\)\;/m,
        '>\n            </EnterprisePageShell>\n    );'
    );
    
    fs.writeFileSync('src/app/(app)/admin/plans/page.tsx', code);
    console.log("Upgraded plans");
}

function upgradeTrustMonitor() {
    const path = 'src/app/(app)/admin/trust-monitor/page.tsx';
    if (!fs.existsSync(path)) return;
    let code = fs.readFileSync(path, 'utf8');
    if (code.includes('EnterprisePageShell')) return;
    
    code = code.replace(
        "import { useState, useEffect } from 'react';",
        "import { useState, useEffect } from 'react';\nimport { EnterprisePageShell } from '@/components/ui/enterprise';"
    );
    
    code = code.replace(
        /<div className="space-y-6 animate-in fade-in duration-500">/,
        `<EnterprisePageShell
            title="Ağ Güven Monitörü (Trade Network Trust Layer)"
            description="Tüm B2B ağında anlık şüpheli işlemleri ve itibar (reputation) risklerini izleyin."
        >
        `
    );
    
    const headerRegex = /<div className="flex justify-between items-end">[\s\S]*?<\/div>\s*<\/div>/;
    code = code.replace(headerRegex, "");

    code = code.replace(
        />\s*<\/div>\s*\)\;/m,
        '>\n            </EnterprisePageShell>\n    );'
    );
    
    fs.writeFileSync(path, code);
    console.log("Upgraded trust-monitor");
}

upgradePlans();
upgradeTrustMonitor();
