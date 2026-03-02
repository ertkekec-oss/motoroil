import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseButton,
    EnterpriseField,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseTabs,
    EnterpriseEmptyState,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

export default function CampaignPointsPanel(props: any) {
    const {
        products,
        allBrands,
        allCats,
        campaigns,
        addCoupon,
        coupons,
        setShowCouponModal,
        referralSettings, setReferralSettings, saveReferralSettings,
        newCampaign, setNewCampaign,
        editingCampaignId, setEditingCampaignId,
        addCampaign, startEditingCampaign, deleteCampaign,
        newCoupon, setNewCoupon,
        custClasses,
        campaignSubTab, setCampaignSubTab,
        exportCouponsExcel, exportCouponsPDF,
    } = props;

    const subTabs = [
        { id: 'loyalty', label: 'Ana Kampanyalar', icon: '✨' },
        { id: 'referral', label: 'Referans Sistemi', icon: '🔗' },
        { id: 'coupons', label: 'Hediye Çekleri', icon: '🎫' },
    ];

    return (
        <EnterprisePageShell
            title="Kampanya & Puan"
            description="Müşteri sadakatini artıracak indirim, puan ve hediye çeki kurgularını yönetin."
        >
            {/* Sub-tab navigation */}
            <EnterpriseTabs
                tabs={subTabs}
                activeTab={campaignSubTab}
                onTabChange={setCampaignSubTab}
            />

            {/* ── 10.1 ANA KAMPANYALAR ── */}
            {campaignSubTab === 'loyalty' && (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    {/* Create / Edit form */}
                    <div className="xl:col-span-2">
                        <EnterpriseCard>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                                {editingCampaignId ? '✏️ Kampanyayı Düzenle' : '+ Yeni Kampanya Tanımla'}
                            </p>
                            <div className="space-y-4">
                                <EnterpriseField label="KAMPANYA ADI">
                                    <EnterpriseInput
                                        type="text"
                                        value={newCampaign.name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                        placeholder="Örn: Hafta Sonu Nakit İndirimi"
                                    />
                                </EnterpriseField>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <EnterpriseField label="KAMPANYA TİPİ">
                                        <EnterpriseSelect
                                            value={newCampaign.type}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCampaign({ ...newCampaign, type: e.target.value })}
                                        >
                                            <option value="payment_method_discount">💳 Ödeme İndirimi</option>
                                            <option value="buy_x_get_discount">🏷️ X Alana % İndirim</option>
                                            <option value="buy_x_get_free">🎁 X Alana Y Bedava</option>
                                            <option value="loyalty_points">💰 Sadakat Puanı</option>
                                        </EnterpriseSelect>
                                    </EnterpriseField>
                                    <EnterpriseField label={newCampaign.type === 'loyalty_points' ? 'KAZANIM (%)' : 'TEMEL İNDİRİM (%)'}>
                                        <EnterpriseInput
                                            type="number"
                                            value={(newCampaign.type === 'loyalty_points' ? (newCampaign.pointsRate || 0) : (newCampaign.discountRate || 0)) * 100}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const val = parseFloat(e.target.value) / 100;
                                                if (newCampaign.type === 'loyalty_points') setNewCampaign({ ...newCampaign, pointsRate: val });
                                                else setNewCampaign({ ...newCampaign, discountRate: val });
                                            }}
                                        />
                                    </EnterpriseField>
                                </div>

                                {/* Conditional fields */}
                                {(newCampaign.type === 'buy_x_get_discount' || newCampaign.type === 'buy_x_get_free') && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kampanya Koşulları</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <EnterpriseField label="ALINACAK MİKTAR (X)">
                                                <EnterpriseInput
                                                    type="number"
                                                    value={newCampaign.conditions.buyQuantity || 1}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, buyQuantity: parseInt(e.target.value) } })
                                                    }
                                                />
                                            </EnterpriseField>
                                            {newCampaign.type === 'buy_x_get_discount' && (
                                                <EnterpriseField label="İNDİRİM ORANI (%)">
                                                    <EnterpriseInput
                                                        type="number"
                                                        value={newCampaign.conditions.rewardValue || 0}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                            setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardValue: parseFloat(e.target.value) } })
                                                        }
                                                    />
                                                </EnterpriseField>
                                            )}
                                        </div>
                                        {newCampaign.type === 'buy_x_get_free' && (
                                            <div className="space-y-3">
                                                <EnterpriseField label="BEDELSİZ VERİLECEK ÜRÜN">
                                                    <EnterpriseSelect
                                                        value={newCampaign.conditions.rewardProductId || ''}
                                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                                            setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardProductId: e.target.value } })
                                                        }
                                                    >
                                                        <option value="">Aynı Üründen</option>
                                                        {(products || []).map((p: any) => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </EnterpriseSelect>
                                                </EnterpriseField>
                                                <EnterpriseField label="BEDELSİZ ADEDİ">
                                                    <EnterpriseInput
                                                        type="number"
                                                        value={newCampaign.conditions.rewardQuantity || 1}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                            setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, reunchQuantity: parseInt(e.target.value) } })
                                                        }
                                                    />
                                                </EnterpriseField>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Hedef müşteri grupları */}
                                {(custClasses || []).length > 0 && (
                                    <EnterpriseField label="HEDEF MÜŞTERİ GRUPLARI">
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {(custClasses || []).map((cc: string) => {
                                                const isSelected = (newCampaign.targetCustomerCategoryIds || []).includes(cc);
                                                return (
                                                    <button
                                                        key={cc}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = newCampaign.targetCustomerCategoryIds || [];
                                                            const next = current.includes(cc) ? current.filter((x: string) => x !== cc) : [...current, cc];
                                                            setNewCampaign({ ...newCampaign, targetCustomerCategoryIds: next });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isSelected ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'}`}
                                                    >
                                                        {cc}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </EnterpriseField>
                                )}

                                {newCampaign.type === 'payment_method_discount' && (
                                    <EnterpriseField label="ÖDEME YÖNTEMİ">
                                        <EnterpriseSelect
                                            value={newCampaign.conditions.paymentMethod || ''}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                                setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, paymentMethod: e.target.value } })
                                            }
                                        >
                                            <option value="">Tüm Yöntemler</option>
                                            <option value="cash">💵 Nakit</option>
                                            <option value="card_single">💳 Kredi Kartı</option>
                                            <option value="transfer">🏦 Havale / EFT</option>
                                        </EnterpriseSelect>
                                    </EnterpriseField>
                                )}

                                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <EnterpriseButton variant="primary" onClick={addCampaign} className="flex-1">
                                        {editingCampaignId ? 'Güncelle' : 'Oluştur'}
                                    </EnterpriseButton>
                                    {editingCampaignId && (
                                        <EnterpriseButton
                                            variant="secondary"
                                            onClick={() => {
                                                setEditingCampaignId(null);
                                                setNewCampaign({
                                                    name: '', type: 'payment_method_discount', discountRate: 0, pointsRate: 0,
                                                    conditions: { brands: [], categories: [], paymentMethod: '', buyQuantity: 1, rewardProductId: '', rewardQuantity: 1, rewardValue: 0, rewardType: 'percentage_discount' },
                                                    targetCustomerCategoryIds: []
                                                });
                                            }}
                                        >
                                            Vazgeç
                                        </EnterpriseButton>
                                    )}
                                </div>
                            </div>
                        </EnterpriseCard>
                    </div>

                    {/* List view */}
                    <div className="xl:col-span-3">
                        <EnterpriseCard noPadding>
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Yayındaki Kampanyalar</h3>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{campaigns.length} Aktif</span>
                            </div>
                            {campaigns.length === 0 ? (
                                <EnterpriseEmptyState
                                    icon="📭"
                                    title="Henüz kampanya yok"
                                    description="Sol formu kullanarak ilk kampanyanızı oluşturun."
                                />
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {campaigns.map((camp: any) => (
                                        <div key={camp.id} className="flex items-center justify-between px-5 py-3.5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                                                    {camp.type === 'loyalty_points' ? '💎' : camp.type === 'buy_x_get_free' ? '🎁' : camp.type === 'buy_x_get_discount' ? '🏷️' : '💳'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{camp.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {camp.type === 'loyalty_points' && 'Sadakat Puanı'}
                                                        {camp.type === 'payment_method_discount' && 'Ödeme İndirimi'}
                                                        {camp.type === 'buy_x_get_discount' && `${camp.conditions.buyQuantity} Alana %${camp.conditions.rewardValue} İndirim`}
                                                        {camp.type === 'buy_x_get_free' && `${camp.conditions.buyQuantity} Alana ${camp.conditions.rewardQuantity} Hediye`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mr-2">
                                                    {camp.type === 'buy_x_get_free' ? `+${camp.conditions.rewardQuantity}` : `%${((camp.discountRate || camp.pointsRate || 0) * 100).toFixed(0)}`}
                                                </span>
                                                <button onClick={() => startEditingCampaign(camp)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">✏️</button>
                                                <button onClick={() => deleteCampaign(camp.id)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors">🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </EnterpriseCard>
                    </div>
                </div>
            )}

            {/* ── 10.2 REFERANS SİSTEMİ ── */}
            {campaignSubTab === 'referral' && (
                <EnterpriseCard>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl">🔗</div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Referans & Ödül Sistemi</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Müşterilerinizin işletmenizi başkalarına tavsiye etmesini teşvik edin.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Referans olan kişiye */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Referans Olan Kişiye Ödül</p>
                            <div className="grid grid-cols-2 gap-3">
                                <EnterpriseField label="ÖDÜL TİPİ">
                                    <EnterpriseSelect
                                        value={referralSettings.referrerRewardType || 'percent'}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReferralSettings({ ...referralSettings, referrerRewardType: e.target.value })}
                                    >
                                        <option value="percent">Yüzde (%)</option>
                                        <option value="amount">Tutar (₺)</option>
                                    </EnterpriseSelect>
                                </EnterpriseField>
                                <EnterpriseField label={referralSettings.referrerRewardType === 'amount' ? 'TUTAR (₺)' : 'ORAN (%)'}>
                                    <EnterpriseInput
                                        type="number"
                                        value={referralSettings.referrerDiscount}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferralSettings({ ...referralSettings, referrerDiscount: parseFloat(e.target.value) || 0 })}
                                    />
                                </EnterpriseField>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Mevcut müşteri, yeni birini getirdiğinde bu değerde indirim kuponu kazanır.</p>
                        </div>

                        {/* Yeni gelen kişiye */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Yeni Gelen Kişiye Hediye</p>
                            <div className="grid grid-cols-2 gap-3">
                                <EnterpriseField label="HEDİYE TİPİ">
                                    <EnterpriseSelect
                                        value={referralSettings.refereeGiftType || 'amount'}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReferralSettings({ ...referralSettings, refereeGiftType: e.target.value })}
                                    >
                                        <option value="percent">Yüzde (%)</option>
                                        <option value="amount">Tutar (₺)</option>
                                    </EnterpriseSelect>
                                </EnterpriseField>
                                <EnterpriseField label={referralSettings.refereeGiftType === 'percent' ? 'ORAN (%)' : 'TUTAR (₺)'}>
                                    <EnterpriseInput
                                        type="number"
                                        value={referralSettings.refereeGift}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferralSettings({ ...referralSettings, refereeGift: parseFloat(e.target.value) || 0 })}
                                    />
                                </EnterpriseField>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Yeni müşteri ilk alışverişinde hoşgeldin indirimi alır.</p>
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-5">
                        <EnterpriseButton variant="primary" onClick={saveReferralSettings}>
                            💾 Sistem Ayarlarını Güncelle
                        </EnterpriseButton>
                    </div>
                </EnterpriseCard>
            )}

            {/* ── 10.3 HEDİYE ÇEKLERİ ── */}
            {campaignSubTab === 'coupons' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Kod üretici formu */}
                    <div className="lg:col-span-2">
                        <EnterpriseCard>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">🎫 Kod Üretici</p>
                            <div className="space-y-4">
                                <EnterpriseField label="KAMPANYA ADI">
                                    <EnterpriseInput
                                        type="text"
                                        value={newCoupon.campaignName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCoupon({ ...newCoupon, campaignName: e.target.value })}
                                        placeholder="Yılbaşı Paket İndirimi"
                                    />
                                </EnterpriseField>
                                <div className="grid grid-cols-2 gap-3">
                                    <EnterpriseField label="ADET">
                                        <EnterpriseInput
                                            type="number"
                                            value={newCoupon.count}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCoupon({ ...newCoupon, count: parseInt(e.target.value) || 1 })}
                                        />
                                    </EnterpriseField>
                                    <EnterpriseField label="SON KULLANIM">
                                        <EnterpriseInput
                                            type="date"
                                            value={newCoupon.expiryDate}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                        />
                                    </EnterpriseField>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <EnterpriseField label="TİP">
                                        <EnterpriseSelect
                                            value={newCoupon.type}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                                        >
                                            <option value="percent">İndirim Oranı (%)</option>
                                            <option value="amount">İndirim Tutarı (₺)</option>
                                        </EnterpriseSelect>
                                    </EnterpriseField>
                                    <EnterpriseField label="DEĞER">
                                        <EnterpriseInput
                                            type="number"
                                            value={newCoupon.value}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })}
                                        />
                                    </EnterpriseField>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <EnterpriseField label="SEPET LİMİTİ (₺)">
                                        <EnterpriseInput
                                            type="number"
                                            value={newCoupon.minPurchaseAmount}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCoupon({ ...newCoupon, minPurchaseAmount: parseFloat(e.target.value) || 0 })}
                                            placeholder="0 (Limitsiz)"
                                        />
                                    </EnterpriseField>
                                    <EnterpriseField label="KULLANIM HAKKI">
                                        <EnterpriseSelect
                                            value={newCoupon.usageLimit}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCoupon({ ...newCoupon, usageLimit: parseInt(e.target.value) })}
                                        >
                                            <option value={1}>1 Seferlik</option>
                                            <option value={0}>Sürekli</option>
                                        </EnterpriseSelect>
                                    </EnterpriseField>
                                </div>

                                <EnterpriseButton variant="primary" onClick={addCoupon} className="w-full">
                                    🚀 Kodları Oluştur & Yayınla
                                </EnterpriseButton>
                            </div>
                        </EnterpriseCard>
                    </div>

                    {/* Kupon yönetim paneli */}
                    <div className="lg:col-span-3">
                        <EnterpriseCard>
                            <div className="flex flex-col items-center text-center py-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl mb-4">🎫</div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Hediye Çeki Yönetimi</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                    Sistemde toplam <b className="text-slate-700 dark:text-slate-300">{coupons.length}</b> adet kupon tanımlı.
                                    Kodları listelemek ve dışa aktarmak için yönetim panelini açın.
                                </p>
                                <div className="flex gap-3 mt-5">
                                    <EnterpriseButton variant="primary" onClick={() => setShowCouponModal(true)}>
                                        👁️ Kodları Yönet
                                    </EnterpriseButton>
                                    <EnterpriseButton variant="secondary" onClick={exportCouponsExcel}>📊 Excel</EnterpriseButton>
                                    <EnterpriseButton variant="secondary" onClick={exportCouponsPDF}>📄 PDF</EnterpriseButton>
                                </div>

                                <div className="flex gap-8 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 w-full justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{coupons.filter((c: any) => !c.isUsed).length}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Aktif Kodlar</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{coupons.filter((c: any) => c.isUsed).length}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Kullanılan</div>
                                    </div>
                                </div>
                            </div>
                        </EnterpriseCard>
                    </div>
                </div>
            )}
        </EnterprisePageShell>
    );
}
