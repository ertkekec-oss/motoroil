import { Check } from 'lucide-react';
import React from 'react';

export default function CampaignPointsPanel(props: any) {
    const { Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv, activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;

    return (
        (
                    <div className="animate-fade-in" >
                        <div >
                            <h1 >🎁 Sadakat & Kampanya Merkezi</h1>
                            <p className="text-muted" >Müşteri sadakatini artıracak indirim, puan ve hediye çeki kurgularını yönetin.</p>
                        </div>

                        {/* SUB-TABS NAVIGATION */}
                        <div >
                            {[
                                { id: 'loyalty', label: 'Ana Kampanyalar', icon: '✨' },
                                { id: 'referral', label: 'Referans Sistemi', icon: '🔗' },
                                { id: 'coupons', label: 'Hediye Çekleri', icon: '🎫' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setCampaignSubTab(t.id)}
                                >
                                    <span>{t.icon}</span> {t.label}
                                </button>
                            ))}
                        </div>

                        {/* 10.1 ANA KAMPANYALAR (LOYALTY & DISCOUNTS) */}
                        {campaignSubTab === 'loyalty' && (
                            <div className="animate-fade-in-up" >
                                <div className="grid-cols-12 gap-6">
                                    {/* Create/Edit Form */}
                                    <div className="col-span-12 xl:col-span-5">
                                        <div className="p-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" >
                                            <h3 className="mb-4" >
                                                <div >+</div>
                                                {editingCampaignId ? 'Kampanyayı Düzenle' : 'Yeni Kampanya Tanımla'}
                                            </h3>
                                            <div className="flex-col gap-4">
                                                <div className="flex-col gap-2">
                                                    <label >KAMPANYA ADI</label>
                                                    <input type="text" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="Örn: Hafta Sonu Nakit İndirimi"  />
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label >KAMPANYA TİPİ</label>
                                                        <select value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })} >
                                                            <option value="payment_method_discount">💳 Ödeme İndirimi</option>
                                                            <option value="buy_x_get_discount">🏷️ X Alana % İndirim</option>
                                                            <option value="buy_x_get_free">🎁 X Alana Y Bedava</option>
                                                            <option value="loyalty_points">💰 Sadakat Puanı</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label >
                                                            {newCampaign.type === 'loyalty_points' ? 'KAZANIM (%)' : 'TEMEL İNDİRİM (%)'}
                                                        </label>
                                                        <input type="number"
                                                            value={(newCampaign.type === 'loyalty_points' ? (newCampaign.pointsRate || 0) : (newCampaign.discountRate || 0)) * 100}
                                                            onChange={e => {
                                                                const val = parseFloat(e.target.value) / 100;
                                                                if (newCampaign.type === 'loyalty_points') setNewCampaign({ ...newCampaign, pointsRate: val });
                                                                else setNewCampaign({ ...newCampaign, discountRate: val });
                                                            }}
                                                             />
                                                    </div>
                                                </div>

                                                {/* CONDITIONAL FIELDS BASED ON TYPE */}
                                                {(newCampaign.type === 'buy_x_get_discount' || newCampaign.type === 'buy_x_get_free') && (
                                                    <div className="card" >
                                                        <h4 >KAMPANYA KURALLARI (X ALANA Y DURUMU)</h4>
                                                        <div className="flex-col gap-4">
                                                            <div className="flex gap-4">
                                                                <div className="flex-1 flex-col gap-1">
                                                                    <label >ALINACAK MİKTAR (X)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={newCampaign.conditions.buyQuantity || 1}
                                                                        onChange={e => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, buyQuantity: parseInt(e.target.value) } })}
                                                                        
                                                                    />
                                                                </div>
                                                                {newCampaign.type === 'buy_x_get_discount' && (
                                                                    <div className="flex-1 flex-col gap-1">
                                                                        <label >İNDİRİM ORANI (%)</label>
                                                                        <input
                                                                            type="number"
                                                                            value={newCampaign.conditions.rewardValue || 0}
                                                                            onChange={e => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardValue: parseFloat(e.target.value) } })}
                                                                            
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {newCampaign.type === 'buy_x_get_free' && (
                                                                <div className="flex-col gap-2">
                                                                    <label >BEDELSİZ VERİLECEK ÜRÜN</label>
                                                                    <select
                                                                        value={newCampaign.conditions.rewardProductId || ''}
                                                                        onChange={e => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardProductId: e.target.value } })}
                                                                        
                                                                    >
                                                                        <option value="">Aynı Üründen</option>
                                                                        {(products || []).map((p: any) => (
                                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="flex-col gap-1 mt-2">
                                                                        <label >BEDELSİZ ADEDİ</label>
                                                                        <input
                                                                            type="number"
                                                                            value={newCampaign.conditions.rewardQuantity || 1}
                                                                            onChange={e => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardQuantity: parseInt(e.target.value) } })}
                                                                            
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex-col gap-2">
                                                    <label >HEDEF MÜŞTERİ GRUPLARI (SAHA SATIŞ ÖZEL)</label>
                                                    <div >
                                                        {(custClasses || []).map(cc => (
                                                            <button
                                                                key={cc}
                                                                onClick={() => {
                                                                    const current = newCampaign.targetCustomerCategoryIds || [];
                                                                    const next = current.includes(cc) ? current.filter((x: string) => x !== cc) : [...current, cc];
                                                                    setNewCampaign({ ...newCampaign, targetCustomerCategoryIds: next });
                                                                }}
                                                            >{cc}</button>
                                                        ))}
                                                        {(custClasses || []).length === 0 && <span >Kategori tanımlanmamış.</span>}
                                                    </div>
                                                </div>

                                                <div className="flex-col gap-2">
                                                    <label >GEÇERLİ OLDUĞU MARKALAR (Boşsa Tümü)</label>
                                                    <div >
                                                        {(allBrands || []).map(b => (
                                                            <button
                                                                key={b}
                                                                onClick={() => {
                                                                    const current = newCampaign.conditions.brands || [];
                                                                    const next = current.includes(b) ? current.filter((x: string) => x !== b) : [...current, b];
                                                                    setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, brands: next } });
                                                                }}
                                                            >{b}</button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex-col gap-2">
                                                    <label >GEÇERLİ OLDUĞU KATEGORİLER (Boşsa Tümü)</label>
                                                    <div >
                                                        {(allCats || []).map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={() => {
                                                                    const current = newCampaign.conditions.categories || [];
                                                                    const next = current.includes(c) ? current.filter((x: string) => x !== c) : [...current, c];
                                                                    setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, categories: next } });
                                                                }}
                                                            >{c}</button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {newCampaign.type === 'payment_method_discount' && (
                                                    <div className="flex-col gap-2">
                                                        <label >ÖDEME YÖNTEMİ SEÇİMİ</label>
                                                        <select 
                                                            value={newCampaign.conditions.paymentMethod || ''}
                                                            onChange={e => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, paymentMethod: e.target.value } })}>
                                                            <option value="">Tüm Yöntemler</option>
                                                            <option value="cash">💵 Nakit</option>
                                                            <option value="card_single">💳 Kredi Kartı</option>
                                                            <option value="transfer">🏦 Havale / EFT</option>
                                                        </select>
                                                    </div>
                                                )}

                                                <div >
                                                    <button onClick={addCampaign} className="bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" >
                                                        {editingCampaignId ? 'KAMPANYAYI GÜNCELLE' : 'KAMPANYAYI OLUŞTUR'}
                                                    </button>
                                                    {editingCampaignId && (
                                                        <button onClick={() => {
                                                            setEditingCampaignId(null);
                                                            setNewCampaign({
                                                                name: '',
                                                                type: 'payment_method_discount',
                                                                discountRate: 0,
                                                                pointsRate: 0,
                                                                conditions: {
                                                                    brands: [],
                                                                    categories: [],
                                                                    paymentMethod: '',
                                                                    buyQuantity: 1,
                                                                    rewardProductId: '',
                                                                    rewardQuantity: 1,
                                                                    rewardValue: 0,
                                                                    rewardType: 'percentage_discount'
                                                                },
                                                                targetCustomerCategoryIds: []
                                                            });
                                                        }} className="btn-ghost" >Vazgeç</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* List View */}
                                    <div className="col-span-12 xl:col-span-7">
                                        <div className="card">
                                            <div >
                                                <h3 >Yayındaki Kampanyalar</h3>
                                                <span >{campaigns.length} Aktif</span>
                                            </div>
                                            <div >
                                                {campaigns.map(camp => (
                                                    <div key={camp.id} >
                                                        <div >
                                                            <div >
                                                                {camp.type === 'loyalty_points' ? '💎' : (camp.type === 'buy_x_get_free' ? '🎁' : (camp.type === 'buy_x_get_discount' ? '🏷️' : '💳'))}
                                                            </div>
                                                            <div>
                                                                <div >{camp.name}</div>
                                                                <div >
                                                                    <span>
                                                                        {camp.type === 'loyalty_points' && 'Sadakat Puanı'}
                                                                        {camp.type === 'payment_method_discount' && 'Ödeme İndirimi'}
                                                                        {camp.type === 'buy_x_get_discount' && `${camp.conditions.buyQuantity} Alana %${camp.conditions.rewardValue} İndirim`}
                                                                        {camp.type === 'buy_x_get_free' && `${camp.conditions.buyQuantity} Alana ${camp.conditions.rewardQuantity} Hediye`}
                                                                    </span>
                                                                    {camp.conditions.brands?.length > 0 && <span>• {camp.conditions.brands.length} Marka</span>}
                                                                    {camp.targetCustomerCategoryIds?.length > 0 && <span>• {camp.targetCustomerCategoryIds.length} Müşteri Grubu</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div >
                                                            <div >
                                                                <div >
                                                                    {camp.type === 'buy_x_get_free' ? `+${camp.conditions.rewardQuantity}` : `%${((camp.discountRate || camp.pointsRate || 0) * 100).toFixed(0)}`}
                                                                </div>
                                                                <div >{camp.type === 'buy_x_get_free' ? 'ADET' : 'ORAN'}</div>
                                                            </div>
                                                            <div >
                                                                <button onClick={() => startEditingCampaign(camp)} className="px-6 h-[44px] rounded-xl font-bold text-sm bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-none border border-transparent flex items-center justify-center gap-2 btn-sm" >✏️</button>
                                                                <button onClick={() => deleteCampaign(camp.id)} className="px-6 h-[44px] rounded-xl font-bold text-sm bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-none border border-transparent flex items-center justify-center gap-2 btn-sm" >🗑️</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {campaigns.length === 0 && (
                                                    <div >
                                                        <div >📭</div>
                                                        <div >Henüz aktif kampanya yok.</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 10.2 REFERANS SİSTEMİ */}
                        {campaignSubTab === 'referral' && (
                            <div className="animate-fade-in-up" >
                                <div className="p-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" >
                                    <div >
                                        <div >🔗</div>
                                        <div>
                                            <h3 >Referans & Ödül Sistemi</h3>
                                            <p className="text-muted" >Müşterilerinizin işletmenizi başkalarına tavsiye etmesini teşvik edin.</p>
                                        </div>
                                    </div>

                                    <div className="grid-cols-2 gap-8 mb-8">
                                        <div >
                                            <div className="flex justify-between items-center mb-2">
                                                <label >REFERANS OLAN KİŞİYE ÖDÜL</label>
                                                <select
                                                    value={referralSettings.referrerRewardType || 'percent'}
                                                    onChange={e => setReferralSettings({ ...referralSettings, referrerRewardType: e.target.value })}
                                                    
                                                >
                                                    <option value="percent">Yüzde (%)</option>
                                                    <option value="amount">Tutar (₺)</option>
                                                </select>
                                            </div>
                                            <div >
                                                <div >
                                                    <input type="number"
                                                        value={referralSettings.referrerDiscount}
                                                        onChange={e => setReferralSettings({ ...referralSettings, referrerDiscount: parseFloat(e.target.value) || 0 })}
                                                        
                                                    />
                                                    <div >
                                                        {referralSettings.referrerRewardType === 'amount' ? 'İNDİRİM TUTARI (₺)' : 'İNDİRİM ORANI (%)'}
                                                    </div>
                                                </div>
                                                <div >
                                                    {referralSettings.referrerRewardType === 'amount' ? '₺' : '%'}
                                                </div>
                                            </div>
                                            <p >Mevcut müşteri, yeni birini getirdiğinde bu değerde bir indirim kuponu kazanır.</p>
                                        </div>

                                        <div >
                                            <div className="flex justify-between items-center mb-2">
                                                <label >YENİ GELEN KİŞİYE HEDİYE</label>
                                                <select
                                                    value={referralSettings.refereeGiftType || 'amount'}
                                                    onChange={e => setReferralSettings({ ...referralSettings, refereeGiftType: e.target.value })}
                                                    
                                                >
                                                    <option value="percent">Yüzde (%)</option>
                                                    <option value="amount">Tutar (₺)</option>
                                                </select>
                                            </div>
                                            <div >
                                                <div >
                                                    <input type="number"
                                                        value={referralSettings.refereeGift}
                                                        onChange={e => setReferralSettings({ ...referralSettings, refereeGift: parseFloat(e.target.value) || 0 })}
                                                        
                                                    />
                                                    <div >
                                                        {referralSettings.refereeGiftType === 'percent' ? 'HEDİYE ORANI (%)' : 'HEDİYE TUTAR (₺)'}
                                                    </div>
                                                </div>
                                                <div >
                                                    {referralSettings.refereeGiftType === 'percent' ? '%' : '₺'}
                                                </div>
                                            </div>
                                            <p >Yeni müşteri ilk alışverişinde bu değerde anında hoşgeldin indirimi alır.</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={saveReferralSettings}
                                        className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors w-full"
                                        
                                    >
                                        SİSTEM AYARLARINI GÜNCELLE
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 10.3 HEDİYE ÇEKLERİ (COUPONS) */}
                        {campaignSubTab === 'coupons' && (
                            <div className="animate-fade-in-up" >
                                <div className="grid-cols-12 gap-6">
                                    <div className="col-span-12 lg:col-span-5">
                                        <div className="p-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <h3 className="mb-6" >🎫 Kod Üretici</h3>
                                            <div className="flex-col gap-5">
                                                <div className="flex-col gap-2">
                                                    <label >KAMPANYA ADI</label>
                                                    <input type="text" value={newCoupon.campaignName} onChange={e => setNewCoupon({ ...newCoupon, campaignName: e.target.value })} placeholder="Yılbaşı Paket İndirimi"  />
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label >ÜRETİLECEK ADET</label>
                                                        <input type="number" value={newCoupon.count} onChange={e => setNewCoupon({ ...newCoupon, count: parseInt(e.target.value) || 1 })}  />
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label >SON KULLANIM</label>
                                                        <input type="date" value={newCoupon.expiryDate} onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}  />
                                                    </div>
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label >İNDİRİM TİPİ</label>
                                                        <select value={newCoupon.type} onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })} >
                                                            <option value="percent">İndirim Oranı (%)</option>
                                                            <option value="amount">İndirim Tutarı (₺)</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label >DEĞER</label>
                                                        <input type="number" value={newCoupon.value} onChange={e => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })}  />
                                                    </div>
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label >SEPET LİMİTİ (Min ₺)</label>
                                                        <input type="number" value={newCoupon.minPurchaseAmount} onChange={e => setNewCoupon({ ...newCoupon, minPurchaseAmount: parseFloat(e.target.value) || 0 })} placeholder="0 (Limitsiz)"  />
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label >KULLANIM HAKKI</label>
                                                        <select value={newCoupon.usageLimit} onChange={e => setNewCoupon({ ...newCoupon, usageLimit: parseInt(e.target.value) })} >
                                                            <option value={1}>1 Seferlik (Kullanınca Biter)</option>
                                                            <option value={0}>Sürekli (Her Alışverişte)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label >MARKA KISITI</label>
                                                        <div >
                                                            {(allBrands || []).map(b => (
                                                                <button
                                                                    type="button"
                                                                    key={b}
                                                                    onClick={() => {
                                                                        const current = newCoupon.conditions.brands || [];
                                                                        const next = current.includes(b) ? current.filter((x: any) => x !== b) : [...current, b];
                                                                        setNewCoupon({ ...newCoupon, conditions: { ...newCoupon.conditions, brands: next } });
                                                                    }}
                                                                    
                                                                >
                                                                    {b}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label >KAT. KISITI</label>
                                                        <div >
                                                            {(allCats || []).map(c => (
                                                                <button
                                                                    type="button"
                                                                    key={c}
                                                                    onClick={() => {
                                                                        const current = newCoupon.conditions.categories || [];
                                                                        const next = current.includes(c) ? current.filter((x: any) => x !== c) : [...current, c];
                                                                        setNewCoupon({ ...newCoupon, conditions: { ...newCoupon.conditions, categories: next } });
                                                                    }}
                                                                    
                                                                >
                                                                    {c}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={addCoupon}
                                                    className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors w-full"
                                                    
                                                >
                                                    🚀 KODLARI OLUŞTUR VE YAYINLA
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-12 lg:col-span-7">
                                        <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all flex-col items-center justify-center" >
                                            <div >🎫</div>
                                            <h3 >Hediye Çeki Yönetimi</h3>
                                            <p >
                                                Sistemde toplam <b>{coupons.length}</b> adet kupon tanımlı. Kodları listelemek, arama yapmak ve Excel/PDF dökümü almak için aşağıdaki yönetim panelini açın.
                                            </p>
                                            <div >
                                                <button
                                                    onClick={() => setShowCouponModal(true)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors"
                                                    
                                                >
                                                    <span>👁️</span> KODLARI YÖNET & LİSTELE
                                                </button>
                                            </div>

                                            <div >
                                                <div >
                                                    <div >AKTİF KODLAR</div>
                                                    <div >{coupons.filter((c: any) => !c.isUsed).length}</div>
                                                </div>
                                                <div >
                                                    <div >KULLANILAN</div>
                                                    <div >{coupons.filter((c: any) => c.isUsed).length}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
    );
}
