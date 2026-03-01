import React from 'react';

export default function AuditLogsPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div className="animate-fade-in-up">
                        <div className="flex-between mb-4">
                            <div>
                                <h2 >İşlem Günlükleri</h2>
                                <p >Sistemdeki son değişiklikler</p>
                            </div>
                            <button className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors"  onClick={fetchLogs} disabled={isLogsLoading}>
                                {isLogsLoading ? '...' : '🔄 YENİLE'}
                            </button>
                        </div>

                        <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" >
                            <table >
                                <thead className="h-[52px] px-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
<tr >
                                        <th >TARİH / KULLANICI</th>
                                        <th>İŞLEM</th>
                                        <th>NESNE</th>
                                        <th >DETAY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr><td colSpan={4} >Kayıt bulunamadı.</td></tr>
                                    ) : (
                                        logs.map(log => (
                                            <tr key={log.id} >
                                                <td >
                                                    <div >{new Date(log.createdAt).toLocaleString('tr-TR')}</div>
                                                    <div >{log.userName || 'Sistem'}</div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '900',
                                                        background: log.action?.includes('DELETE') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                        color: log.action?.includes('DELETE') ? 'var(--danger)' : 'var(--primary)',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td >{log.entity}</td>
                                                <td >{log.details}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
    );
}
