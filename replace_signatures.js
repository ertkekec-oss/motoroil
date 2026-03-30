const fs = require('fs');

function injectOvalNavigation(filePath, currentPath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');

    const ovalNavCode = `{/* Enterprise Level 10 Unified Oval Navigation */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 relative z-10 w-full bg-white dark:bg-[#0f172a] p-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar">
                        {[
                            { path: '/signatures', label: 'İmza Panosu' },
                            { path: '/signatures/inbox', label: 'Gelen Talepler' },
                            { path: '/signatures/envelopes', label: 'Zarflar' },
                            { path: '/signatures/pending', label: 'Bekleyenler' },
                            { path: '/signatures/completed', label: 'Tamamlananlar' }
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
                    <div>
                        <Link
                            href="/signatures/new"
                            className="h-[38px] px-6 flex flex-row items-center gap-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm whitespace-nowrap"
                        >
                            + YENİ ZARF
                        </Link>
                    </div>
                </div>`;

    // Signatures/page.tsx has TopPills
    if (filePath.includes('signatures/page.tsx')) {
        code = code.replace(
            /<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">[\s\S]*?<TopPills[^\/]+\/>/,
            ovalNavCode
        );
    } else {
        // inbox, completed, etc.
        code = code.replace(
            /<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
            ovalNavCode
        );
    }

    fs.writeFileSync(filePath, code);
}

try { injectOvalNavigation('src/app/(app)/signatures/page.tsx', '/signatures'); } catch(e){}
try { injectOvalNavigation('src/app/(app)/signatures/inbox/page.tsx', '/signatures/inbox'); } catch(e){}
try { injectOvalNavigation('src/app/(app)/signatures/completed/page.tsx', '/signatures/completed'); } catch(e){}
try { injectOvalNavigation('src/app/(app)/signatures/pending/page.tsx', '/signatures/pending'); } catch(e){}
try { injectOvalNavigation('src/app/(app)/signatures/envelopes/page.tsx', '/signatures/envelopes'); } catch(e){}

console.log('Injected Oval Navigation to Signatures Module.');
