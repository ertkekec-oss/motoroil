import React from 'react';

export default function ServiceFeesPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div  className="animate-fade-in-up">
                        <h2 >Servis Ücretleri</h2>
                        <div className="p-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" >
                            <div className="flex-col gap-3">
                                {[
                                    { icon: '🏍️', label: 'Motosiklet Bakım', price: localServiceSettings.motoMaintenancePrice, field: 'motoMaintenancePrice' },
                                    { icon: '🚲', label: 'Bisiklet Bakım', price: localServiceSettings.bikeMaintenancePrice, field: 'bikeMaintenancePrice' }
                                ].map(s => (
                                    <div key={s.field} className="flex justify-between items-center" >
                                        <div>
                                            <div >{s.icon} {s.label}</div>
                                            <div >Otomatik gelen işçilik bedeli</div>
                                        </div>
                                        <div >
                                            <input
                                                type="number"
                                                value={s.price}
                                                onChange={(e) => setLocalServiceSettings({ ...localServiceSettings, [s.field]: Number(e.target.value) })}
                                                
                                            />
                                            <span >₺</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSaveServiceSettings}
                                className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors w-full mt-4"
                                
                            >
                                💾 AYARLARI KAYDET
                            </button>
                        </div>
                    </div>
                )
    );
}
