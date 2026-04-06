const fs = require('fs');

function fixTrustMonitor() {
    let path = 'src/app/(app)/admin/trust-monitor/page.tsx';
    if (!fs.existsSync(path)) return;
    let code = fs.readFileSync(path, 'utf8');

    if (!code.includes('import { EnterprisePageShell }')) {
        code = 'import { EnterprisePageShell } from "@/components/ui/enterprise";\\n' + code;
    }

    const startIdx = code.indexOf('<div className="min-h-screen bg-slate-50');
    const endDivIdx = code.lastIndexOf('</div>\\n        </div>\\n    );');
    
    if (startIdx !== -1) {
        // We just replace the entire top part with <EnterprisePageShell>
        code = code.replace(/<div className="min-h-screen bg-slate-50[\\s\\S]*?<\\/div>\\s*<\\/div>/, '<EnterprisePageShell title="Güven Monitörü (Trust Monitor)" description="Platformdaki tüm firmaların Network İtibar skorları ve algoritmik değerlendirmeleri.">');
        
        // Fix the closing tags at the bottom
        // Wait, line 112 was `</EnterprisePageShell>` which had no opening!
        // Because of line 112, let me just do a direct string replace for the opening ones to avoid regex issues.
        code = code.replace(
            '<div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-4 md:p-6 font-sans w-full pb-16 focus:outline-none">\\n            <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">\\n                {/* Header Section */}\\n                <div className="border-b border-slate-200 dark:border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">\\n                    <div>\\n                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">\\n                            <span className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg">🧠</span>\\n                            Güven Monitörü (Trust Monitor)\\n                        </h1>\\n                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 ml-14">\\n                            Platformdaki tüm firmaların Network İtibar skorları ve algoritmik değerlendirmeleri.\\n                        </p>\\n                    </div>\\n                </div>',
            '<EnterprisePageShell title="Güven Monitörü (Trust Monitor)" description="Platformdaki tüm firmaların Network İtibar skorları ve algoritmik değerlendirmeleri.">'
        );
        // Removing the leftover closing div tags if any
        code = code.replace('            </div>\\n            </EnterprisePageShell>', '            </EnterprisePageShell>');
        code = code.replace('                    </div>\\n                </div>\\n            </div>\\n            </EnterprisePageShell>', '                    </div>\\n                </div>\\n            </EnterprisePageShell>');
    }

    fs.writeFileSync(path, code, 'utf8');
}

fixTrustMonitor();
