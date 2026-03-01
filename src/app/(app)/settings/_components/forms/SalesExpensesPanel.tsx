import React from 'react';

export default function SalesExpensesPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div >
                        <h2 >Masraf & Komisyon Yönetimi</h2>

                        {/* POS KOMİSYONLARI */}
                        <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3>POS / Banka Komisyon Oranları</h3>
                                    <p className="text-muted" >Kredi kartı satışlarında otomatik gider kaydı olarak düşülecek komisyon oranları.</p>
                                </div>
                                <button className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" onClick={() => {
                                    const currentComms = salesExpenses?.posCommissions || [];
                                    updateSalesExpenses({ ...salesExpenses, posCommissions: [...currentComms, { installment: 'Tek Çekim', rate: 0 }] });
                                }}>+ Yeni Oran Ekle</button>
                            </div>

                            <div className="flex-col gap-3">
                                {(!salesExpenses?.posCommissions || salesExpenses.posCommissions.length === 0) && (
                                    <div className="text-muted text-center p-4 bg-white/5 rounded">Henüz oran tanımlanmamış.</div>
                                )}
                                {salesExpenses?.posCommissions?.map((comm: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center" >
                                        <div className="flex gap-4 items-center flex-1">
                                            <div className="flex-col gap-1 flex-1">
                                                <label className="text-muted" >TAKSİT / TÜR</label>
                                                <input
                                                    type="text"
                                                    value={comm.installment}
                                                    onChange={(e) => {
                                                        const newComms = [...salesExpenses.posCommissions];
                                                        newComms[idx].installment = e.target.value;
                                                        updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                                    }}
                                                    placeholder="Örn: Tek Çekim"
                                                    
                                                />
                                            </div>
                                            <div className="flex-col gap-1" >
                                                <label className="text-muted" >ORAN (%)</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={comm.rate}
                                                        onChange={(e) => {
                                                            const newComms = [...salesExpenses.posCommissions];
                                                            newComms[idx].rate = Number(e.target.value);
                                                            updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                                        }}
                                                        
                                                    />
                                                    <span>%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => {
                                            const newComms = salesExpenses.posCommissions.filter((_: any, i: number) => i !== idx);
                                            updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                        }} className="px-6 h-[44px] rounded-xl font-bold text-sm bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-none border border-transparent flex items-center justify-center gap-2 text-danger ml-4">🗑️</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
    );
}
