const fs = require('fs');

const filePath = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The best way is to locate the START and END markers exactly.
const markers = [
    { start: '{/* WARRANTY START MODAL */}', end: '            {/* CHECK / SENET ADD MODAL */}' },
    { start: '{/* CHECK / SENET ADD MODAL */}', end: '            {/* OTP COMPLIANCE MODAL */}' },
    { start: '{/* OTP COMPLIANCE MODAL */}', end: '            {/* TRANSACTION TYPE SELECT MODAL (NEW) */}' }
];

const newWarrantyStr = `{/* WARRANTY START MODAL */}
            {warrantyModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <EnterpriseCard className="w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scroll animate-in zoom-in-95 duration-200 shadow-2xl border-blue-500/30 text-left">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                                <span className="text-2xl">🛡️</span> Garanti Başlat
                            </h3>
                            <button
                                onClick={() => setWarrantyModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <EnterpriseSelect
                                label="FATURA SEÇİMİ (SATIN ALMA KAYDI)"
                                value={newWarranty.invoiceId}
                                onChange={(e) => setNewWarranty({ ...newWarranty, invoiceId: e.target.value, productId: '', productName: '' })}
                            >
                                <option value="">İlgili faturayı seçiniz...</option>
                                {customerInvoices.map((inv: any) => (
                                    <option key={inv.id} value={inv.id}>{inv.number} - {inv.date} ({inv.total} ₺)</option>
                                ))}
                            </EnterpriseSelect>

                            {newWarranty.invoiceId && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <EnterpriseSelect
                                        label="ÜRÜN SEÇİMİ"
                                        value={newWarranty.productId}
                                        onChange={(e) => {
                                            const inv = customerInvoices.find((i: any) => i.id.toString() === newWarranty.invoiceId);
                                            const prodItem = inv?.items.find((p: any) => (p.productId || p.id || '').toString() === e.target.value);
                                            let pName = prodItem?.name || '';
                                            if (!pName && prodItem?.productId) {
                                                const realProd = products.find((p: any) => p.id === prodItem.productId);
                                                if (realProd) pName = realProd.name;
                                            }
                                            setNewWarranty({ ...newWarranty, productId: e.target.value, productName: pName });
                                        }}
                                    >
                                        <option value="">Garanti tanımlanacak ürünü seçin...</option>
                                        {customerInvoices.find((i: any) => i.id.toString() === newWarranty.invoiceId)?.items.map((p: any) => {
                                            let displayName = p.name;
                                            if (!displayName && p.productId) {
                                                const realProd = products.find((prod: any) => prod.id === p.productId);
                                                if (realProd) displayName = realProd.name;
                                            }
                                            return (
                                                <option key={p.productId || p.id || Math.random()} value={p.productId || p.id}>
                                                    {displayName || 'İsimsiz Ürün'}
                                                </option>
                                            );
                                        })}
                                    </EnterpriseSelect>
                                </div>
                            )}

                            <EnterpriseInput
                                label="SERİ NO (KADRO / ŞASİ NO)"
                                placeholder="Örn: CR12345678"
                                value={newWarranty.serialNo}
                                onChange={(e: any) => setNewWarranty({ ...newWarranty, serialNo: e.target.value })}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <EnterpriseSelect
                                    label="GARANTİ SÜRESİ"
                                    value={newWarranty.period}
                                    onChange={(e) => setNewWarranty({ ...newWarranty, period: e.target.value })}
                                >
                                    {(warrantyPeriods && warrantyPeriods.length > 0 ? warrantyPeriods : ['6 Ay', '1 Yıl', '2 Yıl', '3 Yıl', '5 Yıl']).map((p: any) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </EnterpriseSelect>

                                <EnterpriseInput
                                    label="BAŞLANGIÇ TARİHİ"
                                    type="date"
                                    value={newWarranty.startDate}
                                    onChange={(e: any) => setNewWarranty({ ...newWarranty, startDate: e.target.value })}
                                />
                            </div>

                            <EnterpriseButton
                                onClick={handleSaveWarranty}
                                disabled={isSavingWarranty || !newWarranty.invoiceId || !newWarranty.productId || !newWarranty.serialNo}
                                className="w-full h-14 mt-4 font-bold text-base bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSavingWarranty ? 'KAYDEDİLİYOR...' : 'SİSTEME KAYDET VE BAŞLAT'}
                            </EnterpriseButton>
                        </div>
                    </EnterpriseCard>
                </div>
            )}
`;

const newCheckStr = `{/* CHECK / SENET ADD MODAL */}
            {checkAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <EnterpriseCard className="w-full max-w-xl animate-in zoom-in-95 duration-200 shadow-2xl border-emerald-500/30 text-left">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                                <span className="text-2xl">📑</span> Yeni Evrak Ekle
                            </h3>
                            <button
                                onClick={() => setCheckAddModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-5">
                            <EnterpriseSelect
                                label="EVRAK TÜRÜ"
                                value={newCheckData.type}
                                onChange={(e) => setNewCheckData({ ...newCheckData, type: e.target.value })}
                            >
                                <option value="Alınan Çek">Müşteriden Alınan Çek</option>
                                <option value="Alınan Senet">Müşteriden Alınan Senet</option>
                                <option value="Müşteri Çeki / Cirolu">Müşteri Tarafından Cirolu Çek</option>
                            </EnterpriseSelect>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <EnterpriseInput
                                    label="TUTAR (₺)"
                                    placeholder="0,00"
                                    value={newCheckData.amount}
                                    onChange={(e: any) => setNewCheckData({ ...newCheckData, amount: formatCurrencyInput(e.target.value) })}
                                />
                                <EnterpriseInput
                                    label="VADE TARİHİ"
                                    type="date"
                                    value={newCheckData.dueDate}
                                    onChange={(e: any) => setNewCheckData({ ...newCheckData, dueDate: e.target.value })}
                                />
                            </div>

                            <EnterpriseInput
                                label="BANKA & ŞUBE (Senet ise boş bırakın)"
                                placeholder="Örn: Garanti Bankası / Beşiktaş Şb."
                                value={newCheckData.bank}
                                onChange={(e: any) => setNewCheckData({ ...newCheckData, bank: e.target.value })}
                            />

                            <EnterpriseInput
                                label="EVRAK/SERİ NO"
                                placeholder="Seri veya Fiş Numarası"
                                value={newCheckData.number}
                                onChange={(e: any) => setNewCheckData({ ...newCheckData, number: e.target.value })}
                            />

                            <EnterpriseInput
                                label="AÇIKLAMA (Opsiyonel)"
                                placeholder="Ek detay veya borçlu bilgisi"
                                value={newCheckData.description}
                                onChange={(e: any) => setNewCheckData({ ...newCheckData, description: e.target.value })}
                            />

                            <div className="flex flex-col gap-2 mt-2 p-5 border border-slate-200 dark:border-white/5 rounded-[20px] bg-slate-50 dark:bg-slate-800/30">
                                <label className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="text-lg">📸</span> EVRAK GÖRSELİ
                                </label>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    Evrakın ön yüzünün fotoğrafı.
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e: any) => {
                                        if (e.target.files?.[0]) setNewCheckData({ ...newCheckData, file: e.target.files[0] });
                                    }}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 cursor-pointer mt-2"
                                />
                            </div>

                            <EnterpriseButton
                                onClick={async () => {
                                    if (!newCheckData.amount || !newCheckData.dueDate || !newCheckData.number) {
                                        showError("Eksik Bilgi", "Lütfen Tutar, Vade Tarihi ve Evrak Numarasını girin.");
                                        return;
                                    }
                                    setIsSavingCheck(true);
                                    try {
                                        const res = await fetch('/api/financials/checks', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                type: newCheckData.type,
                                                number: newCheckData.number,
                                                bank: newCheckData.bank || 'Bilinmiyor',
                                                dueDate: newCheckData.dueDate,
                                                amount: parseCurrencyToFloat(newCheckData.amount),
                                                customerId: customer.id,
                                                description: newCheckData.description,
                                                branch: 'Merkez'
                                            })
                                        });

                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error || "Hata oluştu");
                                        if (data.check?.id && newCheckData.file) {
                                            const formData = new FormData();
                                            formData.append('file', newCheckData.file);
                                            await fetch(\`/api/financials/checks/\${data.check.id}/image\`, { method: 'POST', body: formData });
                                        }

                                        showSuccess("Evrak Kaydedildi", "Yeni çek/senet başarıyla portföye eklendi.");
                                        setCheckAddModalOpen(false);
                                        setNewCheckData({ type: 'Alınan Çek', number: '', bank: '', dueDate: '', amount: '', description: '', branch: 'Merkez', file: null });
                                        router.refresh();
                                    } catch (err: any) {
                                        showError("Hata", err.message);
                                    } finally {
                                        setIsSavingCheck(false);
                                    }
                                }}
                                disabled={isSavingCheck}
                                className="w-full h-14 mt-2 font-bold text-base bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {isSavingCheck ? 'KAYDEDİLİYOR...' : 'ONAYLA VE PORTFÖYE EKLE'}
                            </EnterpriseButton>
                        </div>
                    </EnterpriseCard>
                </div>
            )}
`;

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
            )}
`;

let newContent = content;

// Replace Warranty Modal
const wStart = newContent.indexOf(markers[0].start);
const wEnd = newContent.indexOf(markers[0].end, wStart);
if (wStart !== -1 && wEnd !== -1) {
    newContent = newContent.substring(0, wStart) + newWarrantyStr + "\\n" + newContent.substring(wEnd);
}

// Replace Check Add Modal
const cStart = newContent.indexOf(markers[1].start);
const cEnd = newContent.indexOf(markers[1].end, cStart);
if (cStart !== -1 && cEnd !== -1) {
    newContent = newContent.substring(0, cStart) + newCheckStr + "\\n" + newContent.substring(cEnd);
}

// Replace OTP Modal
const oStart = newContent.indexOf(markers[2].start);
const oEnd = newContent.indexOf(markers[2].end, oStart);
if (oStart !== -1 && oEnd !== -1) {
    newContent = newContent.substring(0, oStart) + newOtpStr + "\\n" + newContent.substring(oEnd);
}

fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Successfully replaced inner modal blocks!");
