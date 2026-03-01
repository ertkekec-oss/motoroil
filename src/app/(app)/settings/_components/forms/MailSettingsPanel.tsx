import React from 'react';

export default function MailSettingsPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div className="animate-fade-in-up space-y-4 max-w-4xl p-8" >
                        <div>
                            <h1 className="text-2xl font-black mb-2 bg-clip-text text-transparent" >
                                📧 Mail Ayarları
                            </h1>
                            <p className="text-sm text-white/40" >Mail sunucu yapılandırması ve SMTP entegrasyon ayarları.</p>
                        </div>

                        <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all p-8" >
                            <div className="flex justify-between items-center border-b border-white/5 pb-6 mb-6" >
                                <div>
                                    <h3 className="text-lg font-black flex items-center gap-2" >
                                        📧 Mail Sunucu Ayarları (SMTP)
                                    </h3>
                                    <p className="text-xs text-white/40 mt-1" >Personel şifreleri ve bildirimlerin gönderileceği mail hesabı.</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${smtpSettings.email ? 'bg-blue-600/10 text-blue-600 dark:text-blue-500' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`} >
                                    {smtpSettings.email ? 'YAPILANDIRILDI' : 'AYARLANMADI'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" >
                                <div className="space-y-2" >
                                    <label className="text-xs font-bold text-white/60" >Gönderici E-Posta (Gmail vb.)</label>
                                    <input
                                        type="email"
                                        className="input-field w-full p-3"
                                        
                                        placeholder="ornek@gmail.com"
                                        value={smtpSettings.email}
                                        onChange={e => setSmtpSettings({ ...smtpSettings, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2" >
                                    <label className="text-xs font-bold text-white/60" >Uygulama Şifresi (App Password)</label>
                                    <input
                                        type="password"
                                        className="input-field w-full p-3"
                                        
                                        placeholder="**** **** **** ****"
                                        value={smtpSettings.password}
                                        onChange={e => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                                    />
                                    <p className="text-[10px] text-white/30" >Gmail kullanıyorsanız normal şifreniz çalışmaz. Google Hesabım &gt; Güvenlik &gt; Uygulama Şifreleri kısmından 16 haneli şifre almalısınız.</p>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6" >
                                <button
                                    onClick={saveSmtpSettings}
                                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-white font-black hover:scale-105 active:scale-95 transition-all shadow-sm"
                                    
                                >
                                    KAYDET
                                </button>
                            </div>
                        </div>
                    </div>
                )
    );
}
