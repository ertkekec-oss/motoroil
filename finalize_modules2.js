const fs = require('fs');

function finalizeWebsite() {
    let path = 'src/app/(app)/admin/website/page.tsx';
    if (!fs.existsSync(path)) return;
    let code = fs.readFileSync(path, 'utf8');

    // Simple string splits
    code = code.split('Ã–zellik 1').join('Özellik 1');
    code = code.split('AÃ§Ä±klama 1').join('Açıklama 1');
    code = code.split('Ã–zellik 2').join('Özellik 2');
    code = code.split('AÃ§Ä±klama 2').join('Açıklama 2');
    code = code.split('Ã–zellik 3').join('Özellik 3');
    code = code.split('AÃ§Ä±klama 3').join('Açıklama 3');
    code = code.split('Ã–zellik 4').join('Özellik 4');
    code = code.split('AÃ§Ä±klama 4').join('Açıklama 4');
    code = code.split('Ã–zellik 5').join('Özellik 5');
    code = code.split('AÃ§Ä±klama 5').join('Açıklama 5');
    code = code.split('Ã–zellik 6').join('Özellik 6');
    code = code.split('AÃ§Ä±klama 6').join('Açıklama 6');
    
    code = code.split('ğŸš€').join('🚀');
    code = code.split('âœ¨').join('✨');
    code = code.split('⚡').join('⚡'); // if it was mangled

    fs.writeFileSync(path, code, 'utf8');
    console.log("Fixed UTF-8 in website/page.tsx");
}

function finalizePayroll() {
    let path = 'src/app/(app)/admin/settings/payroll/page.tsx';
    if (!fs.existsSync(path)) return;
    let code = fs.readFileSync(path, 'utf8');

    if (!code.includes('EnterprisePageShell')) {
        let lastImportIndex = code.lastIndexOf('import ');
        let endOfLine = code.indexOf('\\n', lastImportIndex);
        if (endOfLine === -1) endOfLine = code.indexOf('\\r\\n', lastImportIndex) + 1;
        if (endOfLine !== -1) {
            code = code.slice(0, endOfLine + 1) + 'import { EnterprisePageShell } from "@/components/ui/enterprise";\\n' + code.slice(endOfLine + 1);
        } else {
            code = 'import { EnterprisePageShell } from "@/components/ui/enterprise";\\n' + code;
        }

        // We can just find the first <div className="max-w-[1600px]...
        const searchStr = '<div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">';
        code = code.replace(searchStr, '<EnterprisePageShell title="Bordro Politikaları" description="Hakediş ve kesinti kuralları.\\n"><div className="space-y-6">');
    }

    fs.writeFileSync(path, code, 'utf8');
    console.log("Finalized payroll/page.tsx");
}

finalizeWebsite();
finalizePayroll();
