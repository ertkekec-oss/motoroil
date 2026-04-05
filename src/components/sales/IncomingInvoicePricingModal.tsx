"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Calendar, Tag, FileText, CheckCircle2, ChevronRight, Settings2 } from "lucide-react";

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
    allItems?: NewItem[];
    onConfirm: (pricingConfig: Record<string, number>, settings?: any) => Promise<void>;
    posTheme?: 'dark' | 'light';
}

export function IncomingInvoicePricingModal({
    isOpen,
    onClose,
    invoiceId,
    documentType,
    newItems,
    allItems = [],
    onConfirm,
    posTheme = 'dark'
}: IncomingInvoicePricingModalProps) {
    const isLight = posTheme === 'light';
    const { showError } = useModal();
    const [configs, setConfigs] = useState<Record<string, { strategy: string; value: number; vatIncluded: boolean }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // YENİ: Fatura Kabul Ayarları (Masraf, İrsaliye, Vade, Not)
    const [isExpense, setIsExpense] = useState(false);
    const [customDueDate, setCustomDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [matchedWaybillId, setMatchedWaybillId] = useState('');

    useEffect(() => {
        const initialConfigs: Record<string, any> = {};
        newItems.forEach(item => {
            initialConfigs[item.productCode || item.productName] = { 
                strategy: 'vat_excluded_percent', 
                value: 30, 
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
        if (conf.strategy === 'vat_excluded_percent') finalPrice = baseBuyPrice * (1 + (conf.value / 100));
        else if (conf.strategy === 'vat_included_percent') finalPrice = buyPriceWtihVat * (1 + (conf.value / 100));
        else if (conf.strategy === 'vat_excluded_fixed') finalPrice = baseBuyPrice + conf.value;
        else if (conf.strategy === 'vat_included_fixed') finalPrice = buyPriceWtihVat + conf.value;
        else if (conf.strategy === 'manual') finalPrice = conf.value;
        return finalPrice;
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const pricingConfig: Record<string, number> = {};
            if (!isExpense) {
                newItems.forEach(item => {
                    pricingConfig[item.productCode || item.productName] = calculateFinalPrice(item);
                });
            }

            const settings = {
                isExpense,
                customDueDate: customDueDate || undefined,
                notes: notes || undefined,
                matchedWaybillId: matchedWaybillId || undefined
            };

            await onConfirm(pricingConfig, settings);
        } catch (e: any) {
            showError('Hata', e.message || 'İşlem sırasında hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Masraf ise stok sormaya/fiyatlandırmaya gerek yok
    const showPricingTable = newItems.length > 0 && !isExpense;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 sm:p-6 animate-in fade-in">
            <div className={`w-full max-w-5xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                {/* Header */}
                <div className={`flex justify-between items-center px-8 py-5 border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b]/50 border-white/10'}`}>
                    <div>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            <CheckCircle2 className="w-6 h-6 text-blue-500" />
                            GELEN FATURA KABUL ve ONAY
                        </h3>
                        <p className={`text-xs font-medium mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Bu faturayı envanterinize tam olarak nasıl işlemek istediğinizi belirleyin.
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                    
                    {/* AYARLAR BLOĞU */}
                    <div className="space-y-4">
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                            <Settings2 className="w-4 h-4 text-blue-500"/>
                            İşlem Ayarları
                        </h4>
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${isLight ? '' : ''}`}>
                            
                            {/* Masraf Şalteri */}
                            <div className={`p-4 rounded-2xl border transition-all ${isExpense ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30' : (isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b] border-white/5')}`}>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={isExpense}
                                        onChange={e => setIsExpense(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className={`text-[13px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Masraf Olarak İşle</div>
                                        <div className={`text-[11px] mt-0.5 leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Bunu seçerseniz ürünler depoya <br/>stok olarak sayılmaz.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Vade Tarihi */}
                            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b] border-white/5'}`}>
                                <label className={`text-[12px] font-bold flex items-center gap-1.5 mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                                    <Calendar className="w-3.5 h-3.5"/> Ödeme Vadesi
                                </label>
                                <input 
                                    type="date"
                                    value={customDueDate}
                                    onChange={e => setCustomDueDate(e.target.value)}
                                    className={`w-full h-9 px-3 rounded-xl border text-[13px] outline-none focus:ring-2 focus:ring-blue-500 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10 text-white'}`}
                                />
                            </div>

                            {/* İrsaliye Eşleştirme (Placeholder) */}
                            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b] border-white/5'}`}>
                                <label className={`text-[12px] font-bold flex items-center gap-1.5 mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                                    <Tag className="w-3.5 h-3.5"/> İrsaliye İle Eşleştir
                                </label>
                                <select 
                                    className={`w-full h-9 px-3 rounded-xl border text-[13px] outline-none focus:ring-2 focus:ring-blue-500 ${isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#0f172a] border-white/10 text-slate-400'}`}
                                    onChange={(e) => setMatchedWaybillId(e.target.value)}
                                    disabled={documentType === 'DESPATCH'}
                                >
                                    <option value="">-- Bağımsız Fatura --</option>
                                    <option value="fake_1">İrsaliye: IRS-20260401 (Mevcut Stoklar)</option>
                                </select>
                            </div>

                            {/* İç Not */}
                            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b] border-white/5'}`}>
                                <label className={`text-[12px] font-bold flex items-center gap-1.5 mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                                    <FileText className="w-3.5 h-3.5"/> İç Not / Açıklama
                                </label>
                                <input 
                                    type="text"
                                    placeholder="Opsiyonel açıklama..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className={`w-full h-9 px-3 rounded-xl border text-[13px] outline-none focus:ring-2 focus:ring-blue-500 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10 text-white'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* FİYATLANDIRMA TABLOSU (Sadece Yeni Ürün Varsa) */}
                    {showPricingTable ? (
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                            <h4 className={`text-sm font-bold flex items-center justify-between ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                <span className="flex items-center gap-2">
                                   🏷️ Yeni Ürünler İçin Fiyatlandırma 
                                   <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 font-bold ml-2">Dikkat Edilmesi Gereken</span>
                                </span>
                            </h4>
                            <p className={`text-[13px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                Aşağıdaki ürünler deponuza <strong>ilk defa</strong> girecek. Bu ürünleri satarken kullanacağınız sistem fiyatlarını belirleyin.
                            </p>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead className={`border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-white/5'}`}>
                                        <tr>
                                            <th className={`px-4 py-4 text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Ürün</th>
                                            <th className={`px-4 py-4 text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Miktar</th>
                                            <th className={`px-4 py-4 text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Birim Alış (Net)</th>
                                            <th className={`px-4 py-4 text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>KDV</th>
                                            <th className={`px-4 py-4 text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Fiyat Stratejisi</th>
                                            <th className={`px-4 py-4 text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Marj</th>
                                            <th className={`px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-right ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Nihai Satış Fiyatı</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800'}`}>
                                        {newItems.map((item, idx) => {
                                            const key = item.productCode || item.productName;
                                            const conf = configs[key] || { strategy: 'manual', value: item.buyPrice, vatIncluded: false };

                                            return (
                                                <tr key={idx} className={isLight ? 'bg-white' : 'bg-transparent'}>
                                                    <td className="px-4 py-4">
                                                        <div className={`font-bold text-[13px] ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.productName}</div>
                                                        <div className={`text-[11px] mt-1 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.productCode}</div>
                                                    </td>
                                                    <td className={`px-4 py-4 font-bold text-[13px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                                                        {item.qty || 1}
                                                    </td>
                                                    <td className={`px-4 py-4 font-bold text-[13px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                                        {item.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </td>
                                                    <td className={`px-4 py-4 font-medium text-[13px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                                                        %{item.vatRate}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={conf.strategy}
                                                            onChange={(e) => setConfigs({ ...configs, [key]: { ...conf, strategy: e.target.value }})}
                                                            className={`w-full h-10 px-3 rounded-xl border text-[13px] font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                                                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#1e293b] border-white/10 text-white'
                                                            }`}
                                                        >
                                                            <option value="vat_excluded_percent">Alış Üzerinden % (Net)</option>
                                                            <option value="vat_included_percent">Alış Üzerinden % (+KDV)</option>
                                                            <option value="manual">Manuel Giriş</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input 
                                                            type="number"
                                                            value={conf.value}
                                                            onChange={e => setConfigs({ ...configs, [key]: { ...conf, value: parseFloat(e.target.value) || 0 }})}
                                                            className={`w-full h-10 px-3 rounded-xl border text-[13px] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-center ${
                                                                isLight ? 'bg-slate-50 border-slate-200 text-blue-700' : 'bg-[#1e293b] border-white/10 text-blue-400'
                                                            }`}
                                                        />
                                                    </td>
                                                    <td className={`px-4 py-4 text-right font-black text-[15px] ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                                        {calculateFinalPrice(item).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className={`p-6 rounded-2xl border text-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b]/50 border-white/5'}`}>
                            {isExpense ? (
                                <p className={`text-[13px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Bu fatura <strong className="text-rose-500">Masraf</strong> olarak işaretlendi.<br/>Stok adet ve fiyatlandırma güncellemesi yapılmayacak, yalnızca finansal deftere işlenecektir.
                                </p>
                            ) : (
                                <p className={`text-[13px] font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                    ✅ Bu faturadaki tüm ürünler ({allItems.length} kalem) sisteminizde zaten kayıtlı.<br/>Fiyatlandırma yapmanıza gerek yok. Stoklar direkt mevcut kayıtlara eklenecektir.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-8 py-5 border-t flex justify-end gap-3 z-20 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b]/50 border-white/10'}`}>
                    <button 
                        onClick={onClose}
                        disabled={isSubmitting}
                        className={`px-6 py-3 rounded-full border font-bold tracking-wide text-[13px] transition-colors disabled:opacity-50 shadow-sm ${
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
                        className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide text-[13px] shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? 'İşleniyor...' : (
                            <>Kabul Et ve Sisteme İşle <ChevronRight className="w-4 h-4"/></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
