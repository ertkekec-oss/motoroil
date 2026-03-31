"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useApp } from "@/contexts/AppContext";
import { useModal } from "@/contexts/ModalContext";
import { formatCurrency } from "@/lib/utils";
import { Box, Layers, Trash2, ListPlus, ArrowRight, Store, Pencil, Search, Plus, Database } from "lucide-react";
import { useState } from "react";

export default function BomManager({ boms, fetchBoms, products }: { boms: any[], fetchBoms: () => void, products: any[] }) {
    const { theme } = useTheme();
    const { hasPermission } = useApp();
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
    const isLight = theme === "light";
    const canManage = hasPermission("inventory_manage");

    const [searchTerm, setSearchTerm] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBom, setSelectedBom] = useState<any>(null);
    const [newBom, setNewBom] = useState({
        id: "",
        productId: "",
        name: "",
        code: "",
        description: "",
        items: [] as any[]
    });

    const handleAddBomItem = () => {
        setNewBom(prev => ({
            ...prev,
            items: [...prev.items, { productId: "", quantity: 1, unit: "Adet", wastePercentage: 0 }]
        }));
    };

    const handleRemoveBomItem = (index: number) => {
        setNewBom(prev => {
            const newItems = [...prev.items];
            newItems.splice(index, 1);
            return { ...prev, items: newItems };
        });
    };

    const handleUpdateBomItem = (index: number, field: string, value: any) => {
        setNewBom(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };

            if (field === "productId") {
                const prod = products.find(p => p.id === value);
                if (prod && prod.unit) {
                    newItems[index].unit = prod.unit;
                }
            }
            return { ...prev, items: newItems };
        });
    };

    const handleEditBom = (bom: any) => {
        setNewBom({
            id: bom.id,
            productId: bom.productId,
            name: bom.name || "",
            code: bom.code || "",
            description: bom.description || "",
            items: bom.items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                unit: item.unit,
                wastePercentage: item.wastePercentage
            }))
        });
        setIsModalOpen(true);
    };

    const handleSaveBom = async () => {
        if (!newBom.productId || newBom.items.length === 0) {
            showWarning("Hata", "Hedef Mamul ve en az bir hammadde seçmelisiniz.");
            return;
        }

        for (const item of newBom.items) {
            if (!item.productId) {
                showWarning("Hata", "Tüm hammaddeler için bir ürün seçmelisiniz.");
                return;
            }
            if (item.quantity <= 0) {
                showWarning("Hata", "Hammadde miktarları 0'dan büyük olmalıdır.");
                return;
            }
        }

        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const bomData = {
                ...newBom,
                code: newBom.code || `BOM-${Date.now()}`
            };

            const url = newBom.id ? `/api/inventory/boms/${newBom.id}` : "/api/inventory/boms";
            const method = newBom.id ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bomData),
            });

            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", newBom.id ? "Reçete güncellendi." : "Yeni Reçete kaydedildi.");
                setIsModalOpen(false);
                setNewBom({ id: "", productId: "", name: "", code: "", description: "", items: [] });
                fetchBoms();
            } else {
                showError("Hata", data.error || "Beklenmedik bir hata oluştu.");
            }
        } catch (e) {
            showError("Hata", "API Hatası.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteBom = async (bomId: string, bomName: string) => {
        showConfirm("Reçeteyi Sil", `"${bomName}" reçetesini silmek istiyor musunuz?`, async () => {
            try {
                const res = await fetch(`/api/inventory/boms/${bomId}`, { method: "DELETE" });
                const data = await res.json();
                if (data.success) {
                    showSuccess("Başarılı", "Reçete silindi.");
                    fetchBoms();
                } else {
                    showError("Hata", data.error || "Hata oluştu.");
                }
            } catch (e) {
                showError("Hata", "API Hatası.");
            }
        });
    };

    // Dinamik Maliyet Hesaplama Simülasyonu
    const calculateLiveCost = (bomItems: any[]) => {
        return bomItems.reduce((total, item) => {
            const product = products.find(p => p.id === item.productId);
            // Buy Price fallback to Sales Price
            const unitCost = product ? parseFloat(product.buyPrice?.toString() || product.price?.toString() || '0') : 0;
            const wasteMulti = 1 + (parseFloat(item.wastePercentage || 0) / 100);
            return total + (parseFloat(item.quantity) * unitCost * wasteMulti);
        }, 0);
    };

    const filteredBoms = boms.filter(bom => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (bom.name?.toLowerCase().includes(lower) || bom.code?.toLowerCase().includes(lower) || bom.product?.name?.toLowerCase().includes(lower));
    });

    const cardClass = "bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm";
    const textLabelClass = "text-slate-500 dark:text-slate-400";
    const textValueClass = "text-slate-900 dark:text-white";
    const inputClass = "w-full h-[46px] px-4 rounded-[16px] text-[13px] font-bold border outline-none transition-all shadow-sm bg-white border-slate-200 text-slate-900 focus:border-indigo-500 dark:bg-[#1e293b] dark:border-slate-700 dark:text-white dark:focus:border-indigo-500";

    return (
        <div className="space-y-6 animate-in fade-in duration-300 w-full relative z-10">
            <div className="flex justify-between items-center mb-6">
                <div className="relative flex-1 max-w-[500px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Reçete adı, kodu veya ürün ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-[46px] pl-11 pr-4 rounded-full text-[13px] font-bold border outline-none shadow-sm transition-all focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                    />
                </div>
                {canManage && (
                    <button
                        onClick={() => {
                            setNewBom({ id: "", productId: "", name: "", code: "", description: "", items: [] });
                            setIsModalOpen(true);
                        }}
                        className="h-[46px] px-6 flex items-center gap-2 rounded-full font-black uppercase tracking-widest text-[12px] shadow-sm transition-colors border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" /> Yeni Reçete (BOM) Oluştur
                    </button>
                )}
            </div>

            {filteredBoms.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-20 rounded-[24px] shadow-sm border border-dashed ${cardClass}`}>
                    <Database className={`w-12 h-12 mb-4 opacity-30 ${textLabelClass}`} />
                    <h3 className={`text-[16px] font-black uppercase tracking-widest ${textValueClass}`}>Reçete Bulunamadı</h3>
                    <p className={`text-[13px] mt-1 font-bold ${textLabelClass}`}>Tanımlanmış bir malzeme reçetesi yok.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredBoms.map((bom) => (
                        <div key={bom.id} className={`rounded-[24px] shadow-sm p-6 flex flex-col gap-4 border transition-all hover:-translate-y-1 hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-500/50 group ${cardClass}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-12 h-12 shrink-0 rounded-[16px] flex items-center justify-center text-[15px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                                        <Box className="w-5 h-5" />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <h3 className={`text-[15px] font-black tracking-tight truncate ${textValueClass} group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors`}>
                                            {bom.name || bom.product?.name || "İsimsiz Reçete"}
                                        </h3>
                                        <div className={`text-[10px] font-bold uppercase tracking-widest truncate mt-1 ${textLabelClass}`}>KOD: {bom.code}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 p-4 rounded-[16px] border bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800/80">
                                <div className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${textLabelClass}`}>ÜRETİLECEK MAMUL</div>
                                <div className={`text-[13px] font-bold truncate ${textValueClass}`}>{bom.product?.name}</div>
                            </div>

                            <div className="flex items-center justify-between px-1 mt-1">
                                <div className={`text-[12px] font-bold uppercase tracking-widest ${textLabelClass}`}>
                                    {bom.items?.length || 0} Bileşen
                                </div>
                                <div className={`text-[14px] font-black bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md ${isLight ? "text-indigo-700" : "text-indigo-400"}`}>
                                    <span className="opacity-50 text-[10px] mr-1">₺</span>{formatCurrency(calculateLiveCost(bom.items)).replace('₺', '').trim()}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-auto pt-5 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setSelectedBom(bom)}
                                    className="flex-1 h-[42px] flex items-center justify-center gap-2 rounded-[14px] text-[12px] font-black uppercase tracking-widest border transition-colors bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    <ListPlus className="w-4 h-4" /> İncele
                                </button>
                                {canManage && (
                                    <>
                                        <button onClick={() => handleEditBom(bom)} className="w-[42px] h-[42px] rounded-[14px] border flex items-center justify-center transition-colors bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteBom(bom.id, bom.name || bom.code)} className="w-[42px] h-[42px] rounded-[14px] border flex items-center justify-center transition-colors bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/40 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl bg-white dark:bg-[#0f172a] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>
                        
                        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800/80 relative z-10">
                            <h2 className={`text-[20px] font-black tracking-tight ${textValueClass}`}>{newBom.id ? "Reçete Düzenle" : "Yeni Reçete (BOM) Tasarla"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scroll flex flex-col gap-8 bg-slate-50/50 dark:bg-[#0f172a]/50 relative z-10 max-h-[70vh]">
                            {/* Ana Bilgiler */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-1">
                                    <label className={`block text-[11px] font-black uppercase tracking-widest px-1 mb-2 ${textLabelClass}`}>Üretilecek Hedef (Mamul)</label>
                                    <select
                                        value={newBom.productId}
                                        onChange={e => {
                                            const p = products.find(x => x.id === e.target.value);
                                            setNewBom(prev => ({ ...prev, productId: e.target.value, name: prev.name || (p ? `${p.name} Reçetesi` : "") }));
                                        }}
                                        className={inputClass}
                                    >
                                        <option value="">Lütfen seçin...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-black uppercase tracking-widest px-1 mb-2 ${textLabelClass}`}>Reçete Adı</label>
                                    <input type="text" value={newBom.name} onChange={e => setNewBom({ ...newBom, name: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-black uppercase tracking-widest px-1 mb-2 ${textLabelClass}`}>Kodu</label>
                                    <input type="text" value={newBom.code} onChange={e => setNewBom({ ...newBom, code: e.target.value })} placeholder="Otomatik (Boş Bırakılabilir)" className={inputClass} />
                                </div>
                            </div>

                            {/* Hammadde Tablosu */}
                            <div>
                                <div className="flex justify-between items-end mb-4 border-b pb-4 dark:border-slate-800">
                                    <div>
                                        <h3 className={`text-[16px] font-black tracking-tight ${textValueClass}`}>Ağaç Görünümü (Bileşenler)</h3>
                                        <p className={`text-[12px] font-bold uppercase tracking-widest mt-1 opacity-70 ${textLabelClass}`}>Mamul üretimi için gereken hammaddeler ve fire oranları</p>
                                    </div>
                                    <button onClick={handleAddBomItem} className="px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors border bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 shadow-sm">
                                        <Plus className="w-4 h-4" /> Kalem Ekle
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {newBom.items.map((item, idx) => {
                                        const pTarget = products.find(x => x.id === item.productId);
                                        const unitCostRaw = pTarget ? parseFloat(pTarget.buyPrice?.toString() || pTarget.price?.toString() || '0') : 0;
                                        const wasteMulti = 1 + (parseFloat(item.wastePercentage || 0) / 100);
                                        const liveCost = parseFloat(item.quantity || 0) * unitCostRaw * wasteMulti;

                                        return (
                                            <div key={idx} className="flex items-end gap-4 p-5 rounded-[24px] border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative group transition-colors focus-within:border-indigo-400 dark:focus-within:border-indigo-500">
                                                <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-[#0f172a] flex items-center justify-center text-[10px] font-black text-slate-400 z-10 shadow-sm">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 ml-2">
                                                    <label className={`block text-[10px] font-black uppercase tracking-widest px-1 mb-2 ${textLabelClass}`}>Girdi Ürünü</label>
                                                    <select
                                                        value={item.productId}
                                                        onChange={e => handleUpdateBomItem(idx, "productId", e.target.value)}
                                                        className={inputClass}
                                                    >
                                                        <option value="">Ürün Seçiniz...</option>
                                                        {products.filter(p => p.id !== newBom.productId).map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} - (Brm: {formatCurrency(parseFloat(p.buyPrice || p.price))})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-[140px]">
                                                    <label className={`block text-[10px] font-black uppercase tracking-widest px-1 mb-2 ${textLabelClass}`}>Miktar</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number" min="0.0001" step="any"
                                                            value={item.quantity}
                                                            onChange={e => handleUpdateBomItem(idx, "quantity", e.target.value)}
                                                            className={inputClass}
                                                        />
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest opacity-50 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md pointer-events-none">{item.unit}</span>
                                                    </div>
                                                </div>
                                                <div className="w-[100px]">
                                                    <label className={`block text-[10px] font-black uppercase tracking-widest px-1 mb-2 ${textLabelClass}`}>Fire (%)</label>
                                                    <input
                                                        type="number" min="0" max="100"
                                                        value={item.wastePercentage}
                                                        onChange={e => handleUpdateBomItem(idx, "wastePercentage", e.target.value)}
                                                        className="w-full h-[46px] px-4 rounded-[16px] text-[15px] font-black border outline-none text-rose-500 bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/40 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                                                    />
                                                </div>
                                                <div className="w-[140px] h-[46px] flex flex-col justify-center px-4 rounded-[16px] border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-inner">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${textLabelClass}`}>Maliyet</span>
                                                    <span className={`text-[13px] font-black ${textValueClass}`}>{formatCurrency(liveCost)}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveBomItem(idx)}
                                                    className="w-[46px] h-[46px] shrink-0 flex items-center justify-center rounded-[16px] border transition-colors text-rose-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-900/20 dark:hover:border-rose-900/50"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Toplam Maliyet ve Kaydet */}
                        <div className="p-8 bg-white dark:bg-[#0f172a] border-t border-slate-100 dark:border-slate-800 relative z-10 flex justify-between items-center shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                            <div className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 min-w-[240px]">
                                <div className={`text-[11px] font-black uppercase tracking-widest opacity-70 mb-1 ${textLabelClass}`}>Öngörülen 1 Brm Maliyeti</div>
                                <div className={`text-[28px] font-black tabular-nums ${textValueClass}`}>{formatCurrency(calculateLiveCost(newBom.items))}</div>
                            </div>
                            <button
                                onClick={handleSaveBom}
                                disabled={isProcessing}
                                className="px-12 h-[60px] rounded-[20px] text-[15px] font-black uppercase tracking-widest text-white transition-all bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-xl shadow-indigo-500/20 border border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {isProcessing ? "İşleniyor..." : "Reçeteyi Onayla ve Kaydet"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* INCELE MODAL */}
            {selectedBom && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>

                        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800/80 relative z-10">
                            <h2 className={`text-[20px] font-black tracking-tight ${textValueClass}`}>Reçete: {selectedBom.name || selectedBom.product?.name}</h2>
                            <button onClick={() => setSelectedBom(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scroll flex flex-col gap-6 bg-slate-50/50 dark:bg-[#0f172a]/50 relative z-10 max-h-[70vh]">
                            <div className="p-6 rounded-[24px] border flex justify-between items-center bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 shadow-sm">
                                <div>
                                    <div className="text-[11px] font-black uppercase tracking-widest mb-1 text-indigo-600/70 dark:text-indigo-400/70">Hedef Ürün</div>
                                    <div className="text-[18px] font-black text-indigo-900 dark:text-indigo-100">{selectedBom.product?.name}</div>
                                </div>
                                <div className="text-right p-4 bg-white dark:bg-slate-900 rounded-[16px] shadow-sm border border-indigo-100 dark:border-indigo-900/50">
                                    <div className="text-[11px] font-black uppercase tracking-widest mb-1 text-slate-500 dark:text-slate-400">Birim Maliyet (Anlık)</div>
                                    <div className="text-[20px] font-black tabular-nums text-slate-900 dark:text-emerald-400">{formatCurrency(calculateLiveCost(selectedBom.items))}</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[13px] font-black uppercase tracking-widest mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-white">Bileşen Listesi</h3>
                                <div className="space-y-3">
                                    {selectedBom.items?.map((item: any, idx: number) => {
                                        const pTarget = products.find(x => x.id === item.productId);
                                        const unitCostRaw = pTarget ? parseFloat(pTarget.buyPrice?.toString() || pTarget.price?.toString() || '0') : 0;
                                        const wasteMulti = 1 + (parseFloat(item.wastePercentage || 0) / 100);
                                        const liveCost = parseFloat(item.quantity || 0) * unitCostRaw * wasteMulti;

                                        return (
                                        <div key={idx} className="flex justify-between items-center p-5 rounded-[20px] border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
                                            <div>
                                                <div className={`text-[15px] font-black ${textValueClass}`}>{item.product?.name}</div>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70 ${textLabelClass}`}>Birim Maliyeti: {formatCurrency(unitCostRaw)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[16px] font-black tabular-nums ${textValueClass}`}>{item.quantity} <span className="text-[12px] opacity-60 ml-0.5">{item.unit}</span></div>
                                                {item.wastePercentage > 0 && <div className={`text-[10px] font-black uppercase tracking-widest mt-1 text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md inline-block`}>+{item.wastePercentage}% Fire</div>}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
