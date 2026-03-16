"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";

interface NewItem {
    productName: string;
    productCode: string;
    buyPrice: number;
    vatRate: number;
    qty: number;
    isNew: boolean;
    productId: string | null;
}

interface IncomingInvoicePricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: string;
    documentType: 'INVOICE' | 'DESPATCH';
    newItems: NewItem[];
    onConfirm: (pricingConfig: Record<string, number>) => Promise<void>;
    posTheme?: 'dark' | 'light';
}

export function IncomingInvoicePricingModal({
    isOpen,
    onClose,
    invoiceId,
    documentType,
    newItems,
    onConfirm,
    posTheme = 'dark'
}: IncomingInvoicePricingModalProps) {
    const isLight = posTheme === 'light';
    const { showError } = useModal();
    const [configs, setConfigs] = useState<Record<string, { strategy: string; value: number; vatIncluded: boolean }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Initialize configs for each item
        const initialConfigs: Record<string, any> = {};
        newItems.forEach(item => {
            initialConfigs[item.productCode || item.productName] = { 
                strategy: 'vat_excluded_percent', 
                value: 30, // Default 30% margin 
                vatIncluded: false 
            };
        });
        setConfigs(initialConfigs);
    }, [newItems]);

    const calculateFinalPrice = (item: NewItem) => {
        const conf = configs[item.productCode || item.productName];
        if (!conf) return item.buyPrice;

        const baseBuyPrice = item.buyPrice;
        const buyPriceWtihVat = baseBuyPrice * (1 + (item.vatRate / 100));

        let finalPrice = baseBuyPrice;

        if (conf.strategy === 'vat_excluded_percent') {
            finalPrice = baseBuyPrice * (1 + (conf.value / 100));
        } else if (conf.strategy === 'vat_included_percent') {
            finalPrice = buyPriceWtihVat * (1 + (conf.value / 100));
        } else if (conf.strategy === 'vat_excluded_fixed') {
            finalPrice = baseBuyPrice + conf.value;
        } else if (conf.strategy === 'vat_included_fixed') {
            finalPrice = buyPriceWtihVat + conf.value;
        } else if (conf.strategy === 'manual') {
            finalPrice = conf.value;
        }

        return finalPrice;
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const pricingConfig: Record<string, number> = {};
            newItems.forEach(item => {
                pricingConfig[item.productCode || item.productName] = calculateFinalPrice(item);
            });
            await onConfirm(pricingConfig);
        } catch (e: any) {
            showError('Hata', e.message || 'Fiyatlar belirlenirken hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 sm:p-6 animate-in fade-in">
            <div className={`w-full max-w-5xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                {/* Header */}
                <div className={`flex justify-between items-center px-8 py-5 border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b]/50 border-white/10'}`}>
                    <div>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            <span className="text-xl">🏷️</span> YENİ ÜRÜN FİYATLANDIRMA
                        </h3>
                        <p className={`text-xs font-medium mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Fatura içeriğindeki aşağıdaki ürünler envanterinizde bulunmuyor.{' '} 
                            Lütfen envantere kaydedilecek bu yeni ürünler için satış fiyatlarını belirleyin.
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className={`border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-white/5'}`}>
                                <tr>
                                    <th className={`px-4 py-4 text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Ürün</th>
                                    <th className={`px-4 py-4 text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Alış (KDV Hariç)</th>
                                    <th className={`px-4 py-4 text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>KDV</th>
                                    <th className={`px-4 py-4 text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Fiyat Stratejisi</th>
                                    <th className={`px-4 py-4 text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Değer</th>
                                    <th className={`px-4 py-4 text-xs font-bold uppercase tracking-wider text-right ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Nihai Satış Fiyatı</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800'}`}>
                                {newItems.map((item, idx) => {
                                    const key = item.productCode || item.productName;
                                    const conf = configs[key] || { strategy: 'manual', value: item.buyPrice, vatIncluded: false };

                                    return (
                                        <tr key={idx} className={isLight ? 'bg-white' : 'bg-transparent'}>
                                            <td className="px-4 py-4">
                                                <div className={`font-semibold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.productName}</div>
                                                <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.productCode}</div>
                                            </td>
                                            <td className={`px-4 py-4 font-medium text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                                                {item.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                            <td className={`px-4 py-4 font-medium text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                                                %{item.vatRate}
                                            </td>
                                            <td className="px-4 py-4">
                                                <select
                                                    value={conf.strategy}
                                                    onChange={(e) => setConfigs({ ...configs, [key]: { ...conf, strategy: e.target.value }})}
                                                    className={`w-full h-10 px-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                                        isLight 
                                                        ? 'bg-slate-50 border-slate-200 text-slate-900' 
                                                        : 'bg-[#1e293b] border-white/10 text-white'
                                                    }`}
                                                >
                                                    <option value="vat_excluded_percent">Alış Üzerinden % (KDV Hariç)</option>
                                                    <option value="vat_included_percent">Alış Üzerinden % (KDV Dahil)</option>
                                                    <option value="vat_excluded_fixed">Alış Üzerinden +Tutar (KDV Hariç)</option>
                                                    <option value="vat_included_fixed">Alış Üzerinden +Tutar (KDV Dahil)</option>
                                                    <option value="manual">Manuel Giriş</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-4">
                                                <input 
                                                    type="number"
                                                    value={conf.value}
                                                    onChange={e => setConfigs({ ...configs, [key]: { ...conf, value: parseFloat(e.target.value) || 0 }})}
                                                    className={`w-full h-10 px-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                                        isLight 
                                                        ? 'bg-slate-50 border-slate-200 text-slate-900' 
                                                        : 'bg-[#1e293b] border-white/10 text-white'
                                                    }`}
                                                />
                                            </td>
                                            <td className={`px-4 py-4 text-right font-bold text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                                {calculateFinalPrice(item).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-8 py-5 border-t flex justify-end gap-3 z-20 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b]/50 border-white/10'}`}>
                    <button 
                        onClick={onClose}
                        disabled={isSubmitting}
                        className={`px-6 py-3 rounded-xl border font-bold text-sm transition-colors disabled:opacity-50 ${
                            isLight 
                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                            : 'bg-[#0f172a] border-white/10 text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        İptal
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Kaydediliyor...' : 'Belirlediğim Fiyatlarla Kaydet ve Onayla'}
                    </button>
                </div>
            </div>
        </div>
    );
}
