import React from 'react';

export default function SystemResetPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div >
                        <h2 >⚠️ KRİTİK SİSTEM SIFIRLAMA</h2>

                        <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" >
                            <div >🧨</div>
                            <h3 >Veri Temizleme ve Yapılandırma</h3>
                            <p className="text-muted" >
                                Lütfen sıfırlamak istediğiniz modülleri seçin. Bu işlem seçilen kategorilerdeki tüm verileri <b>KALICI OLARAK</b> silecektir.
                            </p>

                            <div >
                                <label >
                                    <input type="checkbox" checked={resetOptions.all} onChange={e => setResetOptions({ ...resetOptions, all: e.target.checked })}  />
                                    <span >HER ŞEYİ SİL (TAM SIFIRLAMA)</span>
                                </label>

                                <hr  />

                                {[
                                    { id: 'customers', label: 'Cariler' },
                                    { id: 'inventory', label: 'Envanter' },
                                    { id: 'ecommerce', label: 'E-ticaret Satışları' },
                                    { id: 'pos', label: 'Mağaza Satışları' },
                                    { id: 'receivables', label: 'Alacaklar' },
                                    { id: 'payables', label: 'Borçlar' },
                                    { id: 'checks', label: 'Çekler' },
                                    { id: 'notes', label: 'Senetler' },
                                    { id: 'staff', label: 'Personel' },
                                    { id: 'branches', label: 'Şubeler' },
                                    { id: 'expenses', label: 'Giderler' },
                                ].map(opt => (
                                    <label key={opt.id} >
                                        <input
                                            type="checkbox"
                                            disabled={resetOptions.all}
                                            checked={resetOptions.all || (resetOptions as any)[opt.id]}
                                            onChange={e => setResetOptions({ ...resetOptions, [opt.id]: e.target.checked })}
                                            
                                        />
                                        <span >{opt.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex-col gap-4" >
                                <div >
                                    <label >
                                        İşlemi onaylamak için <span >ONAYLIYORUM</span> yazın:
                                    </label>
                                    <input
                                        type="text"
                                        id="resetConfirmationInput"
                                        
                                        placeholder="ONAYLIYORUM"
                                    />
                                </div>

                                <button
                                    disabled={!Object.values(resetOptions).some(v => v)}
                                    onClick={async () => {
                                        const input = (document.getElementById('resetConfirmationInput') as HTMLInputElement).value;
                                        if (input !== 'ONAYLIYORUM') {
                                            showError('Hata', 'Lütfen onay kutusuna ONAYLIYORUM yazın.');
                                            return;
                                        }

                                        showConfirm(
                                            'KRİTİK SİSTEM SIFIRLAMA',
                                            'Seçilen veriler kalıcı olarak silinecektir. Devam etmek istediğinizden emin misiniz?',
                                            async () => {
                                                try {
                                                    const res = await fetch('/api/admin/reset-data', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            confirmation: input,
                                                            options: resetOptions,
                                                            currentUsername: currentUser?.username
                                                        })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        showSuccess('BAŞARILI', '✅ Seçilen veriler sıfırlandı.');
                                                        setTimeout(() => window.location.reload(), 2000);
                                                    } else {
                                                        showError('Hata', 'İşlem hatası: ' + data.error);
                                                    }
                                                } catch (e) {
                                                    showError('Hata', 'Sunucu ile iletişim kurulamadı.');
                                                }
                                            }
                                        );
                                    }}
                                    className="btn"
                                    style={{
                                        background: '#dc2626',
                                        color: 'white',
                                        fontWeight: '900',
                                        padding: '18px 40px',
                                        width: '100%',
                                        maxWidth: '400px',
                                        fontSize: '16px',
                                        borderRadius: '18px',
                                        boxShadow: 'none',
                                        opacity: (!Object.values(resetOptions).some(v => v)) ? 0.5 : 1,
                                        cursor: (!Object.values(resetOptions).some(v => v)) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    🔥 SEÇİLİ VERİLERİ SİL & SIFIRLA
                                </button>
                            </div>
                        </div>
                    </div>
                )
    );
}
