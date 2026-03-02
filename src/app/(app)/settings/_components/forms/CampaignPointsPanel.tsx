import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className={`w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm ${props.className || ''}`}
        />
    );
}

function ERPSelect(props: any) {
    return (
        <select
            {...props}
            className={`w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm ${props.className || ''}`}
        />
    );
}

function ERPField({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
            <label className="text-[12px] font-medium text-slate-500 uppercase tracking-widest transition-colors">{label}</label>
            {children}
        </div>
    );
}

function ERPBlock({ title, description, badge, children, action }: { title?: string, description?: string, badge?: React.ReactNode, children: React.ReactNode, action?: React.ReactNode }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] mb-6">
            {(title || description || action || badge) && (
                <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        {badge}
                        <div>
                            {title && <h3 className="text-[16px] font-semibold text-slate-900">{title}</h3>}
                            {description && <p className="text-[14px] text-slate-500 mt-1">{description}</p>}
                        </div>
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}

function StatStrip({ items }: { items: { val: string | number, label: string }[] }) {
    return (
        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden mb-6 flex divide-x divide-slate-100">
            {items.map((it, idx) => (
                <div key={idx} className="flex-1 p-5">
                    <p className="text-[24px] font-semibold text-slate-900 tracking-tight">{it.val}</p>
                    <p className="text-[12px] font-medium text-slate-500 uppercase tracking-widest mt-1">{it.label}</p>
                </div>
            ))}
        </div>
    );
}

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
        { id: 'loyalty', label: 'Ana Kampanyalar', desc: 'Sisteme kayıtlı otomatik kurgular' },
        { id: 'referral', label: 'Referans Sistemi', desc: 'Affiliate ve tavsiye primleri' },
        { id: 'coupons', label: 'Hediye Çekleri', desc: 'Manuel ve otomatik seri promosyonlar' },
    ];

    return (
        <div className="max-w-6xl animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-[24px] font-semibold text-slate-900 tracking-tight">Promosyon & Finansal Katkı Modülü</h2>
                <p className="text-[14px] text-slate-500 mt-1">Koşullu indirim algoritmaları, çapraz satış kurguları ve hediye çeki yönetimleri.</p>
            </div>

            {/* Navigasyon Strip */}
            <div className="flex bg-white rounded-t-2xl border-b border-slate-200 mb-6 overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.02)]">
                {subTabs.map(tab => {
                    const isActive = campaignSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setCampaignSubTab(tab.id)}
                            className={`flex-1 relative px-6 py-4 flex flex-col items-start gap-1 transition-colors focus:outline-none ${isActive ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                        >
                            <span className={`text-[14px] font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{tab.label}</span>
                            <span className="text-[12px] text-slate-400">{tab.desc}</span>
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── 10.1 ANA KAMPANYALAR ── */}
            {campaignSubTab === 'loyalty' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Liste (Sol/Üst) - 7 kolon */}
                    <div className="lg:col-span-7 space-y-6">
                        <StatStrip items={[
                            { val: campaigns.length, label: 'Yayındaki Kampanya' },
                            { val: campaigns.filter((c: any) => c.type === 'buy_x_get_free').length, label: 'Promosyon Kurgusu' },
                            { val: campaigns.filter((c: any) => c.type === 'loyalty_points').length, label: 'Sadakat Programı' },
                        ]} />

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                            {campaigns.length === 0 ? (
                                <div className="p-12 text-center border-b border-slate-100">
                                    <div className="w-12 h-12 mx-auto bg-slate-50 rounded-xl text-2xl flex items-center justify-center mb-3">📍</div>
                                    <p className="text-[14px] font-medium text-slate-900">Pasif Durumda</p>
                                    <p className="text-[13px] text-slate-500 mt-1">Aktif bir fiyatlandırma kurgusu listelenmedi.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-200">
                                            <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Kurgu Detayı</th>
                                            <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Tip</th>
                                            <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Aksiyon</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {campaigns.map((camp: any) => (
                                            <tr key={camp.id} className="hover:bg-slate-50/50 group">
                                                <td className="px-5 py-3.5">
                                                    <div className="text-[14px] font-medium text-slate-900">{camp.name}</div>
                                                    <div className="text-[12px] text-slate-500 mt-0.5">
                                                        {camp.type === 'loyalty_points' && 'Sadakat Puanı Kazandırır'}
                                                        {camp.type === 'payment_method_discount' && 'Ödeme Tipi İndirimi'}
                                                        {camp.type === 'buy_x_get_discount' && `${camp.conditions.buyQuantity} Alana %${camp.conditions.rewardValue} Koşullu İndirim`}
                                                        {camp.type === 'buy_x_get_free' && `${camp.conditions.buyQuantity} Alana ${camp.conditions.rewardQuantity} Bedelsiz`}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-[11px] font-semibold text-slate-700 uppercase tracking-widest border border-slate-200">
                                                        {camp.type === 'buy_x_get_free' ? `+${camp.conditions.rewardQuantity} BEDELSİZ` : `%${((camp.discountRate || camp.pointsRate || 0) * 100).toFixed(0)} AVANTAJ`}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 w-24">
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditingCampaign(camp)} className="text-[13px] text-slate-600 hover:text-slate-900 font-medium px-2 py-1 bg-white border border-slate-200 rounded shadow-sm">Seç</button>
                                                        <button onClick={() => deleteCampaign(camp.id)} className="text-[13px] text-red-600 hover:text-red-700 font-medium px-2 py-1 bg-white border border-red-200 rounded shadow-sm">Sil</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Form (Sağ) - 5 kolon */}
                    <div className="lg:col-span-5">
                        <ERPBlock title={editingCampaignId ? 'Kurguyu Revize Et' : 'Yeni Kurgu Deklare Et'}>
                            <div className="space-y-4">
                                <ERPField label="Kampanya Adı">
                                    <ERPInput
                                        type="text"
                                        value={newCampaign.name}
                                        onChange={(e: any) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                        placeholder="Sistemsel kod veya kampanya adı"
                                    />
                                </ERPField>

                                <div className="grid grid-cols-2 gap-4">
                                    <ERPField label="Davranış Kipi">
                                        <ERPSelect
                                            value={newCampaign.type}
                                            onChange={(e: any) => setNewCampaign({ ...newCampaign, type: e.target.value })}
                                        >
                                            <option value="payment_method_discount">Ödeme İndirimi</option>
                                            <option value="buy_x_get_discount">Çapraz % İndirim</option>
                                            <option value="buy_x_get_free">Bedelsiz Ürün</option>
                                            <option value="loyalty_points">Puan Biriktir</option>
                                        </ERPSelect>
                                    </ERPField>
                                    <ERPField label={newCampaign.type === 'loyalty_points' ? 'Kazanım Çarpanı (%)' : 'Baz İndirim Oranı (%)'}>
                                        <ERPInput
                                            type="number"
                                            value={(newCampaign.type === 'loyalty_points' ? (newCampaign.pointsRate || 0) : (newCampaign.discountRate || 0)) * 100}
                                            onChange={(e: any) => {
                                                const val = parseFloat(e.target.value) / 100;
                                                if (newCampaign.type === 'loyalty_points') setNewCampaign({ ...newCampaign, pointsRate: val });
                                                else setNewCampaign({ ...newCampaign, discountRate: val });
                                            }}
                                        />
                                    </ERPField>
                                </div>

                                {(newCampaign.type === 'buy_x_get_discount' || newCampaign.type === 'buy_x_get_free') && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 mt-2">
                                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">Algoritma Koşulları</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <ERPField label="Tetikleyici Adet (Buy X)">
                                                <ERPInput
                                                    type="number"
                                                    value={newCampaign.conditions.buyQuantity || 1}
                                                    onChange={(e: any) => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, buyQuantity: parseInt(e.target.value) } })}
                                                />
                                            </ERPField>
                                            {newCampaign.type === 'buy_x_get_discount' && (
                                                <ERPField label="Hak Edilen İnd. (%)">
                                                    <ERPInput
                                                        type="number"
                                                        value={newCampaign.conditions.rewardValue || 0}
                                                        onChange={(e: any) => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardValue: parseFloat(e.target.value) } })}
                                                    />
                                                </ERPField>
                                            )}
                                        </div>
                                        {newCampaign.type === 'buy_x_get_free' && (
                                            <div className="space-y-4">
                                                <ERPField label="Bedelsiz Ürün Tanımı">
                                                    <ERPSelect
                                                        value={newCampaign.conditions.rewardProductId || ''}
                                                        onChange={(e: any) => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardProductId: e.target.value } })}
                                                    >
                                                        <option value="">Aynı Varyanttan Ekle</option>
                                                        {(products || []).map((p: any) => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </ERPSelect>
                                                </ERPField>
                                                <ERPField label="Bedelsiz Adedi (Get Y)">
                                                    <ERPInput
                                                        type="number"
                                                        value={newCampaign.conditions.rewardQuantity || 1}
                                                        onChange={(e: any) => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardQuantity: parseInt(e.target.value) } })}
                                                    />
                                                </ERPField>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(custClasses || []).length > 0 && (
                                    <ERPField label="Sınıflandırma İzolasyonu">
                                        <div className="flex flex-wrap gap-2 pt-1 border border-slate-200 p-2 bg-slate-50 rounded-lg">
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
                                                        className={`px-3 py-1 text-[12px] font-semibold transition-all border rounded ${isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'}`}
                                                    >
                                                        {cc}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </ERPField>
                                )}

                                {newCampaign.type === 'payment_method_discount' && (
                                    <ERPField label="Uygulanacak Ödeme Tipi">
                                        <ERPSelect
                                            value={newCampaign.conditions.paymentMethod || ''}
                                            onChange={(e: any) => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, paymentMethod: e.target.value } })}
                                        >
                                            <option value="">Tümü (Genel Sistem)</option>
                                            <option value="cash">Nakit Transferi</option>
                                            <option value="card_single">Kredi Kartı (Tek Çekim)</option>
                                            <option value="transfer">EFT / Havale</option>
                                        </ERPSelect>
                                    </ERPField>
                                )}

                                <div className="flex gap-3 pt-5 border-t border-slate-100">
                                    <button onClick={addCampaign} className="flex-1 h-10 bg-slate-900 text-white text-[14px] font-medium rounded-lg hover:bg-slate-800 transition-colors">
                                        {editingCampaignId ? 'Protokolü Güncelle' : 'Kayıtlara Ekle'}
                                    </button>
                                    {editingCampaignId && (
                                        <button
                                            onClick={() => {
                                                setEditingCampaignId(null);
                                                setNewCampaign({
                                                    name: '', type: 'payment_method_discount', discountRate: 0, pointsRate: 0,
                                                    conditions: { brands: [], categories: [], paymentMethod: '', buyQuantity: 1, rewardProductId: '', rewardQuantity: 1, rewardValue: 0, rewardType: 'percentage_discount' },
                                                    targetCustomerCategoryIds: []
                                                });
                                            }}
                                            className="px-4 h-10 bg-slate-100 text-slate-700 text-[14px] font-medium rounded-lg hover:bg-slate-200 border border-slate-200 transition-colors"
                                        >
                                            İptal
                                        </button>
                                    )}
                                </div>
                            </div>
                        </ERPBlock>
                    </div>
                </div>
            )}

            {/* ── 10.2 REFERANS SİSTEMİ ── */}
            {campaignSubTab === 'referral' && (
                <ERPBlock
                    title="Komisyon & Affiliate Parametreleri"
                    description="Mevcut ve yeni kazanılan müşterilere tayin edilecek standart promosyon matrisleri."
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Prim Tarafı */}
                        <div className="space-y-4">
                            <h4 className="text-[13px] font-semibold text-slate-900 px-2 border-l-2 border-slate-900">Aracı (Referans) Kazanımı</h4>
                            <div className="p-5 border border-slate-200 bg-white shadow-sm rounded-xl space-y-4">
                                <ERPField label="Hesaplama Modeli">
                                    <ERPSelect
                                        value={referralSettings.referrerRewardType || 'percent'}
                                        onChange={(e: any) => setReferralSettings({ ...referralSettings, referrerRewardType: e.target.value })}
                                    >
                                        <option value="percent">Oransal Kesinti (%)</option>
                                        <option value="amount">Sabit Prim (₺)</option>
                                    </ERPSelect>
                                </ERPField>
                                <ERPField label={referralSettings.referrerRewardType === 'amount' ? 'Prim Değeri (TRY)' : 'Komisyon (%)'}>
                                    <ERPInput
                                        type="number"
                                        value={referralSettings.referrerDiscount}
                                        onChange={(e: any) => setReferralSettings({ ...referralSettings, referrerDiscount: parseFloat(e.target.value) || 0 })}
                                    />
                                </ERPField>
                                <p className="text-[12px] text-slate-500">Hesaba ciro veya komisyon üzerinden hak ediş yansıtır.</p>
                            </div>
                        </div>

                        {/* Yeni Gelen Tarafı */}
                        <div className="space-y-4">
                            <h4 className="text-[13px] font-semibold text-slate-900 px-2 border-l-2 border-emerald-500">Alt Üye Teşviki</h4>
                            <div className="p-5 border border-slate-200 bg-white shadow-sm rounded-xl space-y-4">
                                <ERPField label="İskonto Tipi">
                                    <ERPSelect
                                        value={referralSettings.refereeGiftType || 'amount'}
                                        onChange={(e: any) => setReferralSettings({ ...referralSettings, refereeGiftType: e.target.value })}
                                    >
                                        <option value="percent">İskonto Oranı (%)</option>
                                        <option value="amount">Bakiye Düşümü (₺)</option>
                                    </ERPSelect>
                                </ERPField>
                                <ERPField label={referralSettings.refereeGiftType === 'percent' ? 'Oran (%)' : 'Limit (TRY)'}>
                                    <ERPInput
                                        type="number"
                                        value={referralSettings.refereeGift}
                                        onChange={(e: any) => setReferralSettings({ ...referralSettings, refereeGift: parseFloat(e.target.value) || 0 })}
                                    />
                                </ERPField>
                                <p className="text-[12px] text-slate-500">Sisteme yeni dahil edilen müşteri ID'sine atanacak indirim kotası.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-8">
                        <button
                            onClick={saveReferralSettings}
                            className="h-10 px-6 bg-slate-900 text-white rounded-lg text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            Konfigürasyonu Kaydet
                        </button>
                    </div>
                </ERPBlock>
            )}

            {/* ── 10.3 HEDİYE ÇEKLERİ ── */}
            {campaignSubTab === 'coupons' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Generatör */}
                    <ERPBlock title="Toplu Kod Deklarasyonu" description="Toplu kullanıma açık seri çek varyasyonları oluşturur.">
                        <div className="space-y-5">
                            <ERPField label="Kampanya Ref.">
                                <ERPInput
                                    type="text"
                                    value={newCoupon.campaignName}
                                    onChange={(e: any) => setNewCoupon({ ...newCoupon, campaignName: e.target.value })}
                                    placeholder="DNB-02 B2B Fuar Serisi"
                                />
                            </ERPField>
                            <div className="grid grid-cols-2 gap-4">
                                <ERPField label="Üretim Havuzu (Adet)">
                                    <ERPInput
                                        type="number"
                                        value={newCoupon.count}
                                        onChange={(e: any) => setNewCoupon({ ...newCoupon, count: parseInt(e.target.value) || 1 })}
                                    />
                                </ERPField>
                                <ERPField label="Son Geçerlilik">
                                    <ERPInput
                                        type="date"
                                        value={newCoupon.expiryDate}
                                        onChange={(e: any) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                    />
                                </ERPField>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                                <ERPField label="Kavram">
                                    <ERPSelect
                                        value={newCoupon.type}
                                        onChange={(e: any) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                                    >
                                        <option value="percent">İskonto (%)</option>
                                        <option value="amount">Sabit İndirim (₺)</option>
                                    </ERPSelect>
                                </ERPField>
                                <ERPField label="Tenzil Değeri">
                                    <ERPInput
                                        type="number"
                                        value={newCoupon.value}
                                        onChange={(e: any) => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })}
                                    />
                                </ERPField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <ERPField label="Sepet Alt Limiti (₺)">
                                    <ERPInput
                                        type="number"
                                        value={newCoupon.minPurchaseAmount}
                                        onChange={(e: any) => setNewCoupon({ ...newCoupon, minPurchaseAmount: parseFloat(e.target.value) || 0 })}
                                        placeholder="0 (Limitsiz)"
                                    />
                                </ERPField>
                                <ERPField label="Tüketim">
                                    <ERPSelect
                                        value={newCoupon.usageLimit}
                                        onChange={(e: any) => setNewCoupon({ ...newCoupon, usageLimit: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>1 Kez</option>
                                        <option value={0}>Sınırsız Sürekli</option>
                                    </ERPSelect>
                                </ERPField>
                            </div>

                            <div className="pt-2">
                                <button onClick={addCoupon} className="w-full h-10 bg-slate-900 border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 shadow-sm transition-colors">
                                    Havuzu Tetikle & Kodları Bas
                                </button>
                            </div>
                        </div>
                    </ERPBlock>

                    {/* Analiz Data */}
                    <div className="space-y-6">
                        <StatStrip items={[
                            { val: coupons.filter((c: any) => !c.isUsed).length, label: 'Bekleyen Dağıtım' },
                            { val: coupons.filter((c: any) => c.isUsed).length, label: 'Realize Olan Çek' },
                        ]} />

                        <ERPBlock title="Kayıt Dosyaları & Yönetim" description={`${coupons.length} basılmış kupon bloğunu yönetin veya dışa aktarın.`}>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => setShowCouponModal(true)} className="h-10 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-[14px] font-semibold hover:bg-white transition-colors">
                                    Seri Kontrol Listesi
                                </button>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <button onClick={exportCouponsExcel} className="h-10 bg-white border border-slate-300 rounded-lg text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-colors">
                                        Excel Export
                                    </button>
                                    <button onClick={exportCouponsPDF} className="h-10 bg-white border border-slate-300 rounded-lg text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-colors">
                                        PDF Matrix
                                    </button>
                                </div>
                            </div>
                        </ERPBlock>
                    </div>
                </div>
            )}
        </div>
    );
}
