const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/reports/page.tsx', 'utf8');

// 1. Refactor 'Son İşlemler'
const oldTransactionsBlockRegex = /\{\/\* Recent Transactions \*\/\}\s*<div className="bg-white dark:bg-\[\#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm rounded-2xl p-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const newTransactionsBlock = `{str_replace_recent_transactions}`;

const recentTransactionsTable = `
                            {/* Recent Transactions DataGrid */}
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-slate-100 dark:border-white/5">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Son Tamamlanan İşlemler</h3>
                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">İşlemlere tıklayarak detayına (Drill-down) inebilirsiniz.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                                <th className="p-4 whitespace-nowrap">Tarih</th>
                                                <th className="p-4 whitespace-nowrap">Tür</th>
                                                <th className="p-4 whitespace-nowrap">Açıklama / Kategori</th>
                                                <th className="p-4 whitespace-nowrap text-right">Tutar</th>
                                                <th className="p-4 whitespace-nowrap text-right">Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTransactions.map((tx: any, i) => (
                                                <tr key={i} className="group border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer" onClick={() => {
                                                    if(tx.type === 'Sales') router.push('/sales');
                                                    if(tx.type === 'Expense') router.push('/expenses');
                                                }}>
                                                    <td className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                        {new Date(tx.date).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={\`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider \${tx.type === 'Sales' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}\`}>
                                                            {tx.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{tx.description || 'Sistem İşlemi'}</div>
                                                        <div className="text-xs text-slate-400 font-semibold">{tx.category || '-'}</div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className={\`text-base font-black \${tx.type === 'Sales' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}\`}>
                                                            {tx.type === 'Sales' ? '+' : '-'}₺{Number(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button className="text-slate-400 group-hover:text-blue-500 transition-colors text-xs font-bold uppercase tracking-wider">İncele →</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {recentTransactions.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm font-semibold">Bu dönemde işlem kaydı bulunamadı.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}`;

content = content.replace(oldTransactionsBlockRegex, recentTransactionsTable);


// 2. Refactor 'Müşteriler' (Cari Bakiye Durumu)
const oldCustomersBlockRegex = /\{\/\* Customers Tab \*\/\}\s*\{activeTab === 'customers' && \([\s\S]*?\{activeTab === 'cashflow' && \(/;

const newCustomersTable = `
                    {/* Customers Tab */}
                    {activeTab === 'customers' && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Kritik Cari Bakiyeler</h3>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Sadece bakiyesi olan veya borcu bulunan müşteri (Cari) listesi. Detaylar için Drill-down özelliğini kullanın.</p>
                                    </div>
                                    <button onClick={() => router.push('/customers')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition-colors">
                                        Tüm Müşterileri Aç
                                    </button>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                                <th className="p-4 whitespace-nowrap">Müşteri / Cari Ünvan</th>
                                                <th className="p-4 whitespace-nowrap">İletişim</th>
                                                <th className="p-4 whitespace-nowrap">Durum Tipi</th>
                                                <th className="p-4 whitespace-nowrap text-right">Açık Bakiye</th>
                                                <th className="p-4 whitespace-nowrap text-right">Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topCustomers.map((customer: any, i: number) => {
                                                const balance = Number(customer.balance);
                                                return (
                                                <tr key={i} className="group border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer" onClick={() => router.push(\`/customers/\${customer.id}\`)}>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs">
                                                                {customer.name?.slice(0, 2).toUpperCase() || 'CR'}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{customer.name}</div>
                                                                <div className="text-xs text-slate-400 font-semibold">{customer.taxNumber ? \`VKN: \${customer.taxNumber}\` : 'Kayıtsız VKN'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                        {customer.phone || 'Girilmemiş'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={\`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider \${balance > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : balance < 0 ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}\`}>
                                                            {balance > 0 ? 'Alacaklıyız' : balance < 0 ? 'Borçluyuz' : 'Dengede'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className={\`text-base font-black \${balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : balance < 0 ? 'text-red-600 dark:text-red-500' : 'text-slate-900 dark:text-white'}\`}>
                                                            {balance > 0 ? '+' : ''}₺{balance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button className="text-slate-400 group-hover:text-blue-500 transition-colors text-xs font-bold uppercase tracking-wider">Cari Ekstresi →</button>
                                                    </td>
                                                </tr>
                                            )})}
                                            {topCustomers.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm font-semibold">Aktif cari veya bakiye kaydı bulunamadı.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cash Flow Tab */}
                    {activeTab === 'cashflow' && (`;

content = content.replace(oldCustomersBlockRegex, newCustomersTable);

fs.writeFileSync('src/app/(app)/reports/page.tsx', content);
console.log("Grids refactored successfully.");
