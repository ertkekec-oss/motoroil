const fs = require('fs');

let file = 'src/app/(app)/customers/page.tsx';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('isBulkBranchModal')) {
    c = c.replace(
        "const [bulkCategory, setBulkCategory] = useState('');",
        "const [bulkCategory, setBulkCategory] = useState('');\n    const [isBulkBranchModal, setIsBulkBranchModal] = useState(false);\n    const [bulkBranch, setBulkBranch] = useState('');"
    );

    c = c.replace(
        "const handleBulkCategoryUpdate = async",
        `const handleBulkBranchUpdate = async () => {
        if (!bulkBranch || selectedIds.length === 0) return;
        try {
            const res = await fetch('/api/customers/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_branch', customerIds: selectedIds, data: { branch: bulkBranch } })
            });
            const data = await res.json();
            if (data.success) {
                setIsBulkBranchModal(false);
                setSelectedIds([]);
                window.location.reload();
            }
        } catch {}
    };

    const handleBulkCategoryUpdate = async`
    );

    c = c.replace(
        `className={\`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors \${isLight ? 'bg-white border text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}\`}
                            >
                                Sınıf Ata
                            </button>`,
        `className={\`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors \${isLight ? 'bg-white border text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}\`}
                            >
                                Sınıf Ata
                            </button>
                            <button
                                onClick={() => setIsBulkBranchModal(true)}
                                className={\`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors \${isLight ? 'bg-white border text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}\`}
                            >
                                Şube Ata
                            </button>`
    );

    c = c.replace(
        '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Bakiye</th>',
        '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Şube</th>\n                                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Bakiye</th>'
    );

    // List view column Add
    c = c.replace(
        /<td className="px-5 py-3 align-middle text-\[12px\] font-semibold text-slate-600 dark:text-slate-400">\s*<div className={`font-semibold text-\[14px\] \$\{effectiveBalance > 0/g,
        `<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                            <span className={\`px-2 py-1 text-[11px] font-medium border rounded-[6px] inline-block \${isLight ? 'bg-white border-blue-200 text-blue-700 shadow-sm' : 'bg-blue-900/20 border-blue-800 text-blue-300'}\`}>
                                                {cust.branch || 'Merkez'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                            <div className={\`font-semibold text-[14px] \${effectiveBalance > 0`
    );

    // Grid View Card Add
    c = c.replace(
        /\{cust\.customerClass \|\| cust\.category \|\| 'Genel'\}\s*<\/span>\s*<\/div>/g,
        `{cust.customerClass || cust.category || 'Genel'}
                                            </span>
                                            <span className={\`px-2 py-1 text-[10px] font-semibold border rounded-[6px] \${isLight ? 'bg-white border-blue-200 text-blue-700 shadow-sm' : 'bg-blue-900/20 border-blue-800 text-blue-300'}\`}>
                                                {cust.branch || 'Merkez'}
                                            </span>
                                        </div>`
    );

    // Inject modal UI HTML
    c = c.replace(
        /\{isBulkCategoryModal && \([\s\S]*?<\/div>\s*\)\}/,
        match => match + `\n
            {isBulkBranchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]">
                    <div className={\`w-full max-w-[400px] rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 \${cardClass} p-6\`}>
                        <h3 className={\`text-[16px] font-bold mb-4 \${textValueClass}\`}>Toplu Şube Ata</h3>
                        <p className={\`text-[12px] mb-4 \${textLabelClass}\`}>
                            Seçili {selectedIds.length} müşteri için şube seçin:
                        </p>
                        <select
                            value={bulkBranch}
                            onChange={(e) => setBulkBranch(e.target.value)}
                            className={\`w-full px-3 py-2.5 rounded-[12px] text-[13px] border outline-none mb-6 \${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}\`}
                        >
                            <option value="">Seçiniz...</option>
                            {(branches || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                            <option value="Merkez">Merkez</option>
                        </select>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setIsBulkBranchModal(false)} className={\`px-5 py-2.5 rounded-full text-[12px] font-semibold transition-colors \${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'}\`}>İptal</button>
                            <button onClick={handleBulkBranchUpdate} className={\`px-6 py-2.5 rounded-full text-[12px] font-bold text-white transition-colors shadow-sm bg-blue-600 hover:bg-blue-700\`}>Onayla</button>
                        </div>
                    </div>
                </div>
            )}`
    )

    fs.writeFileSync(file, c);
    console.log("Patched GUI!");
} else {
    console.log("Already patched.");
}
