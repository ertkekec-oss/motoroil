import React from 'react';

export default function CompanyProfileForm(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div  className="animate-fade-in-up">
                        <h2 >Firma Profili</h2>
                        <p className="text-muted mb-8" >Belgelerde ve tekliflerde görünecek genel firma bilgilerini düzenleyin.</p>

                        <div className="flex flex-col gap-6 p-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex-col gap-2">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">FİRMA ADI</label>
                                <input
                                    type="text"
                                    value={tempCompanyInfo?.company_name || ""}
                                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_name: e.target.value })}
                                    placeholder="Örn: MOTOROIL"
                                    className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm" 
                                />
                            </div>

                            <div className="flex-col gap-2">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">SLOGAN / ALT BAŞLIK</label>
                                <input
                                    type="text"
                                    value={tempCompanyInfo?.company_slogan || ""}
                                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_slogan: e.target.value })}
                                    placeholder="Örn: Profesyonel Oto Servis ve Bakım"
                                    className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">ŞEHİR</label>
                                    <select
                                        value={tempCompanyInfo?.company_city || ""}
                                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_city: e.target.value, company_district: '' })}
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
                                        value={tempCompanyInfo?.company_district || ""}
                                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_district: e.target.value })}
                                        disabled={!tempCompanyInfo?.company_city}
                                        className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm"
                                    >
                                        <option value="">İlçe Seçin...</option>
                                        {(TURKISH_DISTRICTS[tempCompanyInfo?.company_city] || []).map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">GENEL E-POSTA</label>
                                    <input
                                        type="email"
                                        value={tempCompanyInfo?.company_email || ""}
                                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_email: e.target.value })}
                                        placeholder="info@firma.com"
                                        className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">WEB SİTESİ</label>
                                    <input
                                        type="text"
                                        value={tempCompanyInfo?.company_website || ""}
                                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_website: e.target.value })}
                                        placeholder="www.firma.com.tr"
                                        className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex-col gap-2">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">VARSAYILAN ADRES (ŞUBE BİLGİSİ YOKSA)</label>
                                <textarea
                                    rows={3}
                                    value={tempCompanyInfo?.company_address || ""}
                                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_address: e.target.value })}
                                    placeholder="Firma açık adresi..."
                                    className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="flex-col gap-2">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">VARSAYILAN TELEFON</label>
                                <input
                                    type="text"
                                    value={tempCompanyInfo?.company_phone || ""}
                                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_phone: e.target.value })}
                                    placeholder="+90 (---) --- -- --"
                                    className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <button
                                onClick={handleSaveCompany}
                                disabled={isSaving}
                                className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors h-12"
                            >
                                {isSaving ? '⏳ KAYDEDİLİYOR...' : '💾 DEĞİŞİKLİKLERİ KAYDET'}
                            </button>

                            <div >
                                <p >💡 Bilgi:</p>
                                <p >
                                    Bu bilgiler sistem genelindeki belgelerde (teklif, fatura vb.) varsayılan olarak kullanılır.
                                    Şube bazlı belgelerde ilgili şubenin kendi adres ve telefonu önceliklidir.
                                </p>
                            </div>
                        </div>
                    </div>
                )
    );
}
