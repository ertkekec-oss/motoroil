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

    const cardClass = isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-900 border border-slate-800";
    const modalClass = isLight ? "bg-white border border-slate-200 shadow-2xl" : "bg-slate-900 border border-slate-800 shadow-2xl";
    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";
    const inputClass = isLight
        ? "w-full h-[44px] px-3 rounded-[10px] text-[13px] font-medium border border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500 outline-none transition-all"
        : "w-full h-[44px] px-3 rounded-[10px] text-[13px] font-medium border border-slate-800 bg-slate-900/50 text-slate-200 focus:border-blue-500 outline-none transition-all";

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <div className="relative flex-1 max-w-[500px]">
                    <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
                    <input
                        type="text"
                        placeholder="Reçete adı, kodu veya ürün ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full h-[40px] pl-[38px] pr-4 rounded-[10px] text-[13px] font-medium border outline-none ${isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-900 border-slate-800 text-slate-200"}`}
                    />
                </div>
                {canManage && (
                    <button
                        onClick={() => {
                            setNewBom({ id: "", productId: "", name: "", code: "", description: "", items: [] });
                            setIsModalOpen(true);
                        }}
                        className={`h-[40px] px-5 flex items-center gap-2 rounded-[12px] font-medium text-[13px] shadow-sm ${isLight ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600 text-white hover:bg-blue-500"}`}
                    >
                        <Plus className="w-4 h-4" /> Kullanarak Yeni Reçete (BOM)
                    </button>
                )}
            </div>

            {filteredBoms.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-20 rounded-[14px] border border-dashed ${cardClass}`}>
                    <Database className={`w-12 h-12 mb-4 opacity-20 ${textLabelClass}`} />
                    <h3 className={`text-[16px] font-semibold ${textValueClass}`}>Reçete Bulunamadı</h3>
                    <p className={`text-[13px] mt-1 ${textLabelClass}`}>Tanımlanmış bir malzeme reçetesi yok.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredBoms.map((bom) => (
                        <div key={bom.id} className={`rounded-[14px] p-5 flex flex-col gap-4 border transition-all hover:scale-[1.01] ${cardClass}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-[15px] font-bold ${isLight ? "bg-indigo-50 text-indigo-600" : "bg-indigo-900/30 text-indigo-400"}`}>
                                        <Box className="w-5 h-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className={`text-[15px] font-semibold truncate ${textValueClass}`}>
                                            {bom.name || bom.product?.name || "İsimsiz Reçete"}
                                        </h3>
                                        <p className={`text-[12px] truncate ${textLabelClass}`}>Kod: {bom.code}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-center justify-between p-3 rounded-[10px] border ${isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/50 border-slate-800/80"}`}>
                                <div>
                                    <div className={`text-[11px] font-semibold uppercase tracking-wide opacity-80 ${textLabelClass}`}>Mamul</div>
                                    <div className={`text-[13px] font-bold mt-0.5 ${textValueClass}`}>{bom.product?.name}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <div className={`text-[13px] font-medium ${textLabelClass}`}>
                                    {bom.items?.length || 0} Bileşen
                                </div>
                                <div className={`text-[13px] font-bold ${isLight ? "text-slate-800" : "text-white"}`}>
                                    ~{formatCurrency(calculateLiveCost(bom.items))}
                                </div>
                            </div>

                            <div className={`flex items-center gap-2 mt-auto pt-4 border-t ${isLight ? "border-slate-100" : "border-slate-800/50"}`}>
                                <button
                                    onClick={() => setSelectedBom(bom)}
                                    className={`flex-1 h-[36px] flex items-center justify-center gap-2 rounded-[8px] text-[13px] font-medium border ${isLight ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"}`}
                                >
                                    <ListPlus className="w-4 h-4" /> İncele
                                </button>
                                {canManage && (
                                    <>
                                        <button onClick={() => handleEditBom(bom)} className={`h-[36px] px-3 rounded-[8px] border flex items-center justify-center ${isLight ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"}`}>
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteBom(bom.id, bom.name || bom.code)} className={`h-[36px] px-3 rounded-[8px] border flex items-center justify-center ${isLight ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" : "bg-rose-900/20 border-rose-800/50 text-rose-400 hover:bg-rose-900/40"}`}>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className={`w-[900px] max-w-full rounded-[24px] overflow-hidden flex flex-col max-h-[95vh] ${modalClass} animate-in zoom-in-95 duration-200`}>
                        <div className={`flex justify-between items-center px-8 py-5 border-b ${isLight ? "border-slate-100" : "border-slate-800"}`}>
                            <h2 className={`text-[18px] font-bold ${textValueClass}`}>{newBom.id ? "Reçete Düzenle" : "Yeni Reçete (BOM) Tasarla"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className={`text-2xl leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scroll flex flex-col gap-8">
                            {/* Ana Bilgiler */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-1">
                                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${textLabelClass}`}>Üretilecek Hedef (Mamul)</label>
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
                                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${textLabelClass}`}>Reçete Adı</label>
                                    <input type="text" value={newBom.name} onChange={e => setNewBom({ ...newBom, name: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${textLabelClass}`}>Kodu</label>
                                    <input type="text" value={newBom.code} onChange={e => setNewBom({ ...newBom, code: e.target.value })} placeholder="Otomatik" className={inputClass} />
                                </div>
                            </div>

                            {/* Hammadde Tablosu */}
                            <div>
                                <div className="flex justify-between items-end mb-4 border-b pb-2 dark:border-slate-800">
                                    <div>
                                        <h3 className={`text-[16px] font-bold ${textValueClass}`}>Ağaç Görünümü (Bileşenler)</h3>
                                        <p className={`text-[12px] opacity-70 ${textLabelClass}`}>Mamul üretimi için gereken hammaddeler ve fire oranları</p>
                                    </div>
                                    <button onClick={handleAddBomItem} className={`px-4 py-2 rounded-[10px] text-[13px] font-bold flex items-center gap-2 transition-colors ${isLight ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" : "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50"}`}>
                                        <Plus className="w-4 h-4" /> Kalem Ekle
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {newBom.items.map((item, idx) => {
                                        const pTarget = products.find(x => x.id === item.productId);
                                        const unitCostRaw = pTarget ? parseFloat(pTarget.buyPrice?.toString() || pTarget.price?.toString() || '0') : 0;
                                        const wasteMulti = 1 + (parseFloat(item.wastePercentage || 0) / 100);
                                        const liveCost = parseFloat(item.quantity || 0) * unitCostRaw * wasteMulti;

                                        return (
                                            <div key={idx} className={`flex items-end gap-3 p-4 rounded-[12px] border ${isLight ? "bg-white border-slate-200" : "bg-slate-800/80 border-slate-700"}`}>
                                                <div className="flex-1">
                                                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textLabelClass}`}>Girdi Ürünü</label>
                                                    <select
                                                        value={item.productId}
                                                        onChange={e => handleUpdateBomItem(idx, "productId", e.target.value)}
                                                        className={`w-full h-[40px] px-3 rounded-[8px] text-[13px] font-medium border outline-none ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-700 text-slate-200"}`}
                                                    >
                                                        <option value="">Ürün Seçiniz...</option>
                                                        {products.filter(p => p.id !== newBom.productId).map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} - (Brm: {formatCurrency(parseFloat(p.buyPrice || p.price))})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-[120px]">
                                                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textLabelClass}`}>Miktar</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number" min="0.0001" step="any"
                                                            value={item.quantity}
                                                            onChange={e => handleUpdateBomItem(idx, "quantity", e.target.value)}
                                                            className={`w-full h-[40px] pl-3 pr-10 rounded-[8px] text-[13px] font-bold border outline-none ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-700 text-slate-200"}`}
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold opacity-50">{item.unit}</span>
                                                    </div>
                                                </div>
                                                <div className="w-[90px]">
                                                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textLabelClass}`}>Fire (%)</label>
                                                    <input
                                                        type="number" min="0" max="100"
                                                        value={item.wastePercentage}
                                                        onChange={e => handleUpdateBomItem(idx, "wastePercentage", e.target.value)}
                                                        className={`w-full h-[40px] px-3 rounded-[8px] text-[13px] font-bold border outline-none text-rose-500 ${isLight ? "bg-rose-50 border-rose-100" : "bg-rose-900/10 border-rose-900/30"}`}
                                                    />
                                                </div>
                                                <div className={`w-[130px] h-[40px] flex flex-col justify-center px-3 rounded-[8px] border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-800"}`}>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider opacity-60 ${textLabelClass}`}>Satır Maliyeti</span>
                                                    <span className={`text-[12px] font-bold ${textValueClass}`}>{formatCurrency(liveCost)}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveBomItem(idx)}
                                                    className={`w-[40px] h-[40px] flex items-center justify-center rounded-[8px] border transition-colors ${isLight ? "text-rose-500 border-rose-200 hover:bg-rose-50" : "text-rose-400 border-rose-900/50 hover:bg-rose-900/20"}`}
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
                        <div className={`p-6 bg-slate-50 dark:bg-slate-900 border-t flex justify-between items-center ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                            <div>
                                <div className={`text-[11px] font-bold uppercase tracking-wider opacity-70 ${textLabelClass}`}>Öngörülen 1 Birim Maliyeti</div>
                                <div className={`text-[24px] font-[900] ${isLight ? "text-slate-800" : "text-white"}`}>{formatCurrency(calculateLiveCost(newBom.items))}</div>
                            </div>
                            <button
                                onClick={handleSaveBom}
                                disabled={isProcessing}
                                className={`px-10 h-[48px] rounded-[12px] text-[14px] font-bold text-white transition-all ${isLight ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-500"}`}
                            >
                                {isProcessing ? "İşleniyor..." : "Reçeteyi Onayla"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* INCELE MODAL */}
            {selectedBom && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className={`w-[600px] max-w-full rounded-[20px] overflow-hidden flex flex-col max-h-[90vh] ${modalClass} animate-in zoom-in-95 duration-200`}>
                        <div className={`flex justify-between items-center px-6 py-5 border-b ${isLight ? "border-slate-100" : "border-slate-800"}`}>
                            <h2 className={`text-[16px] font-bold ${textValueClass}`}>Reçete: {selectedBom.name || selectedBom.product?.name}</h2>
                            <button onClick={() => setSelectedBom(null)} className={`text-2xl leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scroll flex flex-col gap-4">
                            <div className={`p-5 rounded-[12px] border flex justify-between items-center ${isLight ? "bg-indigo-50 border-indigo-100" : "bg-indigo-900/10 border-indigo-900/30"}`}>
                                <div>
                                    <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isLight ? "text-indigo-600/70" : "text-indigo-400/70"}`}>Hedef Ürün</div>
                                    <div className={`text-[15px] font-[900] ${isLight ? "text-indigo-900" : "text-indigo-100"}`}>{selectedBom.product?.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isLight ? "text-indigo-600/70" : "text-indigo-400/70"}`}>Birim Maliyet (Anlık)</div>
                                    <div className={`text-[15px] font-[900] ${isLight ? "text-indigo-900" : "text-emerald-400"}`}>{formatCurrency(calculateLiveCost(selectedBom.items))}</div>
                                </div>
                            </div>

                            <div className="space-y-3 mt-4">
                                {selectedBom.items?.map((item: any, idx: number) => {
                                    const pTarget = products.find(x => x.id === item.productId);
                                    const unitCostRaw = pTarget ? parseFloat(pTarget.buyPrice?.toString() || pTarget.price?.toString() || '0') : 0;
                                    const wasteMulti = 1 + (parseFloat(item.wastePercentage || 0) / 100);
                                    const liveCost = parseFloat(item.quantity || 0) * unitCostRaw * wasteMulti;

                                    return (
                                    <div key={idx} className={`flex justify-between items-center p-4 rounded-[12px] border ${isLight ? "bg-white border-slate-100" : "bg-slate-800/50 border-slate-700"}`}>
                                        <div>
                                            <div className={`text-[13px] font-bold ${textValueClass}`}>{item.product?.name}</div>
                                            <div className={`text-[11px] mt-1 opacity-70 ${textLabelClass}`}>Birim Maliyet: {formatCurrency(unitCostRaw)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[13px] font-[900] ${textValueClass}`}>{item.quantity} {item.unit}</div>
                                            {item.wastePercentage > 0 && <div className={`text-[10px] font-bold mt-1 text-rose-500`}>+{item.wastePercentage}% Fire</div>}
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
