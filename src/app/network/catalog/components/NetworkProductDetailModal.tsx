"use client"

import React, { useEffect } from "react"
import { X, PackageOpen, Tag, Info, ShoppingCart, Check, Plus } from "lucide-react"

interface NetworkProductDetailModalProps {
    isOpen: boolean
    onClose: () => void
    product: any
    addingToCart: string | null
    onAddToCart: (p: any, qty: number) => void
}

export default function NetworkProductDetailModal({ isOpen, onClose, product, addingToCart, onAddToCart }: NetworkProductDetailModalProps) {
    
    // Close on esc
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown)
        }
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen || !product) return null

    const stock = product.stock || 0
    const minQty = product.minOrderQty || 1

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6 sm:py-12 bg-slate-900/50 backdrop-blur-[2px]">
            <div 
                className="bg-white dark:bg-[#0f172a] rounded-[24px] shadow-2xl w-full max-w-[900px] h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scroll flex flex-col sm:flex-row">
                    
                    {/* Left: Image Box */}
                    <div className="w-full sm:w-[45%] bg-slate-50 dark:bg-[#1e293b] p-8 sm:p-12 flex items-center justify-center shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-white/5 relative min-h-[300px]">
                        {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-full object-contain filter drop-shadow-md mix-blend-multiply dark:mix-blend-normal"
                            />
                        ) : (
                            <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center gap-4">
                                <PackageOpen className="w-24 h-24" strokeWidth={1} />
                                <span className="text-sm font-medium">Görsel Yok</span>
                            </div>
                        )}
                        
                        <div className="absolute bottom-4 left-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                <Tag className="w-3.5 h-3.5" />
                                {product.sku || "N/A"}
                            </span>
                        </div>
                    </div>

                    {/* Right: Info Box */}
                    <div className="flex-1 p-6 sm:p-10 flex flex-col bg-white dark:bg-[#0f172a]">
                        <div className="mb-6">
                            <div className="inline-flex items-center px-2.5 py-1 mb-4 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                {product.category || "Diğer"}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
                                {product.name}
                            </h2>
                            
                            <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                                <div>
                                    <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-1">B2B Fiyatı</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(product.priceResolved)}
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[14px]">
                                        <div className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <span className="text-slate-600 dark:text-slate-300">Stok: <strong className="text-slate-900 dark:text-white">{stock > 0 ? `${stock} adet` : "Tükendi"}</strong></span>
                                    </div>
                                    {(minQty > 1 || product.maxOrderQty) && (
                                        <div className="text-[12px] text-amber-600 dark:text-amber-400 font-medium">
                                            {minQty > 1 && `Min: ${minQty} `}
                                            {product.maxOrderQty && `Max: ${product.maxOrderQty}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="flex-1 text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3 mt-2">
                                <Info className="w-4 h-4 text-blue-600" />
                                Ürün Detayları
                            </h3>
                            {product.description ? (
                                <div className="whitespace-pre-wrap">{product.description}</div>
                            ) : (
                                <p className="italic text-slate-400 dark:text-slate-500 text-[14px]">
                                    Bu ürün için detaylı bir açıklama belirtilmemiştir. Ancak özellikleri ve B2B kullanım hakkındaki diğer bilgiler için bayi sorumlunuzla görüşebilirsiniz.
                                </p>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center gap-4">
                            <button
                                disabled={addingToCart === product.id || stock < minQty}
                                onClick={() => onAddToCart(product, Math.max(1, minQty))}
                                className={`w-full h-14 rounded-xl text-[15px] font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border
                                    ${addingToCart === product.id 
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20' 
                                    : stock < minQty
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                        : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20'
                                    }`}
                            >
                                {addingToCart === product.id ? (
                                    <>
                                        <Check className="w-5 h-5" strokeWidth={2.5} />
                                        Sepete Eklendi
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                                        Sepete Ekle
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
