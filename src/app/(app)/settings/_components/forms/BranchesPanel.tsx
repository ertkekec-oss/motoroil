import React from 'react';

export default function BranchesPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div>
                        <h2 >Şubeler ve Dijital Arşiv</h2>

                        {/* Add/Edit Branch Form */}
                        <div className="flex flex-col gap-6 p-8 mb-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" >
                            <div className="flex justify-between items-center mb-4">
                                <h3 >
                                    {editingBranchId ? '✏️ Şube Düzenleme Modu' : '➕ Yeni Şube / Depo Ekle'}
                                </h3>
                                {editingBranchId && (
                                    <button onClick={() => { setEditingBranchId(null); setNewBranch({ name: '', type: 'Şube', city: '', district: '', address: '', phone: '', manager: '', status: 'Aktif' }); }} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" >Vazgeç</button>
                                )}
                            </div>

                            <div >
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">TÜR</label>
                                    <select value={newBranch.type} onChange={e => setNewBranch({ ...newBranch, type: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm">
                                        <option>Şube</option>
                                        <option>Depo</option>
                                        <option>Merkez Ofis</option>
                                        <option>Home Office</option>
                                    </select>
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">ŞUBE ADI</label>
                                    <input type="text" value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm" placeholder="Örn: İzmir Bornova Şube" />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">ŞEHİR</label>
                                    <select
                                        value={newBranch.city}
                                        onChange={e => setNewBranch({ ...newBranch, city: e.target.value, district: '' })}
                                        className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm"
                                    >
                                        <option value="">Şehir Seçin...</option>
                                        {TURKISH_CITIES.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">İLÇE</label>
                                    <select
                                        value={newBranch.district}
                                        onChange={e => setNewBranch({ ...newBranch, district: e.target.value })}
                                        disabled={!newBranch.city}
                                        className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm"
                                    >
                                        <option value="">İlçe Seçin...</option>
                                        {(TURKISH_DISTRICTS[newBranch.city] || []).map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">DURUM</label>
                                    <select value={newBranch.status} onChange={e => setNewBranch({ ...newBranch, status: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm">
                                        <option>Aktif</option>
                                        <option>Tadilat</option>
                                        <option>Kapalı</option>
                                    </select>
                                </div>
                            </div>

                            <div >
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">AÇIK ADRES</label>
                                    <input type="text" value={newBranch.address} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm" placeholder="Mahalle, Cadde, No..." />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">TELEFON</label>
                                    <input type="text" value={newBranch.phone} onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm" placeholder="0212..." />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">YÖNETİCİ</label>
                                    <input type="text" value={newBranch.manager} onChange={e => setNewBranch({ ...newBranch, manager: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm" placeholder="Ad Soyad" />
                                </div>
                            </div>

                            <button onClick={addBranch} className={`btn w-full ${editingBranchId ? 'btn-warning' : 'bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors'}`} >
                                {editingBranchId ? '💾 Değişiklikleri Kaydet (Güncelle)' : '➕ Sisteme Yeni Şube Ekle'}
                            </button>
                        </div>

                        {/* Branch List */}
                        <div className="flex-col gap-4">
                            {branches.map(branch => (
                                <div key={branch.id} className="p-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-slide-up" >
                                    <div className="flex justify-between items-center" >
                                        <div className="flex-col gap-1">
                                            <div >
                                                <span >
                                                    {branch.type || 'Şube'}
                                                </span>
                                                <h3 >{branch.name}</h3>
                                                {branch.status !== 'Aktif' && <span >{branch.status}</span>}
                                            </div>
                                            <div className="text-muted" >
                                                <span>📍 {branch.city}{branch.district ? ` / ${branch.district}` : ''}</span>
                                                <span>📞 {branch.phone}</span>
                                                <span>👤 Yon: {branch.manager || '-'}</span>
                                            </div>
                                            <div className="text-muted" >
                                                🏠 {branch.address}
                                            </div>
                                        </div>

                                        <div className="flex-col gap-2" >
                                            <div className="flex-center gap-2">
                                                <button onClick={() => editBranch(branch)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" >✏️ Düzenle</button>
                                                <button onClick={() => deleteBranch(branch.id)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" >🗑️ Sil</button>
                                            </div>
                                            <button
                                                onClick={() => setSelectedBranchDocs(selectedBranchDocs === branch.id ? null : branch.id)}
                                                className={`btn ${selectedBranchDocs === branch.id ? 'bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors' : 'btn-outline'}`}
                                                
                                            >
                                                {selectedBranchDocs === branch.id ? '📂 Evrakları Kapat' : `📁 Evrak Yönetimi (${branch.docs})`}
                                            </button>
                                        </div>
                                    </div>

                                    {selectedBranchDocs === branch.id && (
                                        <div className="animate-fade-in" >
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-muted" >📂 Şube Dijital Arşivi <span >(Kira Kontratı, Ruhsat vb.)</span></h4>
                                                <div>
                                                    <input
                                                        type="file"
                                                        id={`file-upload-${branch.id}`}
                                                        className="hidden"
                                                        onChange={(e) => handleFileUpload(e, branch.id)}
                                                    />
                                                    <label htmlFor={`file-upload-${branch.id}`} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors" >
                                                        ⬆ Yeni Belge Yükle
                                                    </label>
                                                </div>
                                            </div>
                                            {isDocsLoading ? (
                                                <div >Yükleniyor...</div>
                                            ) : (
                                                <div className="grid-cols-2 gap-4">
                                                    {branchDocs.length === 0 && <div className="col-span-2 text-center text-muted" >Belge bulunmamaktadır.</div>}
                                                    {branchDocs.map((file, idx) => (
                                                        <div key={file.id} className="flex justify-between items-center" >
                                                            <div className="flex-center gap-3">
                                                                <div >{file.fileType.includes('pdf') ? '📄' : '🖼️'}</div>
                                                                <div>
                                                                    <div >{file.fileName}</div>
                                                                    <div >{new Date(file.uploadedAt).toLocaleDateString('tr-TR')} • {(file.fileSize / 1024).toFixed(1)} KB</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => deleteBranchDoc(file.id, branch.id)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" >🗑️</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* KASA & BANKA YÖNETİMİ (Revamped) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 mb-8">

                            {/* SOL PANEL: ÖDEME YÖNTEMLERİ (Anasayfa Butonları) */}
                            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold flex items-center gap-2">🔘 Ödeme Yöntemi Butonları</h3>
                                        <p className="text-[10px] text-muted">Anasayfadaki hızlı işlem butonlarını tanımlayın.</p>
                                    </div>
                                    <button onClick={() => setShowKasaDefinitions(!showKasaDefinitions)} className="btn btn-xs bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors">
                                        {showKasaDefinitions ? 'KAPAT' : '+ YENİ BUTON'}
                                    </button>
                                </div>

                                {showKasaDefinitions && (
                                    <div className="p-4 bg-black/40 border-b border-white/5 animate-fade-in">
                                        <div className="flex flex-col gap-3 mb-4">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="form-group">
                                                    <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">Buton Adı</label>
                                                    <input value={newPaymentMethod.label} onChange={e => setNewPaymentMethod({ ...newPaymentMethod, label: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs" placeholder="Nakit, Bonus, Havale..." />
                                                </div>
                                                <div className="form-group">
                                                    <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">İşlem Tipi</label>
                                                    <select value={newPaymentMethod.type} onChange={e => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as any })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs">
                                                        <option value="cash">Nakit (Kasa)</option>
                                                        <option value="card">Kredi Kartı / POS</option>
                                                        <option value="transfer">Havale / EFT</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={addPaymentMethodDefinition} className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors btn-sm flex-1 font-bold">
                                                    {editingPaymentMethodId ? 'GÜNCELLE' : 'EKLE'}
                                                </button>
                                                {editingPaymentMethodId && <button onClick={() => { setEditingPaymentMethodId(null); setNewPaymentMethod({ label: '', type: 'cash', icon: '💰', linkedKasaId: '' }); }} className="px-6 h-[44px] rounded-xl font-bold text-sm bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-none border border-transparent flex items-center justify-center gap-2 btn-sm">İptal</button>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4">
                                    <div className="grid grid-cols-1 gap-2">
                                        {(paymentMethods || []).map(pm => (
                                            <div key={pm.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/10 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl p-2 bg-white/5 rounded-lg">{pm.icon}</span>
                                                    <div>
                                                        <div className="text-xs font-black uppercase tracking-wider">{pm.label}</div>
                                                        <div className="text-[9px] text-muted lowercase opacity-60">tip: {pm.type}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => startEditingPaymentMethod(pm)} className="text-primary p-2 hover:bg-blue-600 hover:bg-blue-700 text-white shadow-sm/20 rounded-lg">✏️</button>
                                                    <button onClick={() => removePaymentMethodDefinition(pm.id)} className="text-danger p-2 hover:bg-danger/20 rounded-lg">×</button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center p-3 bg-blue-600 hover:bg-blue-700 text-white shadow-sm/10 border border-primary/20 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl p-2 bg-white/5 rounded-lg">📖</span>
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-wider">VERESİYE</div>
                                                    <div className="text-[9px] text-primary lowercase opacity-60">sistem tarafından sabitlenmiştir</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SAĞ PANEL: KASA & BANKA HESAPLARI */}
                            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold flex items-center gap-2">🏛️ Kasa & Banka Hesapları</h3>
                                        <p className="text-[10px] text-muted">Gerçek para giriş-çıkışı yapılan hesaplar.</p>
                                    </div>
                                    <button onClick={() => { setEditingKasa(null); setNewKasa({ name: '', type: 'Nakit', branch: 'Merkez', balance: 0 }); setShowKasaModal(!showKasaModal); }} className="btn btn-xs btn-secondary">
                                        {showKasaModal ? 'KAPAT' : '+ YENİ HESAP'}
                                    </button>
                                </div>

                                {showKasaModal && (
                                    <div className="p-4 bg-black/40 border-b border-white/5 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="form-group col-span-2">
                                                <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">Hesap Adı</label>
                                                <input value={newKasa.name} onChange={e => setNewKasa({ ...newKasa, name: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm" placeholder="Örn: Merkez Nakit, Garanti Bankası vb." />
                                            </div>
                                            <div className="form-group">
                                                <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">Tipi</label>
                                                <select value={newKasa.type} onChange={e => setNewKasa({ ...newKasa, type: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs">
                                                    {(kasaTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">Şube</label>
                                                <select value={newKasa.branch} onChange={e => setNewKasa({ ...newKasa, branch: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs">
                                                    <option value="Global">Küresel (Tüm Şubeler)</option>
                                                    {(contextBranches || []).map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                                                </select>
                                            </div>
                                            {!editingKasa && (
                                                <div className="form-group col-span-2">
                                                    <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">Açılış Bakiyesi</label>
                                                    <input type="number" value={newKasa.balance} onChange={e => setNewKasa({ ...newKasa, balance: Number(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm" placeholder="0.00" />
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={handleSaveKasa} disabled={isProcessingKasa} className="btn btn-secondary w-full font-bold">
                                            {isProcessingKasa ? 'İŞLENİYOR...' : (editingKasa ? 'GÜNCELLE' : 'HESABI OLUŞTUR')}
                                        </button>
                                    </div>
                                )}

                                <div className="p-4">
                                    <div className="flex flex-col gap-2">
                                        {(kasalar || []).map(k => (
                                            <div key={k.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex-center text-secondary font-black text-xs">
                                                            {k.type.substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black uppercase text-white/90">{k.name}</div>
                                                            <div className="flex items-center gap-2 opacity-60">
                                                                <span className="text-[9px] border border-white/10 px-1 rounded">{k.branch || 'Merkez'}</span>
                                                                <span className="text-[9px] uppercase">{k.type}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-black text-secondary">₺{(Number(k.balance) || 0).toLocaleString()}</div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all mt-1">
                                                            <button onClick={() => startEditingKasa(k)} className="text-primary text-[10px] hover:underline">Düzenle</button>
                                                            <button onClick={() => handleDeleteKasa(String(k.id))} className="text-danger text-[10px] hover:underline">Sil</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
    );
}
