import React from 'react';

export default function InvoiceSettingsPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div  className="animate-fade-in-up">
                        <h2 >Fatura Konfigürasyonu</h2>

                        <div className="flex flex-col gap-4 p-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" >
                            <div className="flex-col gap-1">
                                <label >FATURA NOTU (VARSAYILAN)</label>
                                <textarea
                                    rows={2}
                                    value={invoiceSettings?.defaultNote || ''}
                                    onChange={(e) => updateInvoiceSettings({ ...invoiceSettings, defaultNote: e.target.value })}
                                    
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex-col gap-1">
                                    <label >SERİ ÖN EKİ</label>
                                    <input type="text" value={invoiceSettings?.prefix || ''} onChange={e => updateInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })}  />
                                </div>
                                <div className="flex-col gap-1">
                                    <label >SIRADAKİ NO</label>
                                    <input type="number" value={invoiceSettings?.nextNumber || 0} readOnly  />
                                </div>
                            </div>

                            <button className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" >AYARLARI KAYDET</button>
                        </div>
                    </div>
                )
    );
}
