const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

const startIndex = data.indexOf('{/* --- CARI COMMAND CENTER (STICKY) --- */}');
const endIndexStr = '{/* CONTENT AREA */}';
// The content area is preceded by `<div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-2">`
// So we want the end of the sticky header. Let's find the `</div>` just before the max-w-[1600px] wrapper.
// Actually, it's easier to just replace until `<div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-2">`

const endIndex = data.indexOf('<div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-2">');

if (startIndex > -1 && endIndex > -1) {
    const replacement = `{/* --- CARI COMMAND CENTER (STICKY) --- */}
            <EnterpriseCommandCenter 
                title={val(customer.name)}
                titleSuffix={services.length > 0 && services[0].plate ? (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[8px] text-[13px] font-black tracking-widest uppercase border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-1.5">
                        <span className="opacity-50">🚗</span> {services[0].plate}
                    </span>
                ) : undefined}
                backLink="/customers"
                backLabel="Müşteri Merkezi"
                avatarInitials={val(customer.name, '?').charAt(0).toUpperCase()}
                avatarGradient="from-blue-900 to-blue-500"
                contact={{
                    phone: customer.phone,
                    email: customer.email,
                    address: (() => {
                        if (customer.city || customer.district) {
                            return \`\${customer.district ? customer.district + ' / ' : ''}\${customer.city || ''}\`;
                        }
                        return customer.address || 'Adres Yok';
                    })()
                }}
                balance={{
                    value: balance,
                    positiveLabel: 'Borç',
                    negativeLabel: 'Alacak',
                    neutralLabel: 'Dengeli',
                    positiveColor: 'text-red-600 dark:text-red-400',
                    negativeColor: 'text-emerald-600 dark:text-emerald-400'
                }}
                metrics={[
                    ...(overdueInstallments.length > 0 ? [{
                        label: 'Vadesi Geçen',
                        value: \`\${overdueAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺\`,
                        icon: '⏳',
                        colorClass: 'bg-red-50 dark:bg-red-500/10 text-red-500'
                    }] : []),
                    ...(portfolioChecks > 0 ? [{
                        label: 'Açık Çek/Senet',
                        value: \`\${portfolioChecks.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺\`,
                        icon: '🧾',
                        colorClass: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                    }] : [])
                ]}
                tabs={[
                    { group: 'İŞLEMLER', items: [{ id: 'all', label: 'Tümü' }, { id: 'sales', label: 'Satış/Fatura' }, { id: 'payments', label: 'Finans' }] },
                    { group: 'RİSK & ONAY', items: [{ id: 'checks', label: 'Vadeler' }, { id: 'reconciliations', label: 'Mutabakat' }, { id: 'offers', label: 'Teklifler' }] },
                    { group: 'SERVİS', items: [{ id: 'warranties', label: 'Garantiler' }, { id: 'services', label: 'Servis' }, { id: 'documents', label: 'Dosyalar' }] }
                ]}
                activeTab={activeTab}
                onTabChange={(id) => { 
                    setActiveTab(id as any); 
                    if (id === 'documents') fetchDocuments(); 
                    if (id === 'services') fetchServices(); 
                }}
                tabRightElement={
                    <div className="relative w-full lg:w-[260px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Satır ve işlemlerde ara..."
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[8px] h-[36px] pl-9 pr-3 text-[12px] font-semibold outline-none focus:border-blue-500 shadow-sm transition-all text-slate-900 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                }
                actions={
                    <>
                        <Link 
                            href={\`/payment?amount=\${Math.abs(balance)}&title=Tahsilat-\${encodeURIComponent(val(customer.name))}&ref=CUST-\${customer.id}&type=collection\`}
                            className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                            <span>+</span> Tahsilat Al
                        </Link>
                        <Link 
                            href={\`/payment?type=payment&title=Ödeme-\${encodeURIComponent(val(customer.name))}&ref=CUST-\${customer.id}\`}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden sm:flex"
                        >
                            Ödeme Yap
                        </Link>
                        <Link 
                            href={\`/?selectedCustomer=\${encodeURIComponent(val(customer.name, ''))}\`}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden md:flex"
                        >
                            Satış Yap (POS)
                        </Link>
                        <button
                            onClick={() => setReconWizardOpen(true)}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            🤝 Mutabakat
                        </button>
                        <button
                            onClick={() => { setStatementType('summary'); setStatementOpen(true); }}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            📄 Özet Ekstre
                        </button>
                        <button
                            onClick={() => { setStatementType('detailed'); setStatementOpen(true); }}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            📑 Detaylı Ekstre
                        </button>
                        <button
                            onClick={() => router.push(\`/customers?edit=\${customer.id}\`)}
                            className="w-[36px] h-[36px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-500 rounded-[8px] flex items-center justify-center transition-colors shadow-sm hover:text-blue-600 hover:border-blue-200"
                            title="Düzenle"
                        >
                            ✏️
                        </button>
                    </>
                }
            />

            `;

    let newContent = data.substring(0, startIndex) + replacement + data.substring(endIndex);
    
    // Add import statement at top
    if (!newContent.includes('EnterpriseCommandCenter')) {
        newContent = newContent.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport EnterpriseCommandCenter from '@/components/ui/EnterpriseCommandCenter';");
    }
    
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Successfully refactored CustomerDetailClient.');
} else {
    console.log('Failed matching.', startIndex, endIndex);
}
