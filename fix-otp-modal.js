const fs = require('fs');

const filePath = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldModal = `{/* OTP COMPLIANCE MODAL */}
            {otpModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ width: '560px', padding: '40px', borderRadius: '24px', background: 'var(--bg-panel, #0f172a)', border: '1px solid rgba(245, 158, 11, 0.4)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                        <div className="flex-between mb-8 pb-4" style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'var(--text-main, white)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '24px' }}>✍️</span> Periodya Trust & Compliance
                            </h3>
                            <button onClick={() => setOtpModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #888)', fontSize: '28px', cursor: 'pointer', transition: 'color 0.2s' }} className="hover:text-white">&times;</button>
                        </div>

                        <div className="flex-col gap-4">
                            <p style={{ fontSize: '15px', color: 'var(--text-muted, #aaa)', lineHeight: '1.6' }}>
                                Müşteriye senet onayı için OTP (Tek Kullanımlık Şifre) bağlantısı gönderebilir veya doğrudan senedi yazdırabilirsiniz.
                            </p>
                            
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '24px' }}>🛡️</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', color: '#fbbf24', fontSize: '14px', marginBottom: '4px' }}>Güvenli E-İmza (OTP) Altyapısı</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted, #aaa)', lineHeight: '1.4' }}>Sistem alıcının <strong>{customer.phone || customer.email || 'iletişim adresine'}</strong> benzersiz imza linki iletecektir.</div>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    setIsSendingOtp(true);
                                    try {
                                        const res = await fetch(\`/api/documents/senet?action=send-otp&invoiceId=\${lastInvoice?.id || ''}\`);
                                        const data = await res.json();
                                        if (data.success) {
                                            showSuccess("Başarılı", "Müşteriye senet onayı (OTP) SMS ve Email bağlantıları iletildi.");
                                            setOtpModalOpen(false);
                                        } else {
                                            showError("Hata", data.error || "İmza zarfı oluşturulamadı.");
                                        }
                                    } catch (err: any) {
                                        showError("Hata", err.message);
                                    } finally {
                                        setIsSendingOtp(false);
                                    }
                                }}
                                disabled={isSendingOtp}
                                style={{ marginTop: '24px', padding: '18px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.2) 100%)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: '800', fontSize: '15px', cursor: isSendingOtp ? 'wait' : 'pointer' }}
                            >
                                {isSendingOtp ? 'GÖNDERİLİYOR...' : 'SMS & E-POSTA İLE ONAYA SUN'}
                            </button>

                            <button
                                onClick={() => {
                                    window.open(\`/api/documents/senet?action=get-pdf&invoiceId=\${lastInvoice?.id || ''}\`, '_blank');
                                    setOtpModalOpen(false);
                                }}
                                style={{ marginTop: '12px', padding: '18px', borderRadius: '12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'white', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
                                className="hover:bg-white/10"
                            >
                                SENEDİ YAZDIR / GÖRÜNTÜLE
                            </button>
                        </div>
                    </div>
                </div>
            )}`;

const newOtpStr = `{/* OTP COMPLIANCE MODAL */}
            {otpModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <EnterpriseCard className="w-full max-w-lg animate-in zoom-in-95 duration-200 shadow-2xl border-amber-500/30 text-left">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                                <span className="text-2xl">✍️</span> Trust & Compliance
                            </h3>
                            <button
                                onClick={() => setOtpModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <p className="text-[14px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed m-0 px-2 lg:px-0">
                                Müşteriye senet onayı için OTP (Tek Kullanımlık Şifre) bağlantısı gönderebilir veya doğrudan senedi yazdırabilirsiniz.
                            </p>
                            
                            <div className="flex items-center gap-4 p-4 rounded-[16px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                <span className="text-3xl shrink-0">🛡️</span>
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-[14px] text-amber-700 dark:text-amber-500">Güvenli E-İmza (OTP)</span>
                                    <span className="text-[12px] font-medium text-amber-600 dark:text-amber-400/80 leading-relaxed">
                                        Sistem alıcının iletişim adresine imza linki iletecektir.
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mt-2">
                                <button
                                    onClick={async () => {
                                        setIsSendingOtp(true);
                                        try {
                                            const res = await fetch(\`/api/documents/senet?action=send-otp&invoiceId=\${lastInvoice?.id || ''}\`);
                                            const data = await res.json();
                                            if (data.success) {
                                                showSuccess("Başarılı", "Müşteriye bağlantılar iletildi.");
                                                setOtpModalOpen(false);
                                            } else {
                                                showError("Hata", data.error || "Oluşturulamadı.");
                                            }
                                        } catch (err: any) {
                                            showError("Hata", err.message);
                                        } finally {
                                            setIsSendingOtp(false);
                                        }
                                    }}
                                    disabled={isSendingOtp}
                                    className="w-full h-14 rounded-[20px] font-black tracking-wide text-[14px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none shadow-amber-500/30 shadow-lg disabled:opacity-70 hover:-translate-y-1 transition-all duration-300 flex justify-center items-center"
                                >
                                    {isSendingOtp ? 'GÖNDERİLİYOR...' : 'SMS & E-POSTA İLE ONAYA SUN'}
                                </button>

                                <button
                                    onClick={() => {
                                        window.open(\`/api/documents/senet?action=get-pdf&invoiceId=\${lastInvoice?.id || ''}\`, '_blank');
                                        setOtpModalOpen(false);
                                    }}
                                    className="w-full h-14 rounded-[20px] font-bold text-[14px] text-slate-600 dark:text-slate-300 bg-transparent border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    🖨️ PDF OLARAK YAZDIR / GÖRÜNTÜLE
                                </button>
                            </div>
                        </div>
                    </EnterpriseCard>
                </div>
            )}`;

if (content.includes(oldModal)) {
    content = content.replace(oldModal, newOtpStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully replaced OTP Modal inline strings!");
} else {
    // If exact string doesn't match spacing, try slicing
    const start = content.indexOf('{/* OTP COMPLIANCE MODAL */}');
    const end = content.lastIndexOf('            )}');
    // If it's the last modal in the returned JSX, maybe it's right before </EnterpriseCard> or </div>
    if (start !== -1) {
        // Find the closure for the modal check
        const firstParen = content.indexOf('(', start);
        let depth = 1;
        let p = firstParen + 1;
        while(p < content.length && depth > 0) {
            if (content[p] === '(') depth++;
            if (content[p] === ')') depth--;
            p++;
        }
        
        let actualEnd = p;
        if (content[actualEnd] === '}') actualEnd++;
        
        content = content.substring(0, start) + newOtpStr + "\\n" + content.substring(actualEnd);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Successfully replaced via bracket matching!");
    } else {
        console.log("Could not find OTP modal text at all!");
    }
}
