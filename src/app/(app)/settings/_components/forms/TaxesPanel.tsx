import React from 'react';

export default function TaxesPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div  className="animate-fade-in-up">
                        <h2 >Vergi Oranları</h2>

                        <div className="p-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" >
                            <div className="flex-col gap-2">
                                {((invoiceSettings as any)?.kdvRates || []).map((rate: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center" >
                                        <div className="flex-center gap-3">
                                            <span >%{rate}</span>
                                            <span >KDV ORANI</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const currentRates = (invoiceSettings as any)?.kdvRates || [];
                                                const newRates = currentRates.filter((_: any, i: number) => i !== idx);
                                                updateInvoiceSettings({ ...invoiceSettings, kdvRates: newRates });
                                            }}
                                            
                                        >Sil</button>
                                    </div>
                                ))}
                            </div>

                            <div >
                                <div className="flex-col gap-3">
                                    <p >Yeni Vergi Oranı Ekle</p>
                                    <div className="flex items-center gap-2">
                                        <div >
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={newKdv}
                                                onChange={e => setNewKdv(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') addKdv();
                                                }}
                                                
                                            />
                                            <span >%</span>
                                        </div>
                                        <button
                                            onClick={addKdv}
                                            className="btn btn-success"
                                            
                                        >
                                            + EKLE
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
    );
}
