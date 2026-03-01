import React from 'react';

export default function DefinitionsListPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div className="animate-fade-in-up" >

                        <div >

                            {/* SIDEBAR */}
                            <div className="bg-white dark:bg-[#111827] rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all-dark" >
                                <h3 >TANIMLAR</h3>
                                {[
                                    { id: 'brands', label: 'Markalar', icon: '🏷️', desc: 'Ürün markaları' },
                                    { id: 'prod_cat', label: 'Ürün Kategorileri', icon: '📂', desc: 'Stok grupları' },
                                    { id: 'cust_class', label: 'Cari Sınıfları', icon: '👥', desc: 'Müşteri tipleri' },
                                    { id: 'supp_class', label: 'Tedarikçi Sınıfları', icon: '🏭', desc: 'Tedarikçi tipleri' },
                                    { id: 'warranties', label: 'Garanti Süreleri', icon: '🛡️', desc: 'Garanti seçenekleri' },
                                    { id: 'vehicle_types', label: 'Taşıt Türleri', icon: '🛵', desc: 'Araç tipleri' },
                                    { id: 'payment_methods', label: 'Ödeme Yöntemleri', icon: '💳', desc: 'Kasa ve banka hesapları', highlight: true }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setDefinitionTab(t.id); setNewItemInput(''); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 14px', borderRadius: '12px',
                                            border: '1px solid',
                                            borderColor: definitionTab === t.id ? 'var(--primary)' : 'transparent',
                                            background: definitionTab === t.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            color: definitionTab === t.id ? 'white' : "#64748B",
                                            textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                    >
                                        <span >{t.icon}</span>
                                        <div className="flex-col">
                                            <span >{t.label}</span>
                                            <span >{t.desc}</span>
                                        </div>
                                        {definitionTab === t.id && (
                                            <div  />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* MAIN CONTENT Area */}
                            <div className="flex-col gap-6" >

                                {/* Header & Input */}
                                <div className="bg-white dark:bg-[#111827] rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all p-6">
                                    <h2 >
                                        {definitionTab === 'brands' && 'Marka Tanımları'}
                                        {definitionTab === 'prod_cat' && 'Ürün Kategorileri'}
                                        {definitionTab === 'cust_class' && 'Cari Sınıfları'}
                                        {definitionTab === 'supp_class' && 'Tedarikçi Sınıfları'}
                                        {definitionTab === 'warranties' && 'Garanti Seçenekleri'}
                                        {definitionTab === 'vehicle_types' && 'Taşıt Türleri'}
                                        {definitionTab === 'payment_methods' && 'Ödeme Yöntemleri'}
                                    </h2>
                                    <p className="text-muted mb-6" >
                                        Bu liste genel sistemde seçilebilir seçenekler olarak görünecektir.
                                    </p>

                                    <div className="flex gap-4 items-end">
                                        <div >
                                            <label >YENİ EKLE</label>
                                            <div className="flex gap-2">
                                                {/* Payment Method Type Selector */}
                                                {definitionTab === 'payment_methods' && (
                                                    <select
                                                        value={newPaymentMethod.type}
                                                        onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as any })}
                                                        style={{
                                                            padding: '14px', borderRadius: '12px', backgroundColor: "transparent",
                                                            border: '1px solid var(--border-light)', color: 'white', fontWeight: 'bold', width: '140px'
                                                        }}
                                                    >
                                                        <option value="cash">Nakit</option>
                                                        <option value="card">Kredi Kartı</option>
                                                        <option value="transfer">Havale/EFT</option>
                                                    </select>
                                                )}

                                                <input
                                                    type="text"
                                                    placeholder={definitionTab === 'payment_methods' ? "Hesap Adı (örn: Akbank)" : "Yeni değer yazın..."}
                                                    value={newItemInput}
                                                    onChange={e => setNewItemInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            if (definitionTab === 'payment_methods') {
                                                                // Use the local newPaymentMethod state + input
                                                                const id = Math.random().toString(36).substr(2, 9);
                                                                const icon = newPaymentMethod.type === 'cash' ? '💵' : (newPaymentMethod.type === 'card' ? '💳' : '🏦');
                                                                const newVal = {
                                                                    id,
                                                                    label: newItemInput || 'Yeni Hesap',
                                                                    type: newPaymentMethod.type,
                                                                    icon,
                                                                    linkedKasaId: ''
                                                                };
                                                                // Manual update call
                                                                const updated = [...paymentMethods, newVal];
                                                                updatePaymentMethods(updated).then(() => {
                                                                    setNewItemInput('');
                                                                    if (showSuccess) showSuccess('Başarılı', 'Ödeme yöntemi eklendi.');
                                                                }).catch(() => {
                                                                    if (showError) showError('Hata', 'Eklenemedi');
                                                                });
                                                            } else {
                                                                // Standard Definitions
                                                                if (definitionTab === 'brands') addDefinition('brands', brands, setBrands);
                                                                else if (definitionTab === 'prod_cat') addDefinition('prod_cat', prodCats, setProdCats);
                                                                else if (definitionTab === 'cust_class') addDefinition('custClasses', custClasses, setCustClasses);
                                                                else if (definitionTab === 'supp_class') addDefinition('suppClasses', suppClasses, setSuppClasses);
                                                                else if (definitionTab === 'warranties') addDefinition('warranties', warranties, setWarranties);
                                                                else if (definitionTab === 'vehicle_types') addDefinition('vehicleTypes', vehicleTypes, setVehicleTypes);
                                                            }
                                                        }
                                                    }}
                                                    className="w-full"
                                                    style={{
                                                        padding: '14px 20px', borderRadius: '12px', backgroundColor: "transparent",
                                                        border: '1px solid var(--border-light)', color: 'white', fontSize: '15px'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const e = { key: 'Enter' } as any;
                                                        // Trigger manual logic same as Enter
                                                        if (definitionTab === 'payment_methods') {
                                                            const id = Math.random().toString(36).substr(2, 9);
                                                            const icon = newPaymentMethod.type === 'cash' ? '💵' : (newPaymentMethod.type === 'card' ? '💳' : '🏦');
                                                            const newVal = {
                                                                id,
                                                                label: newItemInput || 'Yeni Hesap',
                                                                type: newPaymentMethod.type,
                                                                icon,
                                                                linkedKasaId: ''
                                                            };
                                                            updatePaymentMethods([...paymentMethods, newVal]).then(() => {
                                                                setNewItemInput('');
                                                                showSuccess('Başarılı', 'Ödeme yöntemi eklendi.');
                                                            });
                                                        } else {
                                                            if (definitionTab === 'brands') addDefinition('brands', brands, setBrands);
                                                            else if (definitionTab === 'prod_cat') addDefinition('prod_cat', prodCats, setProdCats);
                                                            else if (definitionTab === 'cust_class') addDefinition('custClasses', custClasses, setCustClasses);
                                                            else if (definitionTab === 'supp_class') addDefinition('suppClasses', suppClasses, setSuppClasses);
                                                            else if (definitionTab === 'warranties') addDefinition('warranties', warranties, setWarranties);
                                                            else if (definitionTab === 'vehicle_types') addDefinition('vehicleTypes', vehicleTypes, setVehicleTypes);
                                                        }
                                                    }}
                                                    className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors"
                                                    
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* LIST AREA */}
                                <div >
                                    {definitionTab === 'payment_methods' ?
                                        (paymentMethods || []).map((pm: any, i: number) => (
                                            <div key={pm.id || i} className="bg-white dark:bg-[#111827] rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all-hover animate-scale-in" >
                                                <div className="flex items-center gap-3">
                                                    <div >
                                                        {pm.icon || '💰'}
                                                    </div>
                                                    <div>
                                                        <div >{pm.label}</div>
                                                        <div >
                                                            {pm.type === 'card' ? 'Kredi Kartı' : pm.type === 'transfer' ? 'Banka' : 'Nakit'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => quickRemovePaymentMethod(pm.id)}
                                                    
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))
                                        : (
                                            (definitionTab === 'brands' ? (brands || []) :
                                                definitionTab === 'prod_cat' ? (prodCats || []) :
                                                    definitionTab === 'cust_class' ? (custClasses || []) :
                                                        definitionTab === 'supp_class' ? (suppClasses || []) :
                                                            definitionTab === 'vehicle_types' ? (vehicleTypes || []) : (warranties || [])
                                            ).map((item: string, i: number) => (
                                                <div key={i} className="bg-white dark:bg-[#111827] rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all-hover animate-scale-in" >
                                                    <span >{item}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (definitionTab === 'brands') removeDefinition('brands', item, brands, setBrands);
                                                            else if (definitionTab === 'prod_cat') removeDefinition('prodCats', item, prodCats, setProdCats);
                                                            else if (definitionTab === 'cust_class') removeDefinition('custClasses', item, custClasses, setCustClasses);
                                                            else if (definitionTab === 'supp_class') removeDefinition('suppClasses', item, suppClasses, setSuppClasses);
                                                            else if (definitionTab === 'warranties') removeDefinition('warranties', item, warranties, setWarranties);
                                                            else if (definitionTab === 'vehicle_types') removeDefinition('vehicleTypes', item, vehicleTypes, setVehicleTypes);
                                                        }}
                                                        
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                </div>

                                {/* Empty State Hint */}
                                {(definitionTab !== 'payment_methods' ? (
                                    (definitionTab === 'brands' ? brands :
                                        definitionTab === 'prod_cat' ? prodCats :
                                            definitionTab === 'cust_class' ? custClasses :
                                                definitionTab === 'supp_class' ? suppClasses :
                                                    definitionTab === 'vehicle_types' ? vehicleTypes : warranties
                                    ).length === 0
                                ) : paymentMethods.length === 0) && (
                                        <div className="flex-center flex-col text-muted" >
                                            <span >📝</span>
                                            <span>Liste boş. Yeni eklemek için yukarıdaki alanı kullanın.</span>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                )
    );
}
