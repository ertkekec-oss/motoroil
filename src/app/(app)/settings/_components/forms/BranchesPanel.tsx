import React from 'react';
import {
    EnterpriseCard,
    EnterpriseField,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseButton,
    EnterpriseSectionHeader
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation, loop akışı → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// Cam/Glass efektleri, bg-white/5 gibi standart dışı tailwind utility'leri temizlendi.
// ─────────────────────────────────────────────────────────────────────────────

export default function BranchesPanel(props: any) {
    const {
        Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs,
        handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions,
        showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId,
        startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches,
        products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput,
        addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties,
        vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent,
        saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab,
        appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign,
        setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign,
        deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch,
        setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF,
        totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings,
        saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings,
        updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses,
        setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa,
        kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa,
        handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods,
        updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings,
        setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch,
        editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults,
        updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser,
        addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions,
        permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs,
        isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions,
        showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab,
        campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading,
        currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest
    } = props;

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl">
            <EnterpriseSectionHeader
                icon="🏪"
                title="Şubeler ve Dijital Arşiv"
                subtitle="Firma şubelerini, depoları, belgeleri ve kasa/banka hesaplarını bu alandan yönetin."
            />

            {/* Add/Edit Branch Form */}
            <EnterpriseCard className="mb-8">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        {editingBranchId ? '✏️ Şube Düzenleme Modu' : '➕ Yeni Şube / Depo Ekle'}
                    </h3>
                    {editingBranchId && (
                        <EnterpriseButton
                            variant="secondary"
                            onClick={() => {
                                setEditingBranchId(null);
                                setNewBranch({ name: '', type: 'Şube', city: '', district: '', address: '', phone: '', manager: '', status: 'Aktif' });
                            }}
                        >
                            Vazgeç
                        </EnterpriseButton>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                    <EnterpriseField label="TÜR">
                        <EnterpriseSelect value={newBranch.type} onChange={(e: any) => setNewBranch({ ...newBranch, type: e.target.value })}>
                            <option>Şube</option>
                            <option>Depo</option>
                            <option>Merkez Ofis</option>
                            <option>Home Office</option>
                        </EnterpriseSelect>
                    </EnterpriseField>

                    <EnterpriseField label="ŞUBE ADI">
                        <EnterpriseInput
                            value={newBranch.name}
                            onChange={(e: any) => setNewBranch({ ...newBranch, name: e.target.value })}
                            placeholder="Örn: İzmir Bornova Şube"
                        />
                    </EnterpriseField>

                    <EnterpriseField label="ŞEHİR">
                        <EnterpriseSelect
                            value={newBranch.city}
                            onChange={(e: any) => setNewBranch({ ...newBranch, city: e.target.value, district: '' })}
                        >
                            <option value="">Şehir Seçin...</option>
                            {TURKISH_CITIES.map((city: string) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </EnterpriseSelect>
                    </EnterpriseField>

                    <EnterpriseField label="İLÇE">
                        <EnterpriseSelect
                            value={newBranch.district}
                            onChange={(e: any) => setNewBranch({ ...newBranch, district: e.target.value })}
                            disabled={!newBranch.city}
                        >
                            <option value="">İlçe Seçin...</option>
                            {(TURKISH_DISTRICTS[newBranch.city] || []).map((district: string) => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </EnterpriseSelect>
                    </EnterpriseField>

                    <EnterpriseField label="DURUM">
                        <EnterpriseSelect value={newBranch.status} onChange={(e: any) => setNewBranch({ ...newBranch, status: e.target.value })}>
                            <option>Aktif</option>
                            <option>Tadilat</option>
                            <option>Kapalı</option>
                        </EnterpriseSelect>
                    </EnterpriseField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <EnterpriseField label="AÇIK ADRES">
                        <EnterpriseInput
                            value={newBranch.address}
                            onChange={(e: any) => setNewBranch({ ...newBranch, address: e.target.value })}
                            placeholder="Mahalle, Cadde, No..."
                        />
                    </EnterpriseField>

                    <EnterpriseField label="TELEFON">
                        <EnterpriseInput
                            value={newBranch.phone}
                            onChange={(e: any) => setNewBranch({ ...newBranch, phone: e.target.value })}
                            placeholder="0212..."
                        />
                    </EnterpriseField>

                    <EnterpriseField label="YÖNETİCİ">
                        <EnterpriseInput
                            value={newBranch.manager}
                            onChange={(e: any) => setNewBranch({ ...newBranch, manager: e.target.value })}
                            placeholder="Ad Soyad"
                        />
                    </EnterpriseField>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                    <EnterpriseButton variant={editingBranchId ? "secondary" : "primary"} onClick={addBranch}>
                        {editingBranchId ? '💾 Değişiklikleri Kaydet' : '➕ Sisteme Yeni Şube Ekle'}
                    </EnterpriseButton>
                </div>
            </EnterpriseCard>

            {/* Branch List */}
            <div className="space-y-4 mb-10">
                {branches.map((branch: any) => (
                    <EnterpriseCard key={branch.id} className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider">
                                        {branch.type || 'Şube'}
                                    </span>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{branch.name}</h3>
                                    {branch.status !== 'Aktif' && (
                                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded text-[10px] font-bold uppercase">
                                            {branch.status}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                    <span className="flex items-center gap-1">📍 {branch.city}{branch.district ? ` / ${branch.district}` : ''}</span>
                                    <span className="flex items-center gap-1">📞 {branch.phone || '-'}</span>
                                    <span className="flex items-center gap-1">👤 Yön: {branch.manager || '-'}</span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                    🏠 {branch.address || '-'}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                                <div className="flex items-center gap-2">
                                    <EnterpriseButton variant="secondary" onClick={() => editBranch(branch)} className="flex-1 md:flex-none">
                                        ✏️ Düzenle
                                    </EnterpriseButton>
                                    <EnterpriseButton variant="danger" onClick={() => deleteBranch(branch.id)} className="flex-1 md:flex-none">
                                        🗑️ Sil
                                    </EnterpriseButton>
                                </div>
                                <EnterpriseButton
                                    variant={selectedBranchDocs === branch.id ? "primary" : "secondary"}
                                    onClick={() => setSelectedBranchDocs(selectedBranchDocs === branch.id ? null : branch.id)}
                                >
                                    {selectedBranchDocs === branch.id ? '📂 Evrakları Kapat' : `📁 Evrak Yönetimi (${branch.docs || 0})`}
                                </EnterpriseButton>
                            </div>
                        </div>

                        {/* Evraklar */}
                        {selectedBranchDocs === branch.id && (
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">📂 Şube Dijital Arşivi</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Kira Kontratı, Ruhsat, Vergi Levhası vb. belgeleri yükleyin.</p>
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            id={`file-upload-${branch.id}`}
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, branch.id)}
                                        />
                                        <label htmlFor={`file-upload-${branch.id}`} className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-sm transition-colors">
                                            ⬆ Yeni Belge Yükle
                                        </label>
                                    </div>
                                </div>

                                {isDocsLoading ? (
                                    <div className="flex justify-center p-8 space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(!branchDocs || branchDocs.length === 0) && (
                                            <div className="col-span-1 md:col-span-2 text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed text-slate-500 text-sm">
                                                Bu şubeye ait belge bulunmamaktadır.
                                            </div>
                                        )}
                                        {branchDocs?.map((file: any) => (
                                            <div key={file.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="text-2xl shrink-0">{file.fileType.includes('pdf') ? '📄' : '🖼️'}</div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate" title={file.fileName}>{file.fileName}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                            {new Date(file.uploadedAt).toLocaleDateString('tr-TR')} • {(file.fileSize / 1024).toFixed(1)} KB
                                                        </div>
                                                    </div>
                                                </div>
                                                <EnterpriseButton variant="danger" onClick={() => deleteBranchDoc(file.id, branch.id)} className="h-8 w-8 !p-0 shrink-0">
                                                    🗑️
                                                </EnterpriseButton>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </EnterpriseCard>
                ))}
            </div>

            {/* KASA & BANKA YÖNETİMİ (Revamped) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                {/* SOL PANEL: ÖDEME YÖNTEMLERİ (Anasayfa Butonları) */}
                <EnterpriseCard className="flex flex-col h-full bg-white dark:bg-[#0F172A]">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">🔘 Ödeme Yöntemi Butonları</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hızlı işlem (POS/Nakit) butonlarını tanımlayın.</p>
                        </div>
                        <EnterpriseButton
                            variant={showKasaDefinitions ? "secondary" : "primary"}
                            onClick={() => setShowKasaDefinitions(!showKasaDefinitions)}
                        >
                            {showKasaDefinitions ? 'KAPAT' : '+ YENİ BUTON'}
                        </EnterpriseButton>
                    </div>

                    {showKasaDefinitions && (
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <EnterpriseField label="BUTON ADI">
                                    <EnterpriseInput
                                        value={newPaymentMethod.label}
                                        onChange={(e: any) => setNewPaymentMethod({ ...newPaymentMethod, label: e.target.value })}
                                        placeholder="Nakit, Bonus, Havale..."
                                    />
                                </EnterpriseField>
                                <EnterpriseField label="İŞLEM TİPİ">
                                    <EnterpriseSelect
                                        value={newPaymentMethod.type}
                                        onChange={(e: any) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as any })}
                                    >
                                        <option value="cash">Nakit (Kasa)</option>
                                        <option value="card">Kredi Kartı / POS</option>
                                        <option value="transfer">Havale / EFT</option>
                                    </EnterpriseSelect>
                                </EnterpriseField>
                            </div>
                            <div className="flex items-center gap-3">
                                <EnterpriseButton variant="primary" onClick={addPaymentMethodDefinition} className="flex-1">
                                    {editingPaymentMethodId ? 'GÜNCELLE' : 'EKLE'}
                                </EnterpriseButton>
                                {editingPaymentMethodId && (
                                    <EnterpriseButton variant="secondary" onClick={() => {
                                        setEditingPaymentMethodId(null);
                                        setNewPaymentMethod({ label: '', type: 'cash', icon: '💰', linkedKasaId: '' });
                                    }}>
                                        İptal
                                    </EnterpriseButton>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                        {(paymentMethods || []).map((pm: any) => (
                            <div key={pm.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl group hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-xl shadow-sm">
                                        {pm.icon || '💳'}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{pm.label}</div>
                                        <div className="text-[10px] text-slate-500 font-bold lowercase">TİP: {pm.type}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <EnterpriseButton variant="secondary" onClick={() => startEditingPaymentMethod(pm)} className="!px-3 !h-9">✏️</EnterpriseButton>
                                    <EnterpriseButton variant="danger" onClick={() => removePaymentMethodDefinition(pm.id)} className="!px-3 !h-9">×</EnterpriseButton>
                                </div>
                            </div>
                        ))}

                        {/* Sabit Veresiye Butonu */}
                        <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl relative overflow-hidden">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-800/50 rounded-lg flex items-center justify-center text-xl shadow-sm text-blue-600">
                                    📖
                                </div>
                                <div>
                                    <div className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider z-10 relative">VERESİYE</div>
                                    <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-bold lowercase z-10 relative">Sistem Tarafından Sabitlenmiştir</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </EnterpriseCard>

                {/* SAĞ PANEL: KASA & BANKA HESAPLARI */}
                <EnterpriseCard className="flex flex-col h-full bg-white dark:bg-[#0F172A]">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">🏛️ Kasa & Banka Hesapları</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gerçek para giriş-çıkışı yapılan hesaplar.</p>
                        </div>
                        <EnterpriseButton
                            variant={showKasaModal ? "secondary" : "primary"}
                            onClick={() => {
                                setEditingKasa(null);
                                setNewKasa({ name: '', type: 'Nakit', branch: 'Merkez', balance: 0 });
                                setShowKasaModal(!showKasaModal);
                            }}
                        >
                            {showKasaModal ? 'KAPAT' : '+ YENİ HESAP'}
                        </EnterpriseButton>
                    </div>

                    {showKasaModal && (
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className="sm:col-span-2">
                                    <EnterpriseField label="HESAP ADI">
                                        <EnterpriseInput
                                            value={newKasa.name}
                                            onChange={(e: any) => setNewKasa({ ...newKasa, name: e.target.value })}
                                            placeholder="Örn: Merkez Nakit, Garanti Bankası vb."
                                        />
                                    </EnterpriseField>
                                </div>
                                <EnterpriseField label="TİPİ">
                                    <EnterpriseSelect
                                        value={newKasa.type}
                                        onChange={(e: any) => setNewKasa({ ...newKasa, type: e.target.value })}
                                    >
                                        {(kasaTypes || []).map((t: string) => <option key={t} value={t}>{t}</option>)}
                                    </EnterpriseSelect>
                                </EnterpriseField>
                                <EnterpriseField label="ŞUBE">
                                    <EnterpriseSelect
                                        value={newKasa.branch}
                                        onChange={(e: any) => setNewKasa({ ...newKasa, branch: e.target.value })}
                                    >
                                        <option value="Global">Küresel (Tüm Şubeler)</option>
                                        {(contextBranches || []).map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                                    </EnterpriseSelect>
                                </EnterpriseField>

                                {!editingKasa && (
                                    <div className="sm:col-span-2">
                                        <EnterpriseField label="AÇILIŞ BAKİYESİ">
                                            <EnterpriseInput
                                                type="number"
                                                value={newKasa.balance}
                                                onChange={(e: any) => setNewKasa({ ...newKasa, balance: Number(e.target.value) })}
                                                placeholder="0.00"
                                            />
                                        </EnterpriseField>
                                    </div>
                                )}
                            </div>
                            <EnterpriseButton
                                variant={editingKasa ? "secondary" : "primary"}
                                onClick={handleSaveKasa}
                                disabled={isProcessingKasa}
                                className="w-full"
                            >
                                {isProcessingKasa ? 'İŞLENİYOR...' : (editingKasa ? '💾 GÜNCELLE' : '✅ HESABI OLUŞTUR')}
                            </EnterpriseButton>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                        {(kasalar || []).map((k: any) => (
                            <div key={k.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl group hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-sm font-black text-slate-700 dark:text-slate-300 shadow-sm">
                                        {k.type.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase">{k.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-bold text-slate-500 uppercase">{k.branch || 'Merkez'}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">{k.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="text-sm font-black text-slate-900 dark:text-white mb-1">₺{(Number(k.balance) || 0).toLocaleString()}</div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all h-5 items-center">
                                        <button onClick={() => startEditingKasa(k)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline px-1">Düzenle</button>
                                        <button onClick={() => handleDeleteKasa(String(k.id))} className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline px-1">Sil</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </EnterpriseCard>

            </div>
        </div>
    );
}
