const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', 'utf8');

const startMarker = '{/* EXECUTIVE HEADER STRIP (ENTERPRISE STANDARD) */}';
const endMarker = '{/* CONTENT AREA */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if(startIndex === -1 || endIndex === -1) {
    console.log("Markers not found");
    process.exit(1);
}

const originalLayoutFixed = `            {/* EXECUTIVE HEADER STRIP */}
            <div style={{
                background: 'var(--bg-panel, rgba(15, 23, 42, 0.6))',
                borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                padding: '24px 40px',
                position: 'sticky',
                top: 0,
                zIndex: 40
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Top Row: Back link & Title */}
                    <div className="flex justify-between items-center">
                        <Link href="/customers" style={{ color: 'var(--text-muted, #888)', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: 'color 0.2s' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Müşteri Merkezi
                        </Link>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setReconWizardOpen(true)}
                                className="btn"
                                style={{ background: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'white', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                            >
                                🤝 Mutabakat
                            </button>
                            <button
                                onClick={() => { setStatementType('summary'); setStatementOpen(true); }}
                                className="btn"
                                style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                📄 Özet Ekstre
                            </button>
                            <button
                                onClick={() => { setStatementType('detailed'); setStatementOpen(true); }}
                                className="btn"
                                style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                📑 Detaylı Ekstre
                            </button>
                            <button
                                onClick={() => router.push(\`/customers?edit=\${customer.id}\`)}
                                className="btn"
                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                ✏️ Düzenle
                            </button>
                        </div>
                    </div>

                    {/* Business/Profile Row */}
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        {/* Left: Avatar + Details */}
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '18px',
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '28px', fontWeight: '800', color: 'white',
                                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {val(customer.name, '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main, #fff)', letterSpacing: '-0.5px' }}>
                                    {val(customer.name)}
                                </h1>
                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted, #888)', fontSize: '13px', fontWeight: '500', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>🏷️</span> {val(customer.category?.name, 'Genel Müşteri')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📱</span> {val(customer.phone, 'Telefon Yok')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📧</span> {val(customer.email, 'E-posta Yok')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📍</span>
                                        {(() => {
                                            let addr = customer.address;
                                            if (customer.city || customer.district) {
                                                return \`\${customer.district ? customer.district + ' / ' : ''}\${customer.city || ''}\`;
                                            }
                                            try {
                                                if (addr && typeof addr === 'string' && addr.trim().startsWith('{')) {
                                                    const parsed = JSON.parse(addr);
                                                    return \`\${parsed.district ? parsed.district : ''} \${parsed.city ? '/' + parsed.city : ''}\`;
                                                }
                                            } catch (e) { }
                                            return 'Adres Yok';
                                        })()}
                                    </span>
                                </div>
                                {services.length > 0 && services[0].plate && (
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setQrPlate(services[0].plate)}
                                            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            📱 Dijital Karne Müşteri Linki (QR)
                                        </button>
                                        <button
                                            onClick={() => {
                                                const plate = services[0].plate;
                                                const msg = \`Sayın \${customer.name}, \${plate} plakalı aracınızın servis işlemleri Periodya güvencesiyle kayıt altına alınmıştır. Dijital karnenize buradan ulaşabilirsiniz: https://www.periodya.com/vehicle/\${plate}\`;
                                                window.open(\`https://wa.me/\${customer.phone?.replace(/\\s/g, '').replace(/^0/, '90')}?text=\${encodeURIComponent(msg)}\`, '_blank');
                                            }}
                                            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.3)', color: '#25D366', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            💬 WhatsApp'tan Karne Gönder
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Balance & Financial Health */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                FİNANSAL DURUM (NET BAKİYE)
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                <div style={{ fontSize: '36px', fontWeight: '900', color: balanceColor, lineHeight: '1', letterSpacing: '-1px' }}>
                                    {Math.abs(balance).toLocaleString()} <span style={{ fontSize: '24px', opacity: 0.8 }}>₺</span>
                                </div>
                                <div style={{
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    background: balance > 0 ? 'rgba(239, 68, 68, 0.1)' : balance < 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card, rgba(255,255,255,0.05))',
                                    color: balanceColor,
                                    border: \`1px solid \${balance > 0 ? 'rgba(239, 68, 68, 0.3)' : balance < 0 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color, rgba(255,255,255,0.1))'}\`,
                                    textTransform: 'uppercase'
                                }}>
                                    {balance > 0 ? 'Borçlu (Risk)' : balance < 0 ? 'Alacaklı' : 'Kapalı (Dengeli)'}
                                </div>
                            </div>

                            {/* DUE INSTALLMENTS SUMMARY */}
                            {(overdueInstallments.length > 0 || upcomingInstallments.length > 0) && (
                                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {overdueInstallments.length > 0 && (
                                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase' }}>VADESİ GEÇEN</span>
                                            <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: '900', fontFamily: 'monospace' }}>{overdueAmount.toLocaleString('tr-TR')} ₺</span>
                                        </div>
                                    )}
                                    {upcomingInstallments.length > 0 && (
                                        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', padding: '8px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase' }}>YAKLAŞAN VADE (30 GÜN)</span>
                                            <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '900', fontFamily: 'monospace' }}>{upcomingAmount.toLocaleString('tr-TR')} ₺</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {portfolioChecks > 0 && (
                                <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', marginTop: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span>⚠️</span> Portföyde {portfolioChecks.toLocaleString()} ₺ değerinde aktif çek/senet var.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* PREMIUM ACTION BAR */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <Link href={\`/payment?amount=\${Math.abs(balance)}&title=Tahsilat-\${encodeURIComponent(val(customer.name))}&ref=CUST-\${customer.id}&type=collection\`}
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.05)', color: '#10b981', padding: '24px', borderRadius: '20px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                        className="hover:-translate-y-1 hover:bg-emerald-500/10 hover:border-emerald-500/40"
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💰</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', marginBottom: '4px', color: 'var(--text-main, #e2e8f0)' }}>TAHSİLAT AL</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>Cari hesaptan nakit / kk ile ödeme al</div>
                        </div>
                    </Link>

                    <Link href={\`/payment?type=payment&title=Ödeme-\${encodeURIComponent(val(customer.name))}&ref=CUST-\${customer.id}\`}
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', padding: '24px', borderRadius: '20px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        className="hover:-translate-y-1 hover:bg-red-500/10 hover:border-red-500/40"
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💸</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', marginBottom: '4px', color: 'var(--text-main, #e2e8f0)' }}>ÖDEME YAP</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>Firmadan nakit / kk ile ödeme çıkışı yap</div>
                        </div>
                    </Link>

                    <Link href={\`/?selectedCustomer=\${encodeURIComponent(val(customer.name, ''))}\`}
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6', padding: '24px', borderRadius: '20px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                        className="hover:-translate-y-1 hover:bg-blue-500/10 hover:border-blue-500/40"
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--bg-panel, rgba(59, 130, 246, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🛒</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', marginBottom: '4px', color: 'var(--text-main, #e2e8f0)' }}>SATIŞ YAP (POS)</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>Bu müşteriye terminalde yeni satış başlat</div>
                        </div>
                    </Link>
                </div>

                {/* GROUPED NAVIGATION & FILTERS - CENTERED TABS (SUPPLIER STYLE) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-center gap-4 mt-2">
                    <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                                {[
                                    { id: 'all', label: 'Hareketler' },
                                    { id: 'sales', label: 'Faturalar' },
                                    { id: 'payments', label: 'İşlemler' },
                                    { id: 'offers', label: 'Teklifler' },
                                    { id: 'documents', label: 'Dosyalar' },
                                    { id: 'warranties', label: 'Garantiler' },
                                    { id: 'services', label: 'Servis' },
                                    { id: 'checks', label: 'Vadeler' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id as any);
                                            if (tab.id === 'documents') fetchDocuments();
                                            if (tab.id === 'services') fetchServices();
                                        }}
                                        className={activeTab === tab.id
                                            ? "px-4 py-2 text-[13px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[6px] transition-all"
                                            : "px-4 py-2 text-[13px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[6px]"}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT AREA */}`;

content = content.substring(0, startIndex) + originalLayoutFixed + content.substring(endIndex + endMarker.length);
// Also fix table backgrounds back to original
content = content.replace(/background: 'rgba\(8,10,15, 0\.4\)'/g, "background: 'var(--bg-panel, rgba(15, 23, 42, 0.4))'");

fs.writeFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', content);
console.log("SUCCESS");
