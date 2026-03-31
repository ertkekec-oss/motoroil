const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Add searchTerm
data = data.replace(
    /const \[activeTab, setActiveTab\] = useState[^;]+;/,
    "const [searchTerm, setSearchTerm] = useState('');\n    const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'payments' | 'documents' | 'services' | 'warranties' | 'checks' | 'reconciliations' | 'offers'>('all');"
);

// 2. Add filter
const originalFilter = "    const filteredHistory = historyList.filter(item => {\n        if (item.type === 'Vadelendirme') return false;\n        if (activeTab === 'all') return true;\n        if (activeTab === 'sales') return item.type === 'Fatura' || item.type === 'Satış' || item.type === 'İrsaliye';\n        if (activeTab === 'payments') return item.type === 'Tahsilat' || item.type === 'Ödeme' || item.type === 'Gider';\n        return true;\n    });";

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

data = data.replace(originalFilter, newFilter);

// 3. Update table rendering start
const tableStartOld = `                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-panel, rgba(15, 23, 42, 0.4))', color: 'var(--text-muted, #888)', fontSize: '11px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>`;

const tableStartNew = `                    ) : (
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
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-panel, rgba(15, 23, 42, 0.4))', color: 'var(--text-muted, #888)', fontSize: '11px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>`;

data = data.replace(tableStartOld, tableStartNew);


// 4. Close the flex-col div properly, only finding the exact end of the history table.
const endOfHistoryTableOld = `                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}`;

const endOfHistoryTableNew = `                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        </div>
                    )}`;

data = data.replace(endOfHistoryTableOld, endOfHistoryTableNew);

fs.writeFileSync(file, data);
console.log('Fixed properly');
