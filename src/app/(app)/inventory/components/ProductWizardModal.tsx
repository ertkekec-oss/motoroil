"use client";

import React, { useState, useEffect } from "react";
import { ProductPricesTab } from "@/components/pricing/ProductPricesTab";

export default function ProductWizardModal({
    isOpen,
    mode, // "create" | "edit"
    data,
    onChange,
    onClose,
    onSave,
    onDelete,
    isProcessing,
    categories = [],
    allProducts = [],
    // Pricing For Create Mode
    priceLists = [],
    productPrices = {},
    setProductPrices = () => { },
    showOtherPrices = false,
    setShowOtherPrices = () => { },
    // Variants For Create Mode
    useVariants = false,
    setUseVariants = () => { },
    variantAttributes = [],
    selectedAttributes = [],
    setSelectedAttributes = () => { },
    generatedVariants = [],
    setGeneratedVariants = () => { },
    generateCombinations = () => { },
}: any) {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    if (!isOpen || !data) return null;

    const handleNext = () => {
        // Basic UI Validation step 1 (only warning or block if completely empty, per prompt logic remains same, but we can block next if required fields are missing)
        if (currentStep === 1) {
            if (!data.name || !data.category) {
                // We can just let them proceed according to logic, or highlight. The prompt says "Kategori seçilmeden ileriye geçişi UI seviyesinde engelle"
                if (!data.category) return;
            }
        }
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    };

    const handlePrev = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-[3000] flex items-center justify-center p-4">
            {/* Drawer on mobile, Center modal on Desktop */}
            <div className="bg-white rounded-[16px] border border-slate-200 shadow-xl overflow-hidden flex flex-col w-full max-w-[1040px] max-h-[95vh] h-full sm:h-auto sm:min-h-[600px] animate-in slide-in-from-bottom-4 duration-300">

                {/* HEADER */}
                <div className="flex justify-between items-start px-8 py-6 border-b border-slate-200 bg-slate-50/50 shrink-0">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                            {mode === "create" ? "✨ Yeni Ürün" : `✏️ Ürün Düzenle (#${data.code})`}
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">Ürün bilgilerini adım adım tamamlayın.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* STEPPER */}
                <div className="px-8 py-4 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center w-full">
                        {[
                            { step: 1, label: "Kimlik" },
                            { step: 2, label: "Stok & Operasyon" },
                            { step: 3, label: "Fiyat & Vergi" },
                            { step: 4, label: "Varyant & Fiyatlar" },
                            { step: 5, label: "Kontrol & Onay" },
                        ].map((s, idx) => (
                            <React.Fragment key={s.step}>
                                <div className="flex flex-col items-center gap-1 relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${currentStep === s.step ? 'border-slate-900 bg-slate-900 text-white' : currentStep > s.step ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}>
                                        {currentStep > s.step ? "✓" : s.step}
                                    </div>
                                    <span className={`text-[11px] font-semibold mt-1 hidden sm:block ${currentStep === s.step ? 'text-slate-900 underline underline-offset-4 decoration-slate-300' : currentStep > s.step ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {idx < 4 && (
                                    <div className="flex-1 h-1 mx-2 rounded-full bg-slate-200 relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 bg-slate-900 transition-all duration-300 ${currentStep > s.step ? 'w-full !bg-emerald-600' : currentStep === s.step ? 'w-1/2' : 'w-0'}`} />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-8 custom-scroll bg-white">
                    {currentStep === 1 && (
                        <StepIdentity mode={mode} data={data} onChange={onChange} categories={categories} />
                    )}
                    {currentStep === 2 && (
                        <StepStockOps mode={mode} data={data} onChange={onChange} />
                    )}
                    {currentStep === 3 && (
                        <StepPricingTax mode={mode} data={data} onChange={onChange} />
                    )}
                    {currentStep === 4 && (
                        <StepVariantsPriceLists
                            mode={mode} data={data} onChange={onChange} allProducts={allProducts}
                            priceLists={priceLists} productPrices={productPrices} setProductPrices={setProductPrices}
                            showOtherPrices={showOtherPrices} setShowOtherPrices={setShowOtherPrices}
                            useVariants={useVariants} setUseVariants={setUseVariants}
                            variantAttributes={variantAttributes} selectedAttributes={selectedAttributes}
                            setSelectedAttributes={setSelectedAttributes} generatedVariants={generatedVariants}
                            setGeneratedVariants={setGeneratedVariants} generateCombinations={generateCombinations}
                        />
                    )}
                    {currentStep === 5 && (
                        <StepReviewConfirm mode={mode} data={data} onChange={onChange} setCurrentStep={setCurrentStep} priceLists={priceLists} productPrices={productPrices} />
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                    <div>
                        {mode === "edit" && onDelete && (
                            <button
                                onClick={onDelete}
                                className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                            >
                                Ürünü Sil
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={currentStep === 1 ? onClose : handlePrev}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                        >
                            {currentStep === 1 ? "Vazgeç" : "Geri"}
                        </button>

                        {currentStep < totalSteps ? (
                            <button
                                onClick={handleNext}
                                disabled={currentStep === 1 && !data.category}
                                className="px-8 py-2.5 bg-slate-900 border border-transparent text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                İleri
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-block">
                                    Kaydet'e bastığınızda değişiklikler ürüne uygulanır.
                                </span>
                                <button
                                    onClick={onSave}
                                    disabled={isProcessing}
                                    className="px-8 py-2.5 bg-slate-900 border border-transparent text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
                                >
                                    {isProcessing ? "Kaydediliyor..." : (mode === "create" ? "✨ Ürünü Oluştur" : "Değişiklikleri Kaydet")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- STEPS --- //

function StepIdentity({ data, onChange, categories }: any) {
    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 pb-2">
                <h3 className="text-base font-semibold text-slate-900">Kimlik & Tanım</h3>
                <p className="text-sm text-slate-500 mt-1">Ürününüzün sistemde ve listelerde nasıl görüneceğini belirleyin.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Ürün Adı <span className="text-red-500">*</span></label>
                    <input type="text" value={data.name || ''} onChange={e => onChange({ ...data, name: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors placeholder:text-slate-400 text-sm" placeholder="Örn: Motul 7100 10w40" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Kategori <span className="text-red-500">*</span></label>
                    <select value={data.category || ''} onChange={e => onChange({ ...data, category: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors bg-white text-sm">
                        <option value="" disabled>Kategori Seçin</option>
                        {(categories.length > 0 ? categories : ["Motosiklet", "Otomobil", "Aksesuar", "Yedek Parça", "Genel"]).map((c: string) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Marka</label>
                    <input type="text" value={data.brand || ''} onChange={e => onChange({ ...data, brand: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors placeholder:text-slate-400 text-sm" placeholder="Örn: Motul" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">SKU / Stok Kodu <span className="text-red-500">*</span></label>
                    <input type="text" value={data.code || ''} onChange={e => onChange({ ...data, code: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors placeholder:text-slate-400 text-sm" placeholder="Örn: OTO-001" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Barkod</label>
                    <input type="text" value={data.barcode || ''} onChange={e => onChange({ ...data, barcode: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors placeholder:text-slate-400 text-sm" placeholder="13 haneli EAN" />
                </div>
            </div>
        </div>
    );
}

function StepStockOps({ data, onChange }: any) {
    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 pb-2">
                <h3 className="text-base font-semibold text-slate-900">Stok & Operasyon</h3>
                <p className="text-sm text-slate-500 mt-1">Stok takibi, birim tipi ve şube ayarları.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Stok Miktarı</label>
                            <input type="number" value={data.stock ?? 0} onChange={e => onChange({ ...data, stock: parseFloat(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Satış Birimi</label>
                            <select value={data.unit || 'Adet'} onChange={e => onChange({ ...data, unit: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors bg-white text-sm">
                                <option value="Adet">Adet</option>
                                <option value="KG">Kilogram (KG)</option>
                                <option value="Litre">Litre (L)</option>
                                <option value="Metre">Metre (M)</option>
                                <option value="Paket">Paket</option>
                                <option value="Koli">Koli</option>
                                <option value="Set">Set</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Minimum Stok Uyarısı</label>
                        <input type="number" value={data.minStock ?? 5} onChange={e => onChange({ ...data, minStock: parseFloat(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors text-sm" placeholder="Kritik seviye bildirimleri için" />
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Durum</label>
                        <select value={data.status || 'ok'} onChange={e => onChange({ ...data, status: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors bg-white text-sm">
                            <option value="ok">🟢 Aktif (Satışa Açık)</option>
                            <option value="out">🔴 Pasif (Tükendi / Yok)</option>
                            <option value="low">🟠 Düşük Stok Uyarısı</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Operasyonel Açıklama</label>
                        <textarea rows={3} value={data.description || ''} onChange={e => onChange({ ...data, description: e.target.value })} className="w-full rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors p-3 text-sm resize-none" placeholder="İç takip ve depo bilgilendirmesi..." />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepPricingTax({ data, onChange }: any) {
    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 pb-2">
                <h3 className="text-base font-semibold text-slate-900">Fiyat & Vergi</h3>
                <p className="text-sm text-slate-500 mt-1">Net alış/satış fiyatları ve vergi yükümlülükleri.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ALIŞ */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-5">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">🛒 Alış Fiyatlandırması</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1 block">Alış Fiyatı (Net)</label>
                            <div className="flex gap-2">
                                <input type="number" value={data.buyPrice ?? 0} onChange={e => onChange({ ...data, buyPrice: parseFloat(e.target.value) })} className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm" />
                                <select value={data.purchaseCurrency || 'TRY'} onChange={e => onChange({ ...data, purchaseCurrency: e.target.value })} className="w-24 h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm">
                                    <option value="TRY">TRY</option><option value="USD">USD</option><option value="EUR">EUR</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1 block">KDV Oranı</label>
                                <select value={data.purchaseVat ?? 20} onChange={e => onChange({ ...data, purchaseVat: parseInt(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm">
                                    <option value="0">%0</option><option value="1">%1</option><option value="10">%10</option><option value="20">%20</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 mt-5 cursor-pointer">
                                <input type="checkbox" checked={data.purchaseVatIncluded ?? true} onChange={e => onChange({ ...data, purchaseVatIncluded: e.target.checked })} className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900" />
                                <span className="text-sm font-medium text-slate-700">KDV Dahil</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* SATIŞ */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-5">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">💰 Satış Fiyatlandırması</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1 block">Satış Fiyatı (Net)</label>
                            <div className="flex gap-2">
                                <input type="number" value={data.price ?? 0} onChange={e => onChange({ ...data, price: parseFloat(e.target.value) })} className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm" />
                                <select value={data.currency || 'TRY'} onChange={e => onChange({ ...data, currency: e.target.value })} className="w-24 h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm">
                                    <option value="TRY">TRY</option><option value="USD">USD</option><option value="EUR">EUR</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1 block">KDV Oranı</label>
                                <select value={data.salesVat ?? 20} onChange={e => onChange({ ...data, salesVat: parseInt(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm">
                                    <option value="0">%0</option><option value="1">%1</option><option value="10">%10</option><option value="20">%20</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 mt-5 cursor-pointer">
                                <input type="checkbox" checked={data.salesVatIncluded ?? true} onChange={e => onChange({ ...data, salesVatIncluded: e.target.checked })} className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900" />
                                <span className="text-sm font-medium text-slate-700">KDV Dahil</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* EK VERGİ VE GÜMRÜK */}
            <div className="border-t border-slate-200 pt-6">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Ek Vergiler & Gümrük</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">ÖTV Türü</label>
                        <select value={data.otvType || 'Ö.T.V yok'} onChange={e => onChange({ ...data, otvType: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm">
                            <option value="Ö.T.V yok">ÖTV Yok</option>
                            <option value="Liste Fiyatından">Liste Fiyatından</option>
                            <option value="Birim Başına">Birim Başına (Maktu)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">ÖTV Tutarı/Oranı</label>
                        <input type="number" value={data.salesOtv ?? 0} onChange={e => onChange({ ...data, salesOtv: parseFloat(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">ÖİV Tutarı</label>
                        <input type="number" value={data.salesOiv ?? 0} onChange={e => onChange({ ...data, salesOiv: parseFloat(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">GTİP Kodu</label>
                        <input type="text" value={data.gtip || ''} onChange={e => onChange({ ...data, gtip: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm" placeholder="12.34.56.78.90" />
                    </div>
                </div>
            </div>

            {(data.otvType !== 'Ö.T.V yok' || (data.gtip && data.gtip.length > 5)) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-start gap-3 mt-4">
                    <span className="mt-0.5">⚠️</span>
                    <p>Ek vergiler ve gümrük kodları e-Faturalarda otomatik olarak hesaplanıp eklenecektir. Doğru vergi oranlarını girdiğinizden emin olun.</p>
                </div>
            )}
        </div>
    );
}

function StepVariantsPriceLists({
    mode, data, onChange, allProducts,
    priceLists, productPrices, setProductPrices, showOtherPrices, setShowOtherPrices,
    useVariants, setUseVariants, variantAttributes, selectedAttributes, setSelectedAttributes,
    generatedVariants, setGeneratedVariants, generateCombinations
}: any) {

    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 pb-2">
                <h3 className="text-base font-semibold text-slate-900">Varyant & Fiyat Listeleri</h3>
                <p className="text-sm text-slate-500 mt-1">Genişletilmiş fiyat opsiyonları ve çoklu yapılandırmalar.</p>
            </div>

            {mode === "edit" ? (
                <div className="space-y-8">
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">💰 Çoklu Fiyat Yönetimi</h4>
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <ProductPricesTab productId={data.id} />
                        </div>
                    </div>

                    {data.isParent && (
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">🎨 Alt Varyantlar</h4>
                            <div className="space-y-3">
                                {allProducts.filter((p: any) => p.parentId === data.id).map((variant: any) => (
                                    <div key={variant.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                {variant.name.replace(data.name, '').trim() || variant.name}
                                                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">{variant.code}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium mt-1">
                                                Stok: <span className={variant.stock <= 0 ? 'text-red-500' : 'text-emerald-600'}>{variant.stock}</span> |
                                                Fiyat: {Number(variant.price).toLocaleString()} ₺
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {allProducts.filter((p: any) => p.parentId === data.id).length === 0 && (
                                    <div className="text-sm text-slate-500 text-center py-4 bg-white rounded-lg border border-slate-200 border-dashed">
                                        Henüz varyant eklenmemiş.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">💰 Diğer Fiyat Listeleri ({priceLists.filter((pl: any) => ["Perakende", "Toptan"].includes(pl.name)).length})</h4>
                            <button onClick={() => setShowOtherPrices(!showOtherPrices)} className="text-sm text-blue-600 font-semibold">
                                {showOtherPrices ? "Gizle" : "Göster"}
                            </button>
                        </div>
                        {showOtherPrices && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {priceLists.filter((pl: any) => ["Perakende", "Toptan"].includes(pl.name)).map((pl: any) => (
                                    <div key={pl.id} className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">{pl.name}</label>
                                        <div className="relative">
                                            <input type="number" className="w-full h-10 px-3 pl-3 pr-10 rounded-lg border border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm" placeholder="0.00" value={productPrices[pl.id] || ""} onChange={(e) => setProductPrices({ ...productPrices, [pl.id]: parseFloat(e.target.value) })} />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{pl.currency}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">🎨 Varyant Yapılandırması</h4>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                <span className="text-xs font-semibold uppercase text-slate-500">Varyant Kullan</span>
                                <input type="checkbox" checked={useVariants} onChange={(e) => setUseVariants(e.target.checked)} className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900" />
                            </div>
                        </div>

                        {useVariants && (
                            <div className="space-y-5">
                                <div className="flex flex-wrap gap-2">
                                    {variantAttributes.map((attr: any) => (
                                        <button
                                            key={attr.id}
                                            onClick={() => {
                                                if (selectedAttributes.includes(attr.id)) {
                                                    setSelectedAttributes((prev: any) => prev.filter((id: any) => id !== attr.id));
                                                } else {
                                                    setSelectedAttributes((prev: any) => [...prev, attr.id]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border transition-all ${selectedAttributes.includes(attr.id) ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                        >
                                            {attr.name}
                                        </button>
                                    ))}
                                </div>

                                {selectedAttributes.length > 0 && (
                                    <div className="space-y-4">
                                        <button onClick={generateCombinations} className="w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                            🔄 Kombinasyonları Oluştur
                                        </button>
                                        {generatedVariants.length > 0 && (
                                            <div className="space-y-3">
                                                {generatedVariants.map((v: any, idx: number) => (
                                                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg grid grid-cols-4 gap-3 items-end shadow-sm">
                                                        <div>
                                                            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{v.variantLabel}</div>
                                                            <input type="text" className="w-full h-8 px-2 rounded-md border border-slate-300 text-slate-900 text-xs outline-none focus:ring-1 focus:ring-slate-900" value={v.code} onChange={(e) => { const copy = [...generatedVariants]; copy[idx].code = e.target.value; setGeneratedVariants(copy); }} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Stok</div>
                                                            <input type="number" className="w-full h-8 px-2 rounded-md border border-slate-300 text-slate-900 text-xs outline-none focus:ring-1 focus:ring-slate-900" value={v.stock} onChange={(e) => { const copy = [...generatedVariants]; copy[idx].stock = parseFloat(e.target.value); setGeneratedVariants(copy); }} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Alış</div>
                                                            <input type="number" className="w-full h-8 px-2 rounded-md border border-slate-300 text-slate-900 text-xs outline-none focus:ring-1 focus:ring-slate-900" value={v.buyPrice} onChange={(e) => { const copy = [...generatedVariants]; copy[idx].buyPrice = parseFloat(e.target.value); setGeneratedVariants(copy); }} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Satış</div>
                                                            <input type="number" className="w-full h-8 px-2 rounded-md border border-slate-300 text-slate-900 text-xs outline-none focus:ring-1 focus:ring-slate-900" value={v.price} onChange={(e) => { const copy = [...generatedVariants]; copy[idx].price = parseFloat(e.target.value); setGeneratedVariants(copy); }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StepReviewConfirm({ data, setCurrentStep, mode, priceLists, productPrices }: any) {

    const isMissingPrimary = !data.name || !data.category || !data.code || !data.price;

    return (
        <div className="animate-in fade-in duration-300 space-y-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">{data.name || "Ürün Adı Yok"}</h3>
                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-1 font-medium">
                        <span>{data.category || "Genel"}</span> • <span>{data.brand || "Markasız"}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${data.status === 'out' ? 'bg-red-100 text-red-700' : data.status === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {data.status === 'out' ? 'Pasif/Yok' : 'Aktif'}
                    </span>
                    <span className="px-3 py-1 rounded-md bg-white border border-slate-300 text-xs font-mono font-bold text-slate-700">
                        {data.code || "KOD YOK"}
                    </span>
                </div>
            </div>

            {isMissingPrimary && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 font-medium flex items-center gap-2">
                    ⚠️ Bazı temel bilgiler eksik görünüyor (Ürün Adı, Kategori veya Fiyat). İşleme devam edebilirsiniz ancak e-Fatura gibi entegrasyonlarda sorun çıkabilir.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Kimlik Özet */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative group overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-semibold text-slate-900">Kimlik & Tanım</h4>
                        <button onClick={() => setCurrentStep(1)} className="text-xs font-semibold text-slate-500 opacity-0 group-hover:opacity-100 hover:text-slate-900 transition-all underline">Düzenle</button>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Ürün Adı</span><span className="font-semibold text-slate-900">{data.name || "-"}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Kategori</span><span className="font-semibold text-slate-700">{data.category || "-"}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Marka</span><span className="font-semibold text-slate-700">{data.brand || "-"}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">SKU</span><span className="font-semibold text-slate-700">{data.code || "-"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Barkod</span><span className="font-semibold text-slate-700">{data.barcode || "-"}</span></div>
                    </div>
                </div>

                {/* Stok Özet */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative group overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-semibold text-slate-900">Stok & Operasyon</h4>
                        <button onClick={() => setCurrentStep(2)} className="text-xs font-semibold text-slate-500 opacity-0 group-hover:opacity-100 hover:text-slate-900 transition-all underline">Düzenle</button>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Miktar</span><span className="font-semibold text-slate-900">{data.stock ?? 0} {data.unit || 'Adet'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Kritik Eşik</span><span className="font-semibold text-slate-700">{data.minStock ?? 5}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Durum</span><span className="font-semibold text-slate-700">{data.status === 'out' ? 'Pasif' : 'Aktif'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Açıklama</span><span className="font-medium text-slate-700 truncate max-w-[150px]">{data.description || "-"}</span></div>
                    </div>
                </div>

                {/* Fiyat Özet */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative group overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-semibold text-slate-900">Fiyat & Vergi</h4>
                        <button onClick={() => setCurrentStep(3)} className="text-xs font-semibold text-slate-500 opacity-0 group-hover:opacity-100 hover:text-slate-900 transition-all underline">Düzenle</button>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Alış</span><span className="font-semibold text-slate-900">{Number(data.buyPrice || 0).toLocaleString()} {data.purchaseCurrency || 'TRY'} (%{data.purchaseVat}) {data.purchaseVatIncluded ? 'Dahil' : 'Hariç'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Satış</span><span className="font-semibold text-slate-900">{Number(data.price || 0).toLocaleString()} {data.currency || 'TRY'} (%{data.salesVat}) {data.salesVatIncluded ? 'Dahil' : 'Hariç'}</span></div>
                        {data.otvType !== 'Ö.T.V yok' && <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">ÖTV</span><span className="font-semibold text-slate-700">{data.otvType} - {data.salesOtv}</span></div>}
                        {data.salesOiv > 0 && <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">ÖİV</span><span className="font-semibold text-slate-700">{data.salesOiv}</span></div>}
                        {data.gtip && <div className="flex justify-between"><span className="text-slate-500">GTİP</span><span className="font-mono font-medium text-slate-700">{data.gtip}</span></div>}
                    </div>
                </div>

                {/* Varyantlar */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative group overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-semibold text-slate-900">Varyant & Liste</h4>
                        <button onClick={() => setCurrentStep(4)} className="text-xs font-semibold text-slate-500 opacity-0 group-hover:opacity-100 hover:text-slate-900 transition-all underline">Düzenle</button>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500">Varyant Yapısı</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${data.isParent || (data.variantsData && data.variantsData.length > 0) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {data.isParent || (data.variantsData && data.variantsData.length > 0) ? 'AKTiF' : 'YOK'}
                            </span>
                        </div>
                        {mode === "create" && Object.keys(productPrices).length > 0 && (
                            <div className="flex justify-between"><span className="text-slate-500">Ek Fiyat Listesi</span><span className="font-semibold text-slate-700">{Object.keys(productPrices).length} adet liste tanımlı</span></div>
                        )}
                        {mode === "edit" && (
                            <div className="flex justify-between"><span className="text-slate-500">Çoklu Fiyat Listesi</span><span className="font-semibold text-slate-700 text-right">Düzenlemek için <br />'Varyant & Fiyatlar' sekmesine gidin.</span></div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
