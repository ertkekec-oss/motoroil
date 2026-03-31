const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Add searchTerm state
data = data.replace(
    /const \[activeTab, setActiveTab\] = useState[^;]+;/,
    "const [searchTerm, setSearchTerm] = useState('');\n    const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'payments' | 'documents' | 'services' | 'warranties' | 'checks' | 'reconciliations' | 'offers'>('all');"
);

// 2. Replace filteredHistory logic
const newFilter = `    const filteredHistory = historyList.filter(item => {
        if (item.type === 'Vadelendirme') return false;

        let matchesTab = false;
        if (activeTab === 'all') matchesTab = true;
        else if (activeTab === 'sales') matchesTab = (item.type === 'Fatura' || item.type === 'Satış' || item.type === 'İrsaliye');
        else if (activeTab === 'payments') matchesTab = (item.type === 'Tahsilat' || item.type === 'Ödeme' || item.type === 'Gider');
        else matchesTab = true;

        if (!matchesTab) return false;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const dateMatch = (item.date || '').toLowerCase().includes(term);
            const descMatch = (item.desc || '').toLowerCase().includes(term);
            const typeMatch = (item.type || '').toLowerCase().includes(term);
            if (!dateMatch && !descMatch && !typeMatch) return false;
        }

        return true;
    });`;

data = data.replace(/    const filteredHistory = historyList\.filter\(item => \{[\s\S]*?    \}\);/, newFilter);

// 3. Update table rendering wrapper
data = data.replace(
    /                    \) : \(\r?\n                        <div style=\{\{ overflowX: 'auto' \}\}>\r?\n                            <table style=\{\{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' \}\}>/,
    `                    ) : (
                        <div className="flex flex-col">
                            {/* HEADER WITH SEARCH */}
                            <div className="p-4 md:px-6 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color,rgba(255,255,255,0.05))]">
                                <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 dark:text-white">Kayıt Listesi</h3>
                                <div className="relative w-full md:w-[320px]">
                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '13px' }}>🔍</span>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Kayıt ara..."
                                        className="w-full pl-9 pr-4 h-[38px] bg-slate-50 dark:bg-black/20 rounded-full border border-slate-200 dark:border-white/10 text-[12px] font-bold outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-white shadow-sm"
                                    />
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>`
);

// 4. Also fix closing tags for the new flex flex-col table div
data = data.replace(
    /                                <\/table>\r?\n\s+<\/div>\r?\n\s+\)\}\r?\n\s+<\/div>/,
    `                                </table>
                            </div>
                        </div>
                    )}
                </div>`
);

fs.writeFileSync(file, data);
console.log('Done!');
