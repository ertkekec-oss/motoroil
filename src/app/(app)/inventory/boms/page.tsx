"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { useModal } from "@/contexts/ModalContext";
import { useTheme } from "@/contexts/ThemeContext";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Plus,
  Box,
  Layers,
  Trash2,
  ListPlus,
  ArrowRight,
  Database,
  Pencil
} from "lucide-react";

export default function BomsPage() {
  const { theme } = useTheme();
  const { hasPermission } = useApp();
  const { showSuccess, showError, showWarning, showConfirm } = useModal();
  const isLight = theme === "light";

  const canManage = hasPermission("inventory_manage");

  const [boms, setBoms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBom, setNewBom] = useState({
    productId: "",
    name: "",
    code: "",
    description: "",
    items: [] as any[]
  });

  const fetchBoms = async () => {
    try {
      const res = await fetch("/api/inventory/boms");
      const data = await res.json();
      if (data.success) setBoms(data.boms);
    } catch (e) {
      console.error("fetchBoms error", e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=500");
      const data = await res.json();
      if (data.success && data.products) setProducts(data.products);
    } catch (e) {
      console.error("fetchProducts error", e);
    }
  };

  useEffect(() => {
    Promise.all([fetchBoms(), fetchProducts()]).finally(() => setIsLoading(false));
  }, []);

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
      
      // Auto-fill unit if product is selected
      if (field === "productId") {
        const prod = products.find(p => p.id === value);
        if (prod && prod.unit) {
          newItems[index].unit = prod.unit;
        }
      }
      return { ...prev, items: newItems };
    });
  };

  const handleSaveBom = async () => {
    if (!newBom.productId || newBom.items.length === 0) {
      showWarning("Hata", "Hedef Mamul ve en az bir hammadde seçmelisiniz.");
      return;
    }
    
    // Validasyon
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

      const res = await fetch("/api/inventory/boms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bomData),
      });

      const data = await res.json();
      if (data.success) {
        showSuccess("Başarılı", "Yeni Reçete başarıyla kaydedildi.");
        setIsModalOpen(false);
        setNewBom({ productId: "", name: "", code: "", description: "", items: [] });
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
    showConfirm("Reçeteyi Sil", `"${bomName}" isimli reçeteyi silmek istediğinize emin misiniz?`, async () => {
      try {
        const res = await fetch(`/api/inventory/boms/${bomId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          showSuccess("Başarılı", "Reçete silindi.");
          fetchBoms();
        } else {
          showError("Hata", data.error || "Silinirken hata oluştu.");
        }
      } catch (e) {
        showError("Hata", "Silme işleminde beklenmedik hata.");
      }
    });
  };

  const filteredBoms = boms.filter((bom) => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (bom.name?.toLowerCase().includes(lower) || bom.code?.toLowerCase().includes(lower) || bom.product?.name?.toLowerCase().includes(lower));
  });

  // UI Class Generators
  const cardClass = isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-900 border border-slate-800";
  const modalClass = isLight ? "bg-white border border-slate-200 shadow-2xl" : "bg-slate-900 border border-slate-800 shadow-2xl";
  const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
  const textValueClass = isLight ? "text-slate-900" : "text-white";
  const inputClass = isLight
    ? "w-full h-[44px] px-3 rounded-[10px] text-[13px] font-medium border border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500 outline-none transition-all"
    : "w-full h-[44px] px-3 rounded-[10px] text-[13px] font-medium border border-slate-800 bg-slate-900/50 text-slate-200 focus:border-blue-500 outline-none transition-all";

  return (
    <div data-pos-theme={theme} className={`w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans ${isLight ? "bg-[#FAFAFA]" : ""}`}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className={`text-[24px] font-semibold tracking-tight ${textValueClass}`}>
            Reçeteler (BOM)
          </h1>
          <p className={`text-[13px] mt-1 font-medium ${textLabelClass}`}>
            Üretim reçetelerini yönetin ve hammadde karışımlarını belirleyin.
          </p>
        </div>
        <div className="flex gap-3">
          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className={`h-[40px] px-5 flex items-center gap-2 rounded-[12px] font-medium text-[13px] transition-all shadow-sm ${isLight ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600 text-white hover:bg-blue-500"}`}
            >
              <Plus className="w-4 h-4" />
              Yeni Reçete
            </button>
          )}
        </div>
      </div>

      {/* KPI Banner */}
      <div className={`flex rounded-[14px] border overflow-hidden ${cardClass}`}>
        <div className={`flex-1 p-5 border-r ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Layers className={`w-4 h-4 ${isLight ? "text-blue-500" : "text-blue-400"}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Toplam Reçete</span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight ${textValueClass}`}>{boms.length}</div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-[500px]">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
          <input
            type="text"
            placeholder="Reçete adı, kodu veya ürün ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-[40px] pl-[38px] pr-4 rounded-[10px] text-[13px] font-medium border outline-none transition-all ${isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-900 border-slate-800 text-slate-200"}`}
          />
        </div>
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="py-20 text-center">Yükleniyor...</div>
      ) : filteredBoms.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-[14px] border border-dashed ${cardClass}`}>
          <Database className={`w-12 h-12 mb-4 opacity-20 ${textLabelClass}`} />
          <h3 className={`text-[16px] font-semibold ${textValueClass}`}>Reçete Bulunamadı</h3>
          <p className={`text-[13px] mt-1 ${textLabelClass}`}>Sisteminizde henüz tanımlı bir reçete (BOM) kaydı yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBoms.map((bom) => (
            <div key={bom.id} className={`rounded-[14px] p-5 flex flex-col gap-4 border transition-all ${cardClass} hover:shadow-sm ${isLight ? 'hover:border-blue-200' : 'hover:border-blue-800'}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-[15px] font-bold shrink-0 ${isLight ? "bg-blue-50 text-blue-600" : "bg-blue-900/30 text-blue-400"}`}>
                    <Box className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className={`text-[15px] font-semibold truncate ${textValueClass}`}>
                      {bom.name || bom.product?.name || "İsimsiz Reçete"}
                    </h3>
                    <p className={`text-[12px] truncate ${textLabelClass}`}>
                      Kod: {bom.code}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-[10px] border ${isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/50 border-slate-800/80"}`}>
                <div>
                  <div className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Hedef Mamul</div>
                  <div className={`text-[13px] font-semibold truncate mt-0.5 ${textValueClass}`}>{bom.product?.name}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className={`text-[12px] font-medium ${textLabelClass}`}>
                  {bom.items?.length || 0} Hammadde Kalemi
                </div>
                <div className={`text-[12px] font-semibold text-emerald-500`}>
                  Aktif
                </div>
              </div>

              <div className={`flex items-center gap-2 mt-auto pt-4 border-t ${isLight ? "border-slate-100" : "border-slate-800/50"}`}>
                <button
                  className={`flex-1 h-[36px] flex items-center justify-center gap-2 rounded-[8px] text-[13px] font-medium border transition-colors ${isLight ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"}`}
                >
                  <ListPlus className="w-4 h-4" /> Detaylar
                </button>
                {canManage && (
                  <button
                    onClick={() => handleDeleteBom(bom.id, bom.name || bom.code)}
                    className={`h-[36px] px-3 rounded-[8px] border flex items-center justify-center transition-colors ${isLight ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" : "bg-red-900/20 border-red-800/50 text-red-400 hover:bg-red-900/40"}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50">
          <div className={`w-[800px] max-w-full rounded-[16px] overflow-hidden flex flex-col max-h-[90vh] ${modalClass} animate-in zoom-in-95 duration-200`}>
            <div className={`flex justify-between items-center px-6 py-4 border-b ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <h2 className={`text-[16px] font-semibold ${textValueClass}`}>Yeni Üretim Reçetesi (BOM)</h2>
              <button onClick={() => setIsModalOpen(false)} className={`text-2xl leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scroll flex flex-col gap-6">
              {/* Parent Info */}
              <div className={`p-4 rounded-[12px] border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700"}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Üretilecek Hedef Ürün (Mamul) <span className="text-red-500">*</span></label>
                    <select
                      value={newBom.productId}
                      onChange={e => {
                        const pid = e.target.value;
                        const p = products.find(x => x.id === pid);
                        setNewBom(prev => ({ 
                          ...prev, 
                          productId: pid, 
                          name: prev.name || (p ? `${p.name} Reçetesi` : "") 
                        }));
                      }}
                      className={inputClass}
                    >
                      <option value="">Hedef ürünü seçin...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Reçete Adı</label>
                    <input type="text" value={newBom.name} onChange={e => setNewBom({ ...newBom, name: e.target.value })} className={inputClass} placeholder="Örn: Standart Koltuk Reçetesi" />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Reçete Kodu</label>
                    <input type="text" value={newBom.code} onChange={e => setNewBom({ ...newBom, code: e.target.value })} className={inputClass} placeholder="Boş bırakılırsa otomatik üretilir" />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-[14px] font-semibold ${textValueClass}`}>Hammadde ve Yarı Mamuller (Girdiler)</h3>
                  <button onClick={handleAddBomItem} className={`text-[12px] font-medium flex items-center gap-1 hover:underline ${isLight ? "text-blue-600" : "text-blue-400"}`}>
                    <Plus className="w-3 h-3" /> Kalem Ekle
                  </button>
                </div>
                
                {newBom.items.length === 0 ? (
                  <div className={`py-8 text-center rounded-[10px] border border-dashed ${isLight ? "bg-slate-50 border-slate-300" : "bg-slate-900/50 border-slate-700"}`}>
                    <p className={`text-[12px] ${textLabelClass}`}>Henüz girdi kalemi eklenmedi. "Kalem Ekle" butonuna basın.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {newBom.items.map((item, idx) => (
                      <div key={idx} className={`flex items-start gap-3 p-3 rounded-[10px] border ${isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700"}`}>
                        <div className="flex-1">
                          <label className={`block text-[10px] font-semibold uppercase mb-1 ${textLabelClass}`}>Girdi Ürünü</label>
                          <select
                            value={item.productId}
                            onChange={e => handleUpdateBomItem(idx, "productId", e.target.value)}
                            className={`w-full h-[36px] px-2 rounded-[8px] text-[12px] border outline-none ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-700 text-slate-200"}`}
                          >
                            <option value="">Ürün Seçiniz...</option>
                            {products.filter(p => p.id !== newBom.productId).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-[100px]">
                          <label className={`block text-[10px] font-semibold uppercase mb-1 ${textLabelClass}`}>Miktar</label>
                          <input
                            type="number"
                            min="0.0001"
                            step="any"
                            value={item.quantity}
                            onChange={e => handleUpdateBomItem(idx, "quantity", e.target.value)}
                            className={`w-full h-[36px] px-2 rounded-[8px] text-[12px] border outline-none ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-700 text-slate-200"}`}
                          />
                        </div>
                        <div className="w-[80px]">
                          <label className={`block text-[10px] font-semibold uppercase mb-1 ${textLabelClass}`}>Birim</label>
                          <input
                            type="text"
                            value={item.unit}
                            disabled
                            className={`w-full h-[36px] px-2 rounded-[8px] text-[12px] border outline-none opacity-70 ${isLight ? "bg-slate-100 border-slate-200 text-slate-800" : "bg-slate-900 border-slate-700 text-slate-400"}`}
                          />
                        </div>
                        <div className="w-[90px]">
                          <label className={`block text-[10px] font-semibold uppercase mb-1 ${textLabelClass}`}>Fire (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.wastePercentage}
                            onChange={e => handleUpdateBomItem(idx, "wastePercentage", e.target.value)}
                            className={`w-full h-[36px] px-2 rounded-[8px] text-[12px] border outline-none ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-700 text-slate-200"}`}
                          />
                        </div>
                        <div className="pt-[18px]">
                          <button
                            onClick={() => handleRemoveBomItem(idx)}
                            className={`w-[36px] h-[36px] flex items-center justify-center rounded-[8px] border transition-colors ${isLight ? "text-red-500 border-red-100 hover:bg-red-50" : "text-red-400 border-red-900/50 hover:bg-red-900/20"}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={`p-6 bg-slate-50 dark:bg-slate-900 border-t ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <button 
                onClick={handleSaveBom} 
                disabled={isProcessing} 
                className={`w-full h-[44px] rounded-[10px] text-[14px] font-semibold text-white transition-all flex justify-center items-center gap-2 ${isLight ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-500"} ${isProcessing ? 'opacity-50' : ''}`}
              >
                {isProcessing ? "Kaydediliyor..." : "Reçeteyi Kaydet ve Kapat"}
                {!isProcessing && <ArrowRight className="w-4 h-4.border-t" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
