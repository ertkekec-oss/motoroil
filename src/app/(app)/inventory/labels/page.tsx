"use client";

import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { useSearchParams } from "next/navigation";
import { Printer, X, Box, Tag, Layers, SlidersHorizontal, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useInventory } from "@/contexts/InventoryContext"; // Ensure accurate import
import { useSettings } from "@/contexts/SettingsContext"; // Ensure accurate import

export default function LableGeneratorPage() {
    const searchParams = useSearchParams();
    const { products } = useInventory();
    const { brands, prodCats } = useSettings();

    const productIdParam = searchParams.get("product");

    // --- Configuration States ---
    const [targetType, setTargetType] = useState<"single" | "category" | "brand" | "all">(productIdParam ? "single" : "all");
    const [selectedProductId, setSelectedProductId] = useState(productIdParam || "");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");

    const [labelSize, setLabelSize] = useState("40x80"); // 30x50, 40x80, 50x100
    
    // --- Toggles ---
    const [showName, setShowName] = useState(true);
    const [showBarcode, setShowBarcode] = useState(true);
    const [showPrice, setShowPrice] = useState(true);
    const [showBrand, setShowBrand] = useState(true);
    const [showCode, setShowCode] = useState(true);

    const [labelsToPrint, setLabelsToPrint] = useState<any[]>([]);

    useEffect(() => {
        // Generate label data based on configuration
        let filtered = products;

        if (targetType === "single" && selectedProductId) {
            filtered = products.filter(p => p.id === selectedProductId);
        } else if (targetType === "category" && selectedCategory) {
            filtered = products.filter(p => p.category === selectedCategory);
        } else if (targetType === "brand" && selectedBrand) {
            filtered = products.filter(p => p.brand === selectedBrand);
        }

        setLabelsToPrint(filtered);
    }, [products, targetType, selectedProductId, selectedCategory, selectedBrand]);

    const handlePrint = () => {
        window.print();
    };

    // --- Dynamic Styles for Printing ---
    // In print mode, hide sidebar and show only the printable area
    // This is handled by a global or inline print media CSS.
    // We will render labels in a grid or sequentially based on size.

    // Calculate dimensions
    let labelWidth = "80mm";
    let labelHeight = "40mm";

    if (labelSize === "30x50") {
        labelWidth = "50mm";
        labelHeight = "30mm";
    } else if (labelSize === "50x100") {
        labelWidth = "100mm";
        labelHeight = "50mm";
    }

    return (
        <div className="flex h-full bg-slate-50 dark:bg-[#0f172a] print:bg-white print:h-auto overflow-hidden text-slate-900 dark:text-white">
            
            {/* Sidebar Configuration (Hidden on Print) */}
            <div className="w-96 bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-white/5 flex flex-col shrink-0 overflow-y-auto print:hidden shadow-lg z-10 transition-all custom-scroll">
                
                {/* Sidebar Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 sticky top-0 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md z-10">
                    <Link href="/inventory" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-4">
                        <ArrowLeft size={14} /> Envantere Dön
                    </Link>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Printer className="text-blue-600" /> Etiket Tasarımı
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Toplu ve tekil ürün etiketlerinizi tasarlayın ve yazdırın.</p>
                </div>

                {/* Configurations */}
                <div className="p-6 space-y-8">
                    
                    {/* Source Selection */}
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5"><Layers size={14}/> Kaynak Seçimi</h3>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setTargetType("all")} className={`h-10 px-3 rounded-xl border text-xs font-bold transition-all ${targetType === "all" ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}>Tüm Envanter</button>
                            <button onClick={() => setTargetType("single")} className={`h-10 px-3 rounded-xl border text-xs font-bold transition-all ${targetType === "single" ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}>Tek Ürün</button>
                            <button onClick={() => setTargetType("category")} className={`h-10 px-3 rounded-xl border text-xs font-bold transition-all ${targetType === "category" ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}>Kategori</button>
                            <button onClick={() => setTargetType("brand")} className={`h-10 px-3 rounded-xl border text-xs font-bold transition-all ${targetType === "brand" ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}>Marka</button>
                        </div>

                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                            {targetType === "single" && (
                                <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] text-sm font-medium">
                                    <option value="" disabled>Ürün Seçiniz...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            )}
                            {targetType === "category" && (
                                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] text-sm font-medium">
                                    <option value="" disabled>Kategori Seçiniz...</option>
                                    {prodCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            )}
                            {targetType === "brand" && (
                                <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] text-sm font-medium">
                                    <option value="" disabled>Marka Seçiniz...</option>
                                    {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200 dark:bg-white/5"></div>

                    {/* Dimensions */}
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5"><Box size={14}/> Etiket Boyutları</h3>
                        <div className="space-y-2">
                            {["30x50", "40x80", "50x100"].map(size => (
                                <label key={size} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${labelSize === size ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                                    <span className={`text-sm font-bold ${labelSize === size ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{size} mm (Geniş x Dar)</span>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${labelSize === size ? 'border-blue-600' : 'border-slate-300'}`}>
                                        {labelSize === size && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200 dark:bg-white/5"></div>

                    {/* Elements */}
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5"><SlidersHorizontal size={14}/> Alan Görünümleri</h3>
                        <div className="space-y-3">
                            <Toggle label="Ürün Adı" checked={showName} onChange={setShowName} />
                            <Toggle label="Barkod Çizgisi" checked={showBarcode} onChange={setShowBarcode} />
                            <Toggle label="Fiyat Gösterimi" checked={showPrice} onChange={setShowPrice} />
                            <Toggle label="Marka" checked={showBrand} onChange={setShowBrand} />
                            <Toggle label="Stok / Referans Kodu" checked={showCode} onChange={setShowCode} />
                        </div>
                    </div>

                </div>
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 flex flex-col items-center bg-slate-200 dark:bg-[#0f172a] print:bg-white print:block overflow-y-auto">
                
                {/* Fixed Top Bar on Web */}
                <div className="w-full p-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 flex items-center justify-between sticky top-0 z-20 print:hidden shadow-sm">
                    <div>
                        <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">Canlı Önizleme <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md">Gerçek Boyut</span></div>
                        <div className="text-sm font-medium text-slate-500 mt-1">{labelsToPrint.length} adet etiket yazdırılacak.</div>
                    </div>
                    <button 
                        onClick={handlePrint}
                        disabled={labelsToPrint.length === 0}
                        className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                    >
                        <Printer size={18} /> Yazdır
                    </button>
                </div>

                {/* Print Styles Injection */}
                <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #label-print-zone, #label-print-zone * {
                            visibility: visible;
                        }
                        #label-print-zone {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        @page {
                            margin: 0;
                            size: auto;
                        }
                    }
                `}} />

                {/* Label Canvas Area */}
                <div className="p-12 w-full flex justify-center print:p-0">
                    <div id="label-print-zone" className="flex flex-wrap gap-4 justify-center print:justify-start print:gap-1 max-w-[800px] print:max-w-none">
                        {labelsToPrint.length > 0 ? labelsToPrint.map((prod, idx) => (
                            <div 
                                key={idx} 
                                className="bg-white text-black border border-slate-300 dark:border-white/20 print:border-black flex flex-col justify-between overflow-hidden relative break-inside-avoid print:page-break-inside-avoid"
                                style={{
                                    width: labelWidth,
                                    height: labelHeight,
                                    padding: '3mm',
                                    pageBreakInside: "avoid"
                                }}
                            >
                                <div className="w-full truncate text-center flex-1">
                                    {showBrand && <div className="text-[8px] sm:text-[9px] print:text-[10px] uppercase tracking-widest font-black text-slate-600 mb-0.5 mt-0">{prod.brand || "MARKA YOK"}</div>}
                                    {showName && <div className="text-[10px] sm:text-[11px] print:text-[12px] font-bold leading-tight line-clamp-2 max-h-[8mm] print:max-h-[10mm] overflow-hidden">{prod.name}</div>}
                                </div>
                                
                                {showBarcode && (
                                    <div className="w-full flex justify-center items-center my-0.5 shrink-0" style={{ height: '14mm'}}>
                                        <Barcode 
                                            value={prod.barcode || prod.code || "000000000"} 
                                            width={labelSize === '30x50' ? 1.2 : 1.5} 
                                            height={30} 
                                            fontSize={10} 
                                            margin={0} 
                                            displayValue={true} 
                                            textMargin={1} 
                                            background="transparent" 
                                        />
                                    </div>
                                )}
                                
                                <div className="w-full flex justify-between items-end shrink-0 mt-0.5">
                                    {showCode && <div className="text-[8px] print:text-[9px] font-semibold text-slate-600 truncate max-w-[50%]">KOD: {prod.code}</div>}
                                    {showPrice && <div className="text-[12px] sm:text-[14px] print:text-[16px] font-black text-black">{(parseFloat(prod.price) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>}
                                </div>
                            </div>
                        )) : (
                            <div className="w-full p-20 flex flex-col items-center justify-center text-slate-400 print:hidden">
                                <Box size={48} className="mb-4 opacity-50" />
                                <h3 className="text-xl font-bold">Kriterlere uygun ürün bulunamadı.</h3>
                                <p className="text-sm">Lütfen filtrelerinizi değiştirin.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) {
    return (
        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-all">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${checked ? 'left-5 shadow-sm' : 'left-1'}`}></div>
            </div>
            {/* hidden native checkbox */}
            <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
        </label>
    );
}
