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
  Factory,
  CheckCircle2,
  Clock,
  PlayCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Database
} from "lucide-react";

export default function ManufacturingPage() {
  const { theme } = useTheme();
  const { hasPermission, branches } = useApp();
  const { showSuccess, showError, showWarning, showConfirm } = useModal();
  const isLight = theme === "light";

  const canManage = hasPermission("inventory_manage");

  const [orders, setOrders] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newOrder, setNewOrder] = useState({
    bomId: "",
    plannedQuantity: 1,
    branch: branches[0]?.name || "Merkez",
    notes: "",
    plannedStartDate: "",
    plannedEndDate: ""
  });

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/inventory/manufacturing");
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (e) {
      console.error("fetchOrders error", e);
    }
  };

  const fetchBoms = async () => {
    try {
      const res = await fetch("/api/inventory/boms");
      const data = await res.json();
      if (data.success) setBoms(data.boms.filter((b: any) => b.isActive));
    } catch (e) {
      console.error("fetchBoms error", e);
    }
  };

  useEffect(() => {
    Promise.all([fetchOrders(), fetchBoms()]).finally(() => setIsLoading(false));
  }, []);

  const handleSaveOrder = async () => {
    if (!newOrder.bomId) {
      showWarning("Hata", "Lütfen bir reçete seçin.");
      return;
    }
    
    if (newOrder.plannedQuantity <= 0) {
      showWarning("Hata", "Planlanan üretim miktarı 0'dan büyük olmalıdır.");
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/inventory/manufacturing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      const data = await res.json();
      if (data.success) {
        showSuccess("Başarılı", "Üretim Emri planlandı. Hammadde ayrıldı.");
        setIsModalOpen(false);
        setNewOrder({ bomId: "", plannedQuantity: 1, branch: branches[0]?.name || "Merkez", notes: "", plannedStartDate: "", plannedEndDate: "" });
        fetchOrders();
      } else {
        showError("Hata", data.error || "Beklenmedik bir hata.");
      }
    } catch (e) {
      showError("Hata", "API Hatası.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string, actionStatus: string) => {
    showConfirm("Durum Güncellemesi", `Üretim durumunu "${actionStatus}" olarak değiştireceksiniz. Onaylıyor musunuz?`, async () => {
      try {
        const res = await fetch(`/api/inventory/manufacturing/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: actionStatus })
        });
        const data = await res.json();
        if (data.success) {
          showSuccess("Başarılı", "Üretim durumu güncellendi.");
          fetchOrders();
        } else {
          showError("Hata", data.error || "Güncelleme başarısız.");
        }
      } catch (e) {
        showError("Hata", "API Hatası.");
      }
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (o.orderNumber?.toLowerCase().includes(lower) || o.product?.name?.toLowerCase().includes(lower));
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold tracking-wide ${isLight ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-300"}`}><Clock className="w-3.5 h-3.5" /> Taslak</span>;
      case 'PLANNED':
        return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold tracking-wide ${isLight ? "bg-blue-100 text-blue-700" : "bg-blue-900/30 text-blue-400"}`}><Clock className="w-3.5 h-3.5" /> Planlandı</span>;
      case 'IN_PROGRESS':
        return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold tracking-wide ${isLight ? "bg-amber-100 text-amber-700" : "bg-amber-900/30 text-amber-400"}`}><PlayCircle className="w-3.5 h-3.5" /> Üretimde</span>;
      case 'COMPLETED':
        return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold tracking-wide ${isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-900/30 text-emerald-400"}`}><CheckCircle2 className="w-3.5 h-3.5" /> Tamamlandı</span>;
      case 'CANCELED':
        return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold tracking-wide ${isLight ? "bg-red-100 text-red-700" : "bg-red-900/30 text-red-400"}`}><XCircle className="w-3.5 h-3.5" /> İptal Edildi</span>;
      default:
        return <span className="text-[11px]">{status}</span>;
    }
  };

  // UI Class Generators
  const cardClass = isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-900 border border-slate-800";
  const modalClass = isLight ? "bg-white border border-slate-200 shadow-2xl" : "bg-slate-900 border border-slate-800 shadow-2xl";
  const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
  const textValueClass = isLight ? "text-slate-900" : "text-white";
  const inputClass = isLight
    ? "w-full h-[40px] px-3 rounded-[10px] text-[13px] font-medium border border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500 outline-none transition-all"
    : "w-full h-[40px] px-3 rounded-[10px] text-[13px] font-medium border border-slate-800 bg-slate-900/50 text-slate-200 focus:border-blue-500 outline-none transition-all";

  return (
    <div data-pos-theme={theme} className={`w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans ${isLight ? "bg-[#FAFAFA]" : ""}`}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className={`text-[24px] font-semibold tracking-tight ${textValueClass}`}>
            Üretim Emirleri (MRP)
          </h1>
          <p className={`text-[13px] mt-1 font-medium ${textLabelClass}`}>
            Yeni üretim rotaları oluşturun, hammadde sarfiyatını izleyin ve maliyetleri kontrol edin.
          </p>
        </div>
        <div className="flex gap-3">
          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className={`h-[40px] px-5 flex items-center gap-2 rounded-[12px] font-medium text-[13px] transition-all shadow-sm ${isLight ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600 text-white hover:bg-blue-500"}`}
            >
              <Plus className="w-4 h-4" />
              Yeni Üretim Emri
            </button>
          )}
        </div>
      </div>

      {/* KPI Banner */}
      <div className={`flex rounded-[14px] border overflow-hidden ${cardClass}`}>
        <div className={`flex-1 p-5 border-r ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Factory className={`w-4 h-4 ${isLight ? "text-blue-500" : "text-blue-400"}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Toplam Emir</span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight ${textValueClass}`}>{orders.length}</div>
        </div>
        <div className={`flex-1 p-5 border-r ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle className={`w-4 h-4 text-amber-500`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Aktif Üretim</span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight text-amber-500`}>{orders.filter(o => o.status === 'IN_PROGRESS').length}</div>
        </div>
        <div className={`flex-1 p-5 border-r ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className={`w-4 h-4 text-emerald-500`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Tamamlanan</span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight text-emerald-500`}>{orders.filter(o => o.status === 'COMPLETED').length}</div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-[500px]">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
          <input
            type="text"
            placeholder="Emir No veya Mamül ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-[40px] pl-[38px] pr-4 rounded-[10px] text-[13px] font-medium border outline-none transition-all ${isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-900 border-slate-800 text-slate-200"}`}
          />
        </div>
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="py-20 text-center">Yükleniyor...</div>
      ) : filteredOrders.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-[14px] border border-dashed ${cardClass}`}>
          <Database className={`w-12 h-12 mb-4 opacity-20 ${textLabelClass}`} />
          <h3 className={`text-[16px] font-semibold ${textValueClass}`}>Üretim Emri Bulunamadı</h3>
          <p className={`text-[13px] mt-1 ${textLabelClass}`}>Arama kriterlerinize uygun veya tanımlı bir MRP emri yok.</p>
        </div>
      ) : (
        <div className={`rounded-[14px] border overflow-hidden ${cardClass}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={isLight ? "bg-slate-50 border-b border-slate-200" : "bg-slate-900 border-b border-slate-800"}>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Emir No</th>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Hedef Ürün</th>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Adet / Şube</th>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>T. Maliyet</th>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Durum</th>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide text-right ${textLabelClass}`}>Hızlı İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className={`transition-colors ${isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/50"}`}>
                    <td className="px-5 py-4">
                      <div className={`text-[13px] font-semibold ${textValueClass}`}>{o.orderNumber}</div>
                      <div className={`text-[11px] mt-0.5 ${textLabelClass}`}>{new Date(o.createdAt).toLocaleDateString("tr-TR")}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`text-[13px] font-semibold ${textValueClass}`}>{o.product?.name}</div>
                      <div className={`text-[11px] mt-0.5 ${textLabelClass}`}>Reçete: {o.bom?.name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`text-[13px] font-semibold ${textValueClass}`}>{o.plannedQuantity} Adet</div>
                      <div className={`text-[11px] mt-0.5 ${textLabelClass}`}>{o.branch}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`text-[13px] font-semibold ${textValueClass}`}>
                        {formatCurrency(o.totalEstimatedCost)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(o.status)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManage && o.status === 'PLANNED' && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, o.status, 'IN_PROGRESS')}
                            className={`px-3 py-1.5 rounded-[6px] text-[11px] font-semibold border transition-colors ${isLight ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-amber-900/20 text-amber-400 border-amber-800/50 hover:bg-amber-900/40"}`}
                          >
                            Üretime Başla
                          </button>
                        )}
                        {canManage && o.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, o.status, 'COMPLETED')}
                            className={`px-3 py-1.5 rounded-[6px] text-[11px] font-semibold border transition-colors ${isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-emerald-900/20 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/40"}`}
                          >
                            Tamamla
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors ${isLight ? "text-slate-400 hover:text-blue-600 hover:bg-blue-50" : "text-slate-500 hover:text-blue-400 hover:bg-blue-900/20"}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50">
          <div className={`w-[600px] max-w-full rounded-[16px] overflow-hidden flex flex-col max-h-[90vh] ${modalClass} animate-in zoom-in-95 duration-200`}>
            <div className={`flex justify-between items-center px-6 py-4 border-b ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <h2 className={`text-[16px] font-semibold flex items-center gap-2 ${textValueClass}`}><Factory className="w-5 h-5 text-blue-500" /> Yeni Üretim Emri (MRP)</h2>
              <button onClick={() => setIsModalOpen(false)} className={`text-2xl leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scroll flex flex-col gap-5">
              <div className={`p-4 rounded-[10px] border flex gap-3 ${isLight ? "bg-blue-50/50 border-blue-100" : "bg-blue-900/10 border-blue-900/30"}`}>
                <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isLight ? "text-blue-600" : "text-blue-400"}`} />
                <div>
                  <h4 className={`text-[13px] font-semibold ${isLight ? "text-blue-800" : "text-blue-300"}`}>Stok Yönetimi Bilgisi</h4>
                  <p className={`text-[12px] mt-1 ${isLight ? "text-blue-600/80" : "text-blue-400/80"}`}>
                    Üretim emri <b>"Üretime Başla"</b> konumuna geçtiğinde hammaddeler stoktan otomatik eksilir. <b>"Tamamla"</b> dendiğinde Yeni Mamul stoğa girer.
                  </p>
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Reçete (BOM) & Hedef Mamul <span className="text-red-500">*</span></label>
                <select
                  value={newOrder.bomId}
                  onChange={e => setNewOrder({ ...newOrder, bomId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Kayıtlı Reçetelerden Seçin...</option>
                  {boms.map(bom => (
                    <option key={bom.id} value={bom.id}>{bom.name} ({bom.product?.name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Üretilecek Miktar <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    min="1" 
                    value={newOrder.plannedQuantity} 
                    onChange={e => setNewOrder({ ...newOrder, plannedQuantity: parseInt(e.target.value) || 1 })} 
                    className={inputClass} 
                  />
                  {newOrder.bomId && (
                    <div className="mt-1 text-[10px] font-medium text-emerald-500">Miktar x Hammadde Oranı formülü uygulanacaktır.</div>
                  )}
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Bağlı Şube / Planlama <span className="text-red-500">*</span></label>
                  <select
                    value={newOrder.branch}
                    onChange={e => setNewOrder({ ...newOrder, branch: e.target.value })}
                    className={inputClass}
                  >
                    {branches.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Planlanan Başlangıç (Ops)</label>
                  <input type="date" value={newOrder.plannedStartDate} onChange={e => setNewOrder({ ...newOrder, plannedStartDate: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Planlanan Bitiş (Ops)</label>
                  <input type="date" value={newOrder.plannedEndDate} onChange={e => setNewOrder({ ...newOrder, plannedEndDate: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Özel Notlar (İsteğe Bağlı)</label>
                <textarea 
                  value={newOrder.notes} 
                  onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })} 
                  className={`${inputClass} min-h-[80px] py-2 resize-none`} 
                  placeholder="Üretim atölyesine eklenecek notlar, uyarılar..."
                />
              </div>

            </div>

            <div className={`p-6 bg-slate-50 dark:bg-slate-900 border-t ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <button 
                onClick={handleSaveOrder} 
                disabled={isProcessing} 
                className={`w-full h-[44px] rounded-[10px] text-[14px] font-semibold text-white transition-all ${isLight ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-500"} ${isProcessing ? 'opacity-50' : ''}`}
              >
                {isProcessing ? "İşleniyor..." : "Eşzamanlı Olarak Planla & Hammaddeleri Hazırla"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50">
          <div className={`w-[600px] max-w-full rounded-[16px] overflow-hidden flex flex-col max-h-[90vh] ${modalClass} animate-in zoom-in-95 duration-200`}>
            <div className={`flex justify-between items-center px-6 py-4 border-b ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <h2 className={`text-[16px] font-semibold flex items-center gap-2 ${textValueClass}`}><Factory className="w-5 h-5 text-blue-500" /> Üretim Emri Detayı</h2>
              <button onClick={() => setSelectedOrder(null)} className={`text-2xl leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
            </div>
            <div className="p-6 overflow-y-auto custom-scroll flex flex-col gap-4">
              <div className={`p-4 rounded-[10px] border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700"}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${textLabelClass}`}>Emir No</div>
                    <div className={`text-[14px] font-semibold ${textValueClass}`}>{selectedOrder.orderNumber}</div>
                  </div>
                  <div>
                    <div className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${textLabelClass}`}>Durum</div>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${textLabelClass}`}>Hedef Mamul</div>
                    <div className={`text-[14px] font-semibold ${textValueClass}`}>{selectedOrder.product?.name}</div>
                    <div className={`text-[12px] mt-1 ${textLabelClass}`}>Reçete: {selectedOrder.bom?.name} | {selectedOrder.plannedQuantity} Adet Planlandı</div>
                  </div>
                </div>
              </div>

              <h3 className={`text-[14px] font-semibold mt-2 ${textValueClass}`}>Kullanılacak/Kullanılan Hammaddeler</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className={`flex justify-between items-center p-3 rounded-[8px] border ${isLight ? "bg-white border-slate-100" : "bg-slate-800/50 border-slate-700"}`}>
                    <div>
                      <div className={`text-[13px] font-semibold ${textValueClass}`}>{item.product?.name}</div>
                      <div className={`text-[11px] mt-0.5 ${textLabelClass}`}>Birim Maliyet: {formatCurrency(item.unitCost)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[13px] font-medium ${textValueClass}`}>{item.plannedQuantity} Adet Gerekli</div>
                      <div className={`text-[11px] font-semibold mt-0.5 text-blue-500`}>T. Maliyet: {formatCurrency(item.totalCost)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
