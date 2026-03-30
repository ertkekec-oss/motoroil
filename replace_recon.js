const fs = require('fs');

function injectReconNavigation(filePath, currentPath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');

    const ovalNavCode = `{/* Enterprise Level 10 Unified Oval Navigation */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 relative z-10 w-full bg-white dark:bg-[#0f172a] p-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar">
                        {[
                            { path: '/reconciliation', label: 'Açık Mutabakatlar' },
                            { path: '/reconciliation/list', label: 'Tüm Mutabakatlar' },
                            { path: '/reconciliation/disputes', label: 'İtiraz Yönetimi' }
                        ].map(tab => {
                            const isActive = '${currentPath}' === tab.path;
                            return (
                                <Link
                                    key={tab.path}
                                    href={tab.path}
                                    className={\`h-[38px] flex flex-row items-center px-5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all \${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300'}\`}
                                >
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>`;

    // Try finding the Top header which always has mb-8 and maybe ChevronLeft
    code = code.replace(
        /<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">[\s\S]*?(<div className="grid|<SoftContainer)/,
        ovalNavCode + "\n                $1"
    );
    
    // In case there is TopPills
    code = code.replace(
        /<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">[\s\S]*?<TopPills[^\/]+\/>/,
        ovalNavCode
    );

    fs.writeFileSync(filePath, code);
}

try { injectReconNavigation('src/app/(app)/reconciliation/page.tsx', '/reconciliation'); } catch(e){}
try { injectReconNavigation('src/app/(app)/reconciliation/list/page.tsx', '/reconciliation/list'); } catch(e){}
try { injectReconNavigation('src/app/(app)/reconciliation/disputes/page.tsx', '/reconciliation/disputes'); } catch(e){}

console.log('Injected Oval Navigation to Reconciliation Module.');
