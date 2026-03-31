const fs = require('fs');
const file = 'src/app/(app)/suppliers/[id]/SupplierDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

const startIndex = data.indexOf('{/* --- TEDARİKÇİ COMMAND CENTER (STICKY) --- */}');
const endIndex = data.indexOf('            {/* MAIN CONTENT AREA */}');

if (startIndex > -1 && endIndex > -1) {
    const replacement = `{/* --- TEDARİKÇİ COMMAND CENTER (STICKY) --- */}
            <EnterpriseCommandCenter 
                title={val(supplier.name)}
                backLink="/suppliers"
                backLabel="Tedarikçi Merkezi"
                avatarInitials={val(supplier.name, '?').charAt(0).toUpperCase()}
                avatarGradient="from-indigo-900 to-indigo-500"
                category={val(supplier.category, 'Genel Tedarikçi')}
                contact={{
                    phone: supplier.phone,
                    email: supplier.email,
                    address: (() => {
                        if (supplier.city || supplier.district) {
                            return \`\${supplier.district ? supplier.district + ' / ' : ''}\${supplier.city || ''}\`;
                        }
                        return supplier.address || 'Adres Yok';
                    })()
                }}
                balance={{
                    value: balance,
                    positiveLabel: 'Alacak',
                    negativeLabel: 'Borç',
                    neutralLabel: 'Dengeli',
                    positiveColor: 'text-emerald-600 dark:text-emerald-400',
                    negativeColor: 'text-red-600 dark:text-red-400'
                }}
                metrics={[
                    ...(portfolioChecks > 0 ? [{
                        label: 'Açık Çek/Senet',
                        value: \`\${portfolioChecks.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺\`,
                        icon: '🧾',
                        colorClass: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                    }] : [])
                ]}
                tabs={[
                    { group: 'İŞLEMLER', items: [{ id: 'all', label: 'Tümü' }] },
                    { group: 'FİNANS & EVRAK', items: [{ id: 'checks', label: 'Vadeler & Çekler' }] }
                ]}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as any)}
                actions={
                    <>
                        <Link 
                            href={\`/payment?type=payment&title=Ödeme-\${encodeURIComponent(val(supplier.name))}&ref=SUP-\${supplier.id}&amount=\${Math.abs(supplier.balance)}\`}
                            className="h-[36px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden sm:flex"
                        >
                            💸 Ödeme Çıkışı
                        </Link>
                        <button
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            + İç Alım Fişi
                        </button>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            🚀 Fatura Girişi
                        </button>
                        <button
                            onClick={() => setIsAdjustModalOpen(true)}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            ⚖️ Bakiye
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
                            onClick={() => router.push(\`/suppliers?edit=\${supplier.id}\`)}
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
    
    if (!newContent.includes('EnterpriseCommandCenter')) {
        newContent = newContent.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport EnterpriseCommandCenter from '@/components/ui/EnterpriseCommandCenter';");
    }
    
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Successfully refactored SupplierDetailClient.');
} else {
    console.log('Failed matching.', startIndex, endIndex);
}
