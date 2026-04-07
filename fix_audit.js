const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/admin/audit-logs/page.tsx', 'utf-8');
code = code.replace(/<div className=\"bg-slate-50 dark:bg-\[#0f172a\] min-h-screen w-full font-sans pb-16\">/, '<EnterprisePageShell title=\"Denetim Kayýtlarý (Audit Logs)\" description=\"Platform genelindeki tüm veri mutasyonlarýný, oturum açma eylemlerini ve hassas iþlemleri izleyin.\" actions={<button onClick={() => fetchLogs()} disabled={isLoading} className=\"p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center\" title=\"Tabloyu Yenile\"><RefreshCw className={\w-5 h-5 \\} /></button>}>');

code = code.replace(/<div className=\"max-w-\[1600px\] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300\">[\s\S]*?{\/\* Filters \*\/}/m, '<div className=\"animate-in fade-in duration-300\">\\n                {/* Filters */}');

code = code.replace(/<\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*\);\r?\n}\r?\n?$/, '</div>\n        </EnterprisePageShell>\n    );\n}\n');

fs.writeFileSync('src/app/(app)/admin/audit-logs/page.tsx', code);
