"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProductPricesTab } from "@/components/pricing/ProductPricesTab";
import ProductImageUpload from "./ProductImageUpload";
import { Package, Settings, FileText, Printer, FileDown, PlusCircle, ShoppingCart } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

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
    
    const router = useRouter();
    const { showSuccess, showError, showWarning, showPrompt } = useModal();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== "application/pdf") {
            showWarning("Uyumsuz Format", "Sadece PDF formatında döküman yüklenebilir.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showWarning("Boyut Aşımı", "Dosya boyutu 5MB'dan büyük olamaz.");
            return;
        }
        
        setIsUploading(true);
        
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("productId", data?.id || "temp");

            const res = await fetch("/api/uploads/products/document", {
                method: "POST",
                body: formData,
            });

            const uploadData = await res.json();

            if (!res.ok || uploadData.error) {
                throw new Error(uploadData.error || "Yükleme başarısız");
            }

            showSuccess("Başarılı", "Döküman başarıyla yüklendi ve ürüne bağlandı.");
            if (onChange && data) {
                onChange({ ...data, documentName: uploadData.documentName, documentUrl: uploadData.documentUrl });
            }
        } catch (error: any) {
            console.error("Document upload error:", error);
            showError("Hata", error.message || "Döküman yüklenirken bir hata oluştu.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
        }
    }, [isOpen, data?.id]);

    if (!isOpen || !data) return null;

    const handleNext = () => {
        if (currentStep === 1) {
            if (!data.name) return;
        }
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    };

    const handlePrev = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-[3000] flex items-center justify-center p-4">
            {/* Drawer on mobile, Center modal on Desktop */}
            <div className="bg-white dark:bg-[#0f172a] rounded-[16px] border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden flex flex-col w-full max-w-[1040px] max-h-[95vh] h-full sm:h-auto sm:min-h-[600px] animate-in slide-in-from-bottom-4 duration-300">

                {/* HEADER */}
                <div className="flex justify-between items-start px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#1e293b]/50 shrink-0">
                    <div className="flex flex-col gap-1 w-full pr-8">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {mode === "create" ? 
                                    <><span className="text-amber-500"><Package size={20} /></span> Yeni Ürün Ekle</> : 
                                    <><span className="text-emerald-500"><Settings size={20} /></span> Ürün Düzenle (#{(data.code || "").toUpperCase()})</>
                                }
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ürün bilgilerini adım adım tamamlayın.</p>
                        </div>

                        {mode === "edit" && (
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                {/* STATS */}
                                <div className="flex items-center gap-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 px-4 py-2 rounded-xl shadow-sm text-xs">
                                    <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alış</span><span className="font-black text-slate-700 dark:text-slate-200">{Number(data.buyPrice || 0).toLocaleString()} ₺</span></div>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>
                                    <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Satış</span><span className="font-black text-emerald-600 dark:text-emerald-400">{Number(data.price || 0).toLocaleString()} ₺</span></div>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>
                                    <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Toplam Stok</span><span className="font-black text-slate-700 dark:text-slate-200">{data.stock || 0}</span></div>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>
                                    <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Stok Değeri</span><span className="font-black text-blue-600 dark:text-blue-400">{Number((data.stock || 0) * (data.buyPrice || 0)).toLocaleString()} ₺</span></div>
                                </div>
                                
                                <div className="mx-2 h-6 w-px bg-slate-200 dark:bg-white/10 hidden lg:block"></div>
                                
                                {/* ACTIONS */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button onClick={() => { router.push('/purchasing'); onClose(); }} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors shadow-sm">
                                        <ShoppingCart size={14} /> Tedarikçiden Alış Yap
                                    </button>
                                    <button onClick={() => { router.push('/inventory?action=count'); onClose(); }} className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-sky-100 transition-colors shadow-sm">
                                        <PlusCircle size={14} /> Manuel Stok Ekle
                                    </button>
                                    <button onClick={() => { router.push('/reports?type=product_statement&product=' + data.id); onClose(); }} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 dark:bg-[#0f172a] dark:border-white/10 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
                                        <FileText size={14} /> Ekstre Al
                                    </button>
                                    
                                    <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleDocumentUpload} />
                                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 dark:bg-[#0f172a] dark:border-white/10 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
                                        {isUploading ? (
                                            <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                        ) : <FileDown size={14} />} 
                                        {isUploading ? "Yükleniyor..." : "Döküman Yükle"}
                                    </button>
                                    
                                    <button onClick={() => { router.push('/inventory/labels?product=' + data.id); onClose(); }} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 dark:bg-[#0f172a] dark:border-white/10 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
                                        <Printer size={14} /> Etiket Yazdır
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#334155]/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors shadow-sm z-50"
                    >
                        ✕
                    </button>
                </div>

                {/* STEPPER */}
                <div className="px-8 py-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] shrink-0">
                    <div className="flex items-center w-full">
                        {[
                            { step: 1, label: "Ürün Kimliği" },
                            { step: 2, label: "Fiyatlandırma" },
                            { step: 3, label: "Diğer Bilgiler" },
                            { step: 4, label: "Varyant & Fiyatlar" },
                            { step: 5, label: "Bağlı Ürünler" },
                        ].map((s, idx) => (
                            <React.Fragment key={s.step}>
                                <div className="flex flex-col items-center gap-1 relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${currentStep === s.step ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : currentStep > s.step ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-500 dark:bg-[#1e293b] dark:border-slate-600 dark:text-slate-400'}`}>
                                        {currentStep > s.step ? "✓" : s.step}
                                    </div>
                                    <span className={`text-[11px] font-semibold mt-1 hidden xl:block whitespace-nowrap ${currentStep === s.step ? 'text-slate-900 dark:text-white underline underline-offset-4 decoration-slate-300 dark:decoration-slate-500' : currentStep > s.step ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {idx < 4 && (
                                    <div className="flex-1 h-1 mx-2 rounded-full bg-slate-200 dark:bg-white/10 relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 bg-slate-900 dark:bg-white transition-all duration-300 ${currentStep > s.step ? 'w-full !bg-emerald-600' : currentStep === s.step ? 'w-1/2' : 'w-0'}`} />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-8 custom-scroll bg-white dark:bg-[#0f172a]">
                    {currentStep === 1 && (
                        <StepIdentity mode={mode} data={data} onChange={onChange} categories={categories} />
                    )}
                    {currentStep === 2 && (
                        <StepPricingTax mode={mode} data={data} onChange={onChange} />
                    )}
                    {currentStep === 3 && (
                        <StepOtherInfo mode={mode} data={data} onChange={onChange} categories={categories} />
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
                        <StepConnectedProducts mode={mode} data={data} onChange={onChange} setCurrentStep={setCurrentStep} />
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex items-center justify-between shrink-0">
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
                            className="px-6 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            {currentStep === 1 ? "Vazgeç" : "Geri"}
                        </button>

                        {currentStep < totalSteps ? (
                            <button
                                onClick={handleNext}
                                disabled={currentStep === 1 && !data.name}
                                className="px-8 py-2.5 bg-slate-900 dark:bg-white border border-transparent text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                İleri
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline-block">
                                    Kaydet'e bastığınızda değişiklikler ürüne uygulanır.
                                </span>
                                <button
                                    onClick={onSave}
                                    disabled={isProcessing}
                                    className="px-8 py-2.5 bg-slate-900 dark:bg-white border border-transparent text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="mb-2 border-b border-slate-200 dark:border-white/5 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">1. Aşama: Ürün Kimliği</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Lütfen sadece temel ürün kimliğini ve tipini belirleyin.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    <div className="space-y-2 relative">
                        <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Ürün Adı <span className="text-red-500">*</span></label>
                        <input type="text" value={data.name || ''} onChange={e => onChange({ ...data, name: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400 text-[15px] font-medium shadow-sm hover:border-slate-400" placeholder="Örn: Profesyonel Hizmet veya Ürün Adı" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Ürün Tipi <span className="text-red-500">*</span></label>
                        <select value={data.type || 'Stoklu Ürün'} onChange={e => onChange({ ...data, type: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none transition-all bg-white dark:bg-[#0f172a] text-[15px] font-medium shadow-sm hover:border-slate-400">
                            <option value="Stoklu Ürün">Stoklu Ürün</option>
                            <option value="Hizmet / Danışmanlık">Hizmet / Danışmanlık</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Ürün Durumu <span className="text-red-500">*</span></label>
                        <select value={data.status || 'Aktif'} onChange={e => onChange({ ...data, status: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white dark:bg-[#0f172a] text-[15px] font-medium shadow-sm hover:border-slate-400">
                            <option value="Aktif">Aktif</option>
                            <option value="Pasif">Pasif</option>
                            <option value="Stokta Yok">Stokta Yok</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Satış Birimi</label>
                        <select value={data.unit || 'Adet'} onChange={e => onChange({ ...data, unit: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none transition-all bg-white dark:bg-[#0f172a] text-[15px] font-medium shadow-sm hover:border-slate-400">
                            <option value="Adet">Adet</option>
                            <option value="Ay">Ay</option>
                            <option value="Bağ">Bağ</option>
                            <option value="Bidon">Bidon</option>
                            <option value="Boy">Boy</option>
                            <option value="Cc">Cc</option>
                            <option value="Cilt">Cilt</option>
                            <option value="Cm">Cm</option>
                            <option value="Cm2">Cm2</option>
                            <option value="Çift">Çift</option>
                            <option value="Çuval">Çuval</option>
                            <option value="Dakika">Dakika</option>
                            <option value="Dekar">Dekar</option>
                            <option value="Desi">Desi</option>
                            <option value="Deste">Deste</option>
                            <option value="Dilim">Dilim</option>
                            <option value="Dönem">Dönem</option>
                            <option value="Düzine">Düzine</option>
                            <option value="Galon">Galon</option>
                            <option value="Gram">Gram</option>
                            <option value="KG">Kg</option>
                            <option value="Litre">Litre</option>
                            <option value="Metre">Metre</option>
                            <option value="Paket">Paket</option>
                            <option value="Koli">Koli</option>
                            <option value="Set">Set</option>
                            <option value="Takım">Takım</option>
                            <option value="Saat">Saat</option>
                            <option value="Yıl">Yıl</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-6 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 border-dashed">
                    <div className="text-center space-y-2 mb-2">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ürün Görseli</h4>
                        <p className="text-xs text-slate-500">Katalog ve vitrinlerde gösterilecek ana görseli yükleyin.</p>
                    </div>
                    <ProductImageUpload
                        productId={data.id}
                        imageUrl={data.imageUrl}
                        onImageUpload={({ imageUrl, imageKey }) => {
                            onChange({ ...data, imageUrl, imageKey });
                        }}
                    />
                    
                    {data.documentName && (
                        <div className="w-full mt-2 p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                    <FileText size={16} />
                                </div>
                                <div className="truncate text-left">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{data.documentName}</p>
                                    <p className="text-[10px] text-slate-500">PDF Dökümanı</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {data.documentUrl && (
                                    <a href={data.documentUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 transition-colors" title="Görüntüle">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </a>
                                )}
                                <button onClick={() => onChange({...data, documentName: null, documentUrl: null})} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors" title="Kaldır">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StepPricingTax({ data, onChange }: any) {
    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 dark:border-white/5 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">2. Aşama: Fiyatlandırma</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Detaylı alış ve satış fiyatlarınızı, vergi oranlarınızı yapılandırın.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SATIŞ FİYATI KARTI */}
                <div className="bg-slate-50 dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-white/5 space-y-5">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">💰 Satış Fiyatlandırması</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1 block">Satış Fiyatı <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input type="number" value={data.price ?? 0} onChange={e => onChange({ ...data, price: parseFloat(e.target.value) })} className="flex-1 h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none transition-all shadow-sm hover:border-slate-400" />
                                <select value={data.currency || 'TRY'} onChange={e => onChange({ ...data, currency: e.target.value })} className="w-24 h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none transition-all shadow-sm font-semibold">
                                    <option value="TRY">TRY</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                                    <option value="CHF">CHF</option><option value="RUB">RUB</option><option value="AED">AED</option><option value="SAR">SAR</option><option value="QAR">QAR</option><option value="CNY">CNY</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1 block">Satış KDV Oranı</label>
                                <select value={data.salesVat ?? 20} onChange={e => onChange({ ...data, salesVat: parseFloat(e.target.value) })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm">
                                    <option value="0">%0</option>
                                    <option value="1">%1</option>
                                    <option value="4">%4</option>
                                    <option value="5">%5</option>
                                    <option value="5.5">%5.5</option>
                                    <option value="6">%6</option>
                                    <option value="7">%7</option>
                                    <option value="8">%8</option>
                                    <option value="9">%9</option>
                                    <option value="10">%10</option>
                                    <option value="11">%11</option>
                                    <option value="12">%12</option>
                                    <option value="12.6">%12.6</option>
                                    <option value="13">%13</option>
                                    <option value="14">%14</option>
                                    <option value="15">%15</option>
                                    <option value="16">%16</option>
                                    <option value="18">%18</option>
                                    <option value="19">%19</option>
                                    <option value="20">%20</option>
                                    <option value="21">%21</option>
                                    <option value="23">%23</option>
                                    <option value="24">%24</option>
                                    <option value="27">%27</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1 block">KDV Durumu</label>
                                <select value={data.salesVatIncluded ? 'true' : 'false'} onChange={e => onChange({ ...data, salesVatIncluded: e.target.value === 'true' })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm">
                                    <option value="false">KDV Hariç</option>
                                    <option value="true">KDV Dahil</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1 block">ÖİV Oranı (%)</label>
                                <select value={data.salesOiv ?? 0} onChange={e => onChange({ ...data, salesOiv: parseFloat(e.target.value) })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-slate-900 outline-none">
                                    <option value="0">Ö.İ.V yok</option>
                                    <option value="7.5">%7.5</option>
                                    <option value="10">%10</option>
                                    <option value="25">%25</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1 block">ÖTV Tipi</label>
                                <select value={data.otvType || 'Ö.T.V yok'} onChange={e => onChange({ ...data, otvType: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-slate-900 outline-none">
                                    <option value="Ö.T.V yok">ÖTV Yok</option>
                                    <option value="Yüzdesel">Yüzdesel ÖTV</option>
                                    <option value="Birim Başına">Maktu ÖTV</option>
                                </select>
                            </div>
                        </div>
                        {data.otvType !== 'Ö.T.V yok' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs uppercase tracking-wide text-purple-600 dark:text-purple-400 font-bold mb-1 block">Satış ÖTV {data.otvType === 'Yüzdesel' ? 'Oranı (%)' : 'Tutarı'}</label>
                                    <input type="number" value={data.salesOtv ?? 0} onChange={e => onChange({ ...data, salesOtv: parseFloat(e.target.value) })} className="w-full h-12 px-3 rounded-xl border-2 border-purple-200 dark:border-purple-500/30 text-slate-900 dark:text-white focus:ring-0 focus:border-purple-500 outline-none shadow-sm transition-all bg-purple-50/30 dark:bg-purple-900/10" placeholder="0.00" />
                                </div>
                                {data.salesOtv > 0 && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-xs uppercase tracking-wide text-purple-600 dark:text-purple-400 font-bold mb-1 block">Ö.T.V Kodu</label>
                                        <select value={data.otvCode || '0071'} onChange={e => onChange({ ...data, otvCode: e.target.value })} className="w-full h-12 px-3 rounded-xl border-2 border-purple-200 dark:border-purple-500/30 text-slate-900 dark:text-white focus:ring-0 focus:border-purple-500 outline-none shadow-sm transition-all bg-purple-50/30 dark:bg-purple-900/10">
                                            <option value="0071">0071 - Özel Tüketim Vergisi</option>
                                            <option value="0073">0073 - Kolalı Gazozlardan Alınan ÖTV</option>
                                            <option value="0074">0074 - Alkollü İçeceklerden Alınan ÖTV</option>
                                            <option value="0075">0075 - Tütün Mamüllerinden Alınan ÖTV</option>
                                            <option value="0076">0076 - Motorlu Taşıtlardan Alınan ÖTV</option>
                                            <option value="0077">0077 - Elektrik ve Havagazı Tüketim Vergisi</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ALIŞ FİYATI KARTI */}
                <div className="bg-slate-50 dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-white/5 space-y-5">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">🛒 Alış Fiyatlandırması</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1 block">Alış Fiyatı <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input type="number" value={data.buyPrice ?? 0} onChange={e => onChange({ ...data, buyPrice: parseFloat(e.target.value) })} className="flex-1 h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm hover:border-slate-400 transition-all" />
                                <select value={data.purchaseCurrency || 'TRY'} onChange={e => onChange({ ...data, purchaseCurrency: e.target.value })} className="w-24 h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm font-semibold transition-all">
                                    <option value="TRY">TRY</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                                    <option value="CHF">CHF</option><option value="RUB">RUB</option><option value="AED">AED</option><option value="SAR">SAR</option><option value="QAR">QAR</option><option value="CNY">CNY</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1 block">Alış KDV Oranı</label>
                                <select value={data.purchaseVat ?? 20} onChange={e => onChange({ ...data, purchaseVat: parseFloat(e.target.value) })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 text-sm shadow-sm outline-none">
                                    <option value="0">%0</option>
                                    <option value="1">%1</option>
                                    <option value="4">%4</option>
                                    <option value="5">%5</option>
                                    <option value="5.5">%5.5</option>
                                    <option value="6">%6</option>
                                    <option value="7">%7</option>
                                    <option value="8">%8</option>
                                    <option value="9">%9</option>
                                    <option value="10">%10</option>
                                    <option value="11">%11</option>
                                    <option value="12">%12</option>
                                    <option value="12.6">%12.6</option>
                                    <option value="13">%13</option>
                                    <option value="14">%14</option>
                                    <option value="15">%15</option>
                                    <option value="16">%16</option>
                                    <option value="18">%18</option>
                                    <option value="19">%19</option>
                                    <option value="20">%20</option>
                                    <option value="21">%21</option>
                                    <option value="23">%23</option>
                                    <option value="24">%24</option>
                                    <option value="27">%27</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1 block">KDV Durumu</label>
                                <select value={data.purchaseVatIncluded ? 'true' : 'false'} onChange={e => onChange({ ...data, purchaseVatIncluded: e.target.value === 'true' })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 text-sm shadow-sm outline-none">
                                    <option value="false">KDV Hariç</option>
                                    <option value="true">KDV Dahil</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1 block">Alış İskontosu (%)</label>
                                <input type="number" value={data.purchaseDiscount ?? 0} onChange={e => onChange({ ...data, purchaseDiscount: parseFloat(e.target.value) })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm" placeholder="Örn: 15" />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1 block">Alış ÖTV Oranı (%)</label>
                                <input type="number" value={data.purchaseOtv ?? 0} onChange={e => onChange({ ...data, purchaseOtv: parseFloat(e.target.value) })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm" placeholder="Örn: 0" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepOtherInfo({ data, onChange, categories }: any) {
    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 dark:border-white/5 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">3. Aşama: Diğer Bilgiler</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stok kodu, fatura ayarları ve ürüne dair detaylar.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Kategori</label>
                    <select value={data.category || ''} onChange={e => onChange({ ...data, category: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none bg-white dark:bg-[#0f172a] shadow-sm">
                        <option value="" disabled>Kategori Seçin</option>
                        {(categories.length > 0 ? categories : ["Motosiklet", "Otomobil", "Aksesuar", "Yedek Parça", "Genel"]).map((c: string) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Marka</label>
                    <input type="text" value={data.brand || ''} onChange={e => onChange({ ...data, brand: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Ürün Kodu (SKU) <span className="text-red-500">*</span></label>
                    <input type="text" value={data.code || ''} onChange={e => onChange({ ...data, code: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm font-mono text-sm" />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">GTİP</label>
                    <input type="text" value={data.gtip || ''} onChange={e => onChange({ ...data, gtip: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm font-mono text-sm" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">GTIN</label>
                    <input type="text" value={data.gtin || ''} onChange={e => onChange({ ...data, gtin: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm font-mono text-sm" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Ülke Kodu (Menşei)</label>
                    <input type="text" value={data.countryCode || ''} onChange={e => onChange({ ...data, countryCode: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm uppercase font-mono text-sm" placeholder="TR" maxLength={2} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6 p-6 bg-slate-50 dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Fatura Başlığı (İsteğe Bağlı)</label>
                        <p className="text-[11px] text-slate-500 mb-2">Fatura çıktısında farklı bir ürün adı kullanmak istiyorsanız doldurun. Boş bırakırsanız mevcut Ürün Adı kullanılacaktır.</p>
                        <input type="text" value={data.invoiceTitle || ''} onChange={e => onChange({ ...data, invoiceTitle: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm placeholder:text-slate-400" placeholder="Faturada görünecek isim..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Açıklama</label>
                        <p className="text-[11px] text-slate-500 mb-2">Bu ürün hakkında not. E-ticaret entegrasyonlarınızda da gösterilir.</p>
                        <textarea rows={3} value={data.description || ''} onChange={e => onChange({ ...data, description: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none p-4 resize-none shadow-sm" placeholder="Ürün detayları..." />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl hover:border-slate-300 transition-colors">
                        <input type="checkbox" checked={data.showDescriptionOnInvoice ?? false} onChange={e => onChange({ ...data, showDescriptionOnInvoice: e.target.checked })} className="w-5 h-5 text-slate-900 dark:text-white rounded border-slate-300 focus:ring-slate-900" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Açıklama metnini faturada göster</span>
                    </label>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
                            <span>Barkod</span>
                            <button type="button" onClick={() => onChange({ ...data, barcode: Math.floor(1000000000000 + Math.random() * 9000000000000).toString() })} className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-0.5 rounded-md font-bold transition-colors">BARKOD ÜRET</button>
                        </label>
                        <input type="text" value={data.barcode || ''} onChange={e => onChange({ ...data, barcode: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Raf Yeri</label>
                        <input type="text" value={data.shelfLocation || ''} onChange={e => onChange({ ...data, shelfLocation: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm" placeholder="Örn: A-12-C" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Kritik Stok Miktarı</label>
                        <input type="number" value={data.minStock ?? 5} onChange={e => onChange({ ...data, minStock: parseFloat(e.target.value) })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm" placeholder="Uyarı seviyesi" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Etiketler (Muadil Kodları vs)</label>
                        <input type="text" value={data.tags || ''} onChange={e => onChange({ ...data, tags: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none shadow-sm placeholder:text-slate-400" placeholder="Aralarına virgül koyarak yazın..." />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepVariantsPriceLists({
    mode, data, onChange, allProducts,
    priceLists, productPrices, setProductPrices, showOtherPrices, setShowOtherPrices,
    useVariants, setUseVariants, variantAttributes, selectedAttributes, setSelectedAttributes,
    generatedVariants, setGeneratedVariants, generateCombinations
}: any) {
    const { showSuccess, showPrompt } = useModal();

    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 dark:border-white/5 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Varyant & Fiyat Listeleri</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Genişletilmiş fiyat opsiyonları ve çoklu yapılandırmalar.</p>
            </div>

            <div className="space-y-8">
                {mode === "edit" && (
                    <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-white/5 p-6">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">💰 Çoklu Fiyat Yönetimi</h4>
                        <div className="bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-white/5 p-4">
                            <ProductPricesTab productId={data.id} />
                        </div>
                    </div>
                )}

                {mode === "edit" && data.isParent && (
                    <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-white/5 p-6">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">🎨 Mevcut Alt Varyantlar</h4>
                        <div className="space-y-3">
                            {allProducts.filter((p: any) => p.parentId === data.id).map((variant: any) => (
                                <div key={variant.id} className="flex justify-between items-center p-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg shadow-sm">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                            {variant.name.replace(data.name, '').trim() || variant.name}
                                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#334155]/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">{variant.code}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                            Stok: <span className={variant.stock <= 0 ? 'text-red-500' : 'text-emerald-600'}>{variant.stock}</span> |
                                            Fiyat: {Number(variant.price).toLocaleString()} ₺
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {allProducts.filter((p: any) => p.parentId === data.id).length === 0 && (
                                <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-white/5 border-dashed">
                                    Henüz varyant eklenmemiş.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mode === "create" && (
                    <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-white/5 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">💰 Diğer Fiyat Listeleri ({priceLists.filter((pl: any) => ["Perakende", "Toptan"].includes(pl.name)).length})</h4>
                            <button onClick={() => setShowOtherPrices(!showOtherPrices)} className="text-sm text-blue-600 font-semibold">
                                {showOtherPrices ? "Gizle" : "Göster"}
                            </button>
                        </div>
                        {showOtherPrices && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {priceLists.filter((pl: any) => ["Perakende", "Toptan"].includes(pl.name)).map((pl: any) => (
                                    <div key={pl.id} className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{pl.name}</label>
                                        <div className="relative">
                                            <input type="number" className="w-full h-10 px-3 pl-3 pr-10 rounded-lg border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-slate-900 outline-none text-sm" placeholder="0.00" value={productPrices[pl.id] || ""} onChange={(e) => setProductPrices({ ...productPrices, [pl.id]: parseFloat(e.target.value) })} />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{pl.currency}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-white/5 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">🎨 Varyant Yapılandırması</h4>
                        <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5">
                            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Varyant Kullan</span>
                            <input type="checkbox" checked={useVariants} onChange={(e) => setUseVariants(e.target.checked)} className="w-4 h-4 text-slate-900 dark:text-white rounded border-slate-300 dark:border-white/10 focus:ring-slate-900" />
                        </div>
                    </div>

                    {useVariants && (
                        <div className="space-y-5">
                            <div className="flex flex-wrap gap-2 items-center">
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
                                
                                <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>
                                
                                <button
                                    onClick={() => {
                                        showPrompt("Yeni Özellik Ekle", "Yeni Variant Özelliği Adı (Örn: Renk, Beden, Malzeme):", (name) => {
                                        if (name) {
                                            fetch('/api/products/attributes', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ name, values: ["Tanımsız"] })
                                            })
                                            .then(res => res.json())
                                            .then(data => {

                                                if(data.success && window.location.reload) {
                                                    showSuccess("Bilgi", "Varyant Özelliği eklendi! Sisteme işlenmesi için sayfa yenileniyor...");
                                                    window.location.reload();
                                                } else {
                                                    showSuccess("Bilgi", "Eklenirken bir sorun oluştu.");
                                                }
                                            });
                                        }
                                        });
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-dashed border-slate-300 dark:border-white/20 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center gap-1"
                                >
                                    + Yeni Özellik
                                </button>
                            </div>

                            {selectedAttributes.length > 0 && (
                                <div className="space-y-4">
                                    <button onClick={generateCombinations} className="w-full py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                        🔄 Kombinasyonları Oluştur
                                    </button>
                                    {generatedVariants.length > 0 && (
                                        <div className="space-y-3">
                                            {generatedVariants.map((v: any, idx: number) => (
                                                <div key={idx} className="p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg grid grid-cols-4 gap-3 items-end shadow-sm">
                                                    <div>
                                                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{v.variantLabel}</div>
                                                        <input type="text" className="w-full h-8 px-2 rounded-md border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-slate-900" value={v.code} onChange={(e) => { const copy = [...generatedVariants]; copy[idx].code = e.target.value; setGeneratedVariants(copy); }} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Stok</div>
                                                        <input type="number" className="w-full h-8 px-2 rounded-md border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-slate-900" value={v.stock} onChange={(e) => { const copy = [...generatedVariants]; copy[idx].stock = parseFloat(e.target.value); setGeneratedVariants(copy); }} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Alış</div>
                                                        <input type="number" className="w-full h-8 px-2 rounded-md border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-slate-900" value={v.buyPrice} onChange={(e) => { const copy = [...generatedVariants]; copy[idx].buyPrice = parseFloat(e.target.value); setGeneratedVariants(copy); }} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Satış</div>
                                                        <input type="number" className="w-full h-8 px-2 rounded-md border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-slate-900" value={v.price} onChange={(e) => { const copy = [...generatedVariants]; copy[idx].price = parseFloat(e.target.value); setGeneratedVariants(copy); }} />
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
        </div>
    );
}

function StepConnectedProducts({ mode, data, onChange, setCurrentStep }: any) {

    const isMissingPrimary = !data.name || !data.category || !data.code || !data.price;

    return (
        <div className="animate-in fade-in duration-300 space-y-6">
            <div className="mb-2 border-b border-slate-200 dark:border-white/5 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">5. Aşama: Bağlı Ürünler & Onay</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sistem entegrasyonlarını yapılandırın ve kaydetmeden önce son kontrolleri yapın.</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{data.name || "Ürün Adı Yok"}</h3>
                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1 font-medium">
                        <span>{data.category || "Kategori Seçilmedi"}</span> • <span>{data.brand || "Markasız"}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <span className="px-3 py-1 rounded-md bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        SKU: {data.code || "YOK"}
                    </span>
                </div>
            </div>

            {isMissingPrimary && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium flex items-center gap-3 shadow-sm">
                    <span className="text-lg">⚠️</span>
                    <p>Dikkat! Ürün Adı, Kategori, Stok Kodu (SKU) veya Fiyat gibi <b>zorunlu bazı alanlar boş bırakılmış</b>. İşleme devam edebilirsiniz ancak entegrasyonlarda ve satış raporlarında sorun yaşanabilir.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-900/30 rounded-2xl text-center space-y-4 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-all" onClick={() => { if(typeof window !== 'undefined') { window.location.href = '/integrations' } }}>
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                        🔗
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-2">E-Ticaret ve Bağlı Ürünler</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mx-auto">
                            Pazarama, Trendyol ve N11 gibi pazaryeri eşleştirmeleri ürün kaydedildikten sonra ana envanter ekranından veya direkt entegrasyon panelleri üzerinden yönetilebilecektir.
                        </p>
                    </div>
                    <div className="pt-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-xs font-bold rounded-lg mt-2">
                            YÖNET & ENTEGRE ET
                        </span>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center">
                            🏢
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">Müşteri Kodları (BuyersItemIdentification)</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">B2B E-Fatura Eşleştirmesi</p>
                        </div>
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Kendilerine kesilen faturalarda ürün kodlarını görmek isteyen firmalar için bu alanda bu ürün için müşterilerinize özel kod tanımlayabilirsiniz.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-xl text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                        Tanımladığınız kodlar oluşan e-faturanın XML'inde "BuyersItemIdentification" adlı özel bir alanda iletilir. Eğer bu kodun XML haricinde, ayrıca fatura çıktısı üzerinde de gözükmesini istiyorsanız, e-fatura entegratörünüze "BuyersItemIdentification" alanını "Alıcı Ürün Kodu" isimli bir kolonda görmek istediğinizi iletin.
                    </div>
                    <button onClick={() => { if(typeof window !== 'undefined') window.location.href = '/customers?action=map_code&product=' + data.id }} className="w-full py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all">
                        + Müşteri Kodu Ekle
                    </button>
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-white/5 pt-6 mt-6">
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between border border-slate-200 dark:border-white/5 shadow-sm">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{mode === "create" ? "Her şey hazır mı?" : "Değişiklikleri kaydedin"}</h4>
                        <p className="text-sm text-slate-500">{mode === "create" ? "Ürünü kaydettikten sonra dilediğiniz zaman düzenleyebilirsiniz." : "Düzenlediğiniz bu ürünün tüm verileri anında güncellenecektir."}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
