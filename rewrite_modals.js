const fs = require('fs');

const filePath = "src/app/(app)/customers/[id]/CustomerDetailClient.tsx";
let content = fs.readFileSync(filePath, "utf-8");

// 1. Warranty Modal Replacement
const warrantyPattern = /\{\/\* WARRANTY START MODAL \*\/\}(.*?)\{warrantyModalOpen && \((.*?)\n\s*\}\n/gs;
const warrantyReplacement = `{/* WARRANTY START MODAL */}
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
                                {customerInvoices.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.number} - {inv.date} ({inv.total} ₺)</option>
                                ))}
                            </EnterpriseSelect>

                            {newWarranty.invoiceId && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <EnterpriseSelect
                                        label="ÜRÜN SEÇİMİ"
                                        value={newWarranty.productId}
                                        onChange={(e) => {
                                            const inv = customerInvoices.find(i => i.id.toString() === newWarranty.invoiceId);
                                            const prodItem = inv?.items.find((p) => (p.productId || p.id || '').toString() === e.target.value);
                                            let pName = prodItem?.name || '';
                                            if (!pName && prodItem?.productId) {
                                                const realProd = products.find(p => p.id === prodItem.productId);
                                                if (realProd) pName = realProd.name;
                                            }
                                            setNewWarranty({ ...newWarranty, productId: e.target.value, productName: pName });
                                        }}
                                    >
                                        <option value="">Garanti tanımlanacak ürünü seçin...</option>
                                        {customerInvoices.find(i => i.id.toString() === newWarranty.invoiceId)?.items.map((p) => {
                                            let displayName = p.name;
                                            if (!displayName && p.productId) {
                                                const realProd = products.find((prod) => prod.id === p.productId);
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
                                onChange={(e) => setNewWarranty({ ...newWarranty, serialNo: e.target.value })}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <EnterpriseSelect
                                    label="GARANTİ SÜRESİ"
                                    value={newWarranty.period}
                                    onChange={(e) => setNewWarranty({ ...newWarranty, period: e.target.value })}
                                >
                                    {(warrantyPeriods && warrantyPeriods.length > 0 ? warrantyPeriods : ['6 Ay', '1 Yıl', '2 Yıl', '3 Yıl', '5 Yıl']).map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </EnterpriseSelect>

                                <EnterpriseInput
                                    label="BAŞLANGIÇ TARİHİ"
                                    type="date"
                                    value={newWarranty.startDate}
                                    onChange={(e) => setNewWarranty({ ...newWarranty, startDate: e.target.value })}
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

// 2. Check Add Modal Replacement
const checkPattern = /\{\/\* CHECK \/ SENET ADD MODAL \*\/\}(.*?)\{checkAddModalOpen && \((.*?)\n\s*\}\n/gs;
const checkReplacement = `{/* CHECK / SENET ADD MODAL */}
            {checkAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <EnterpriseCard className="w-full max-w-xl animate-in zoom-in-95 duration-200 shadow-2xl border-emerald-500/30 text-left">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                                <span className="text-2xl">📑</span> Yeni Evrak (Çek/Senet)
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
                                    onChange={(e) => setNewCheckData({ ...newCheckData, amount: formatCurrencyInput(e.target.value) })}
                                />
                                <EnterpriseInput
                                    label="VADE TARİHİ"
                                    type="date"
                                    value={newCheckData.dueDate}
                                    onChange={(e) => setNewCheckData({ ...newCheckData, dueDate: e.target.value })}
                                />
                            </div>

                            <EnterpriseInput
                                label="BANKA & ŞUBE (Senet ise boş bırakın)"
                                placeholder="Örn: Garanti Bankası / Beşiktaş Şb."
                                value={newCheckData.bank}
                                onChange={(e) => setNewCheckData({ ...newCheckData, bank: e.target.value })}
                            />

                            <EnterpriseInput
                                label="EVRAK/SERİ NO"
                                placeholder="Seri veya Fiş Numarası"
                                value={newCheckData.number}
                                onChange={(e) => setNewCheckData({ ...newCheckData, number: e.target.value })}
                            />

                            <EnterpriseInput
                                label="AÇIKLAMA (Opsiyonel)"
                                placeholder="Ek detay veya borçlu bilgisi"
                                value={newCheckData.description}
                                onChange={(e) => setNewCheckData({ ...newCheckData, description: e.target.value })}
                            />

                            <div className="flex flex-col gap-2 mt-2 p-5 border border-slate-200 dark:border-white/5 rounded-[20px] bg-slate-50 dark:bg-slate-800/30">
                                <label className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="text-lg">📸</span> EVRAK GÖRSELİ YÜKLE
                                </label>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    Evrakın ön yüzünün net bir fotoğrafını yükleyiniz.
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setNewCheckData({ ...newCheckData, file: e.target.files[0] });
                                        }
                                    }}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-500/10 dark:file:text-emerald-400 dark:hover:file:bg-emerald-500/20 cursor-pointer mt-2"
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
                                            await fetch(\`/api/financials/checks/\${data.check.id}/image\`, {
                                                method: 'POST',
                                                body: formData
                                            });
                                        }

                                        showSuccess("Evrak Kaydedildi", "Yeni çek/senet başarıyla portföye eklendi.");
                                        setCheckAddModalOpen(false);
                                        setNewCheckData({ type: 'Alınan Çek', number: '', bank: '', dueDate: '', amount: '', description: '', branch: 'Merkez', file: null });
                                        router.refresh();
                                    } catch (err) {
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

// 3. OTP Modal Replacement
const otpPattern = /\{\/\* OTP COMPLIANCE MODAL \*\/\}(.*?)\{otpModalOpen && \((.*?)\n\s*\}\n/gs;
const otpReplacement = `{/* OTP COMPLIANCE MODAL */}
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
                                    <span className="font-bold text-[14px] text-amber-700 dark:text-amber-500">Güvenli E-İmza (OTP) Altyapısı</span>
                                    <span className="text-[12px] font-medium text-amber-600 dark:text-amber-400/80 leading-relaxed">
                                        Sistem alıcının <strong>{customer.phone || customer.email || 'iletişim adresine'}</strong> benzersiz imza linki iletecektir.
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
                                                showSuccess("Başarılı", "Müşteriye senet onayı (OTP) SMS ve Email bağlantıları iletildi.");
                                                setOtpModalOpen(false);
                                            } else {
                                                showError("Hata", data.error || "İmza zarfı oluşturulamadı.");
                                            }
                                        } catch (err) {
                                            showError("Hata", err.message);
                                        } finally {
                                            setIsSendingOtp(false);
                                        }
                                    }}
                                    disabled={isSendingOtp}
                                    className="w-full h-14 rounded-[20px] font-black tracking-wide text-[14px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 dark:text-slate-900 text-white border-none shadow-amber-500/30 shadow-lg disabled:opacity-70 hover:-translate-y-1 transition-all duration-300 flex justify-center items-center"
                                >
                                    {isSendingOtp ? 'GÖNDERİLİYOR...' : 'SMS & E-POSTA İLE ONAYA SUN'}
                                </button>

                                <button
                                    onClick={() => {
                                        window.open(\`/api/documents/senet?action=get-pdf&invoiceId=\${lastInvoice?.id || ''}\`, '_blank');
                                        setOtpModalOpen(false);
                                    }}
                                    className="w-full h-14 rounded-[20px] font-bold text-[14px] text-slate-600 dark:text-slate-300 bg-transparent border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center justify-center gap-2"
                                >
                                    🖨️ PDF OLARAK YAZDIR / GÖRÜNTÜLE
                                </button>
                            </div>
                        </div>
                    </EnterpriseCard>
                </div>
            )}
`;

content = content.replace(warrantyPattern, warrantyReplacement);
content = content.replace(checkPattern, checkReplacement);
content = content.replace(otpPattern, otpReplacement);

fs.writeFileSync(filePath, content, "utf-8");
console.log("Modals Successfully Replaced!");
