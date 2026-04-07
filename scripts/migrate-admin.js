const fs = require('fs');

const file = 'src/app/(app)/admin/audit-logs/page.tsx';
let code = fs.readFileSync(file, 'utf-8');

// The exact string we want to replace
const searchString = `<div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen w-full font-sans pb-16">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <ShieldAlert className="w-6 h-6 text-indigo-500" />
                            Denetim Kayıtları (Audit Logs)
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Platform genelindeki tüm veri mutasyonlarını, oturum açma eylemlerini ve hassas işlemleri izleyin.
                        </p>
                    </div>
                    <button
                        onClick={() => fetchLogs()}
                        disabled={isLoading}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Tabloyu Yenile"
                    >
                        <RefreshCw className={\`w-5 h-5 \${isLoading ? 'animate-spin text-indigo-500' : ''}\`} />
                    </button>
                </div>`;

const replaceString = `<EnterprisePageShell
            title="Denetim Kayıtları (Audit Logs)"
            description="Platform genelindeki tüm veri mutasyonlarını, oturum açma eylemlerini ve hassas işlemleri izleyin."
            actions={
                <button
                    onClick={() => fetchLogs()}
                    disabled={isLoading}
                    className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Tabloyu Yenile"
                >
                    <RefreshCw className={\`w-5 h-5 \${isLoading ? 'animate-spin text-indigo-500' : ''}\`} />
                </button>
            }
        >
            <div className="animate-in fade-in duration-300">`;

if (code.includes(searchString)) {
    code = code.replace(searchString, replaceString);
    code = code.replace(/            <\/div>\s*<\/div>\s*<\/div>\s*\);\s*}\s*$/s, '            </div>\n        </EnterprisePageShell>\n    );\n}\n');
    fs.writeFileSync(file, code);
    console.log('Fixed audit-logs');
} else {
    console.log('Not found');
}
