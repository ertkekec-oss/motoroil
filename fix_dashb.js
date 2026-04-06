const fs = require('fs');

function fixFinanceAndDashboard() {
    let pathFin = 'src/app/(app)/admin/platform-finance/page.tsx';
    if (fs.existsSync(pathFin)) {
        let code = fs.readFileSync(pathFin, 'utf8');

        // Check if import exists
        if (!code.includes('import { EnterprisePageShell }')) {
            code = 'import { EnterprisePageShell } from "@/components/ui/enterprise";\\n' + code;
        }

        // Replace wrapper start
        code = code.replace(
            /<div className="bg-slate-50 min-h-screen dark:bg-\\[#0f172a\\] pb-16 w-full font-sans">[\\s\\S]*?<h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">\\s*Platform Finans & B2B Gelir Tablosu\\s*<\\/h1>\\s*<p className="text-sm text-slate-600 dark:text-slate-400">\\s*Tüm ağın \\(Network\\) toplam dönen hacmi, komisyonlar ve aktif Emanet\\s*\\(Escrow\\) büyüklüğü.\\s*<\\/p>\\s*<\\/div>\\s*<div className="text-right">[\\s\\S]*?<\\/div>\\s*<\\/div>/m,
            '<EnterprisePageShell title="Platform Finans & B2B Gelir Tablosu" description="Tüm ağın (Network) toplam dönen hacmi, komisyonlar ve aktif Emanet (Escrow) büyüklüğü.">'
        );

        // Replace wrapper end
        code = code.replace('            </EnterprisePageShell>\\n        </div>', '        </EnterprisePageShell>');

        fs.writeFileSync(pathFin, code, 'utf8');
    }

    let pathDash = 'src/app/(app)/admin/dashboard/page.tsx';
    if (fs.existsSync(pathDash)) {
        let code = fs.readFileSync(pathDash, 'utf8');

        // Check if import exists
        if (!code.includes('import { EnterprisePageShell }')) {
            code = 'import { EnterprisePageShell } from "@/components/ui/enterprise";\\n' + code;
        }

        // Replace wrapper start
        code = code.replace(
            /<div className="min-h-screen bg-\\[#F8FAFC\\] dark:bg-\\[#0f172a\\] text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans w-full focus:outline-none">[\\s\\S]*?{/* SECTION 1: Status Banner */}/,
            '<EnterprisePageShell title="Masaüstü Admin" description="Platform sağlık durumu ve ağ istatistikleri.">\\n                        {/* SECTION 1: Status Banner */}'
        );
        
        // Ensure no stray EnterprisePageShell tag with incorrect brackets exists
        code = code.replace('            </EnterprisePageShell>\\n        </div>', '            </EnterprisePageShell>');
        code = code.replace('        </div>\\n    );\\n}', '        </EnterprisePageShell>\\n    );\\n}');
        code = code.replace('</EnterprisePageShell>\\n</EnterprisePageShell>', '</EnterprisePageShell>');

        fs.writeFileSync(pathDash, code, 'utf8');
    }
}

fixFinanceAndDashboard();
