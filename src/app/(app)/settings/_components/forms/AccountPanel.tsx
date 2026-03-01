import React from 'react';

export default function AccountPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div className="animate-fade-in-up" >
                        <h1 >Profilim</h1>
                        <p >Hesap bilgilerinizi ve profil ayarlarınızı görüntüleyin</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* INFO CARD */}
                            <div className="p-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" >
                                <div className="flex items-center gap-6 mb-8">
                                    <div>
                                        {users.find((u: any) => u.name === (currentUser?.name || ''))?.name?.substring(0, 1).toUpperCase() || 'A'}
                                    </div>
                                    <div>
                                        <h2 >{currentUser?.name || 'Yönetici'}</h2>
                                        <div >{currentUser?.role || 'Sistem Yöneticisi'}</div>
                                    </div>
                                </div>

                                <div className="flex-col gap-4">
                                    <div className="flex-col gap-1.5">
                                        <label >KULLANICI ADI</label>
                                        <input type="text" readOnly value={currentUser?.username || '-'} className="input-field"  />
                                    </div>
                                    <div className="flex-col gap-1.5">
                                        <label >ŞUBE</label>
                                        <input type="text" readOnly value={currentUser?.branch || 'Merkez'} className="input-field"  />
                                    </div>
                                </div>
                            </div>

                            {/* PASSWORD CHANGE */}
                            <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    🔐 Şifre Değiştir
                                </h3>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-xs font-bold opacity-60">Mevcut Şifre</label>
                                        <input
                                            type="password"
                                            className="input-field w-full"
                                            value={profilePass.old}
                                            onChange={e => setProfilePass({ ...profilePass, old: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold opacity-60">Yeni Şifre</label>
                                        <input
                                            type="password"
                                            className="input-field w-full"
                                            value={profilePass.new}
                                            onChange={e => setProfilePass({ ...profilePass, new: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold opacity-60">Yeni Şifre (Tekrar)</label>
                                        <input
                                            type="password"
                                            className="input-field w-full"
                                            value={profilePass.confirm}
                                            onChange={e => setProfilePass({ ...profilePass, confirm: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={handlePasswordChange}
                                        className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors mt-2 font-bold"
                                    >
                                        Şifreyi Güncelle
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
    );
}
