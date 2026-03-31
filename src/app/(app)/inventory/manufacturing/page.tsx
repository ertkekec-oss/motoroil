"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useModal } from "@/contexts/ModalContext";
import { useTheme } from "@/contexts/ThemeContext";
import { formatCurrency } from "@/lib/utils";
import { Search, Plus, Factory, CheckCircle2, Clock, PlayCircle, XCircle, AlertCircle, ChevronRight, Database, Box, Layers, Play } from "lucide-react";
import BomManager from "./components/BomManager";
import KanbanBoard from "./components/KanbanBoard";

export default function ManufacturingPage() {
    const { theme } = useTheme();
    const { hasPermission, branches } = useApp();
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
    const isLight = theme === "light";
    const canManage = hasPermission("inventory_manage");

    const [activeTab, setActiveTab] = useState<"KANBAN" | "BOM">("KANBAN");
    const [orders, setOrders] = useState<any[]>([]);
    const [boms, setBoms] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Order Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newOrder, setNewOrder] = useState({
        bomId: "",
        plannedQuantity: 1,
        branch: branches[0]?.name || "Merkez",
        notes: "",
        plannedStartDate: "",
        plannedEndDate: ""
    });

    // Order Detail View Modal State
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/inventory/manufacturing");
            const data = await res.json();
            if (data.success) setOrders(data.orders);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBoms = async () => {
        try {
            const res = await fetch("/api/inventory/boms");
            const data = await res.json();
            if (data.success) setBoms(data.boms.filter((b: any) => b.isActive));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products?limit=1000");
            const data = await res.json();
            if (data.success) setProducts(data.products);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        Promise.all([fetchOrders(), fetchBoms(), fetchProducts()]).finally(() => setIsLoading(false));
    }, []);

    // Manufacturing Emri Yaratma
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
                showSuccess("Başarılı", "Üretim Emri planlandı. Hammadde ayrıldı (Rezerve edildi).");
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

    // Manufacturing Emrinin Durumunu (Üretimde / Tamamlandı) Güncelleme
    const handleUpdateStatus = async (orderId: string, currentStatus: string, actionStatus: string) => {
        // Kanban üzerinden sürükle-bırak yapıldığında onay modalı
        showConfirm("Durum Güncellemesi", `Üretim durumunu "${actionStatus}" aşamasına taşıyacaksınız. Onaylıyor musunuz?`, async () => {
            try {
                const res = await fetch(`/api/inventory/manufacturing/${orderId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: actionStatus })
                });
                const data = await res.json();
                if (data.success) {
                    showSuccess("Başarılı", "Üretim durumu kaydedildi.");
                    fetchOrders();
                    setSelectedOrder(null);
                } else {
                    showError("Hata", data.error || "Güncelleme başarısız.");
                }
            } catch (e) {
                showError("Hata", "API Hatası.");
            }
        });
    };

    return (
        <div data-pos-theme={theme} className="w-full h-full min-h-[100vh] px-6 py-6 transition-colors duration-300 font-sans flex flex-col relative">
            {/* ÜST BAŞLIK & YENİ ÜRETİM EMRİ ÇAĞRISI */}
            <div className="flex justify-between items-end mb-8 shrink-0 relative z-30">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-[26px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Üretim Kontrol Merkezi
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 font-bold tracking-wide mt-1 uppercase">
                        Gelişmiş MRP Panosu: Reçete (BOM), Kanban ve Sipariş Karşılama
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {canManage && activeTab === 'KANBAN' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="h-[46px] px-8 bg-indigo-600 hover:bg-indigo-700 !text-white font-black rounded-full text-[13px] uppercase tracking-widest transition-colors shadow-lg shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap border border-indigo-600"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            Yeni Üretim Başlat
                        </button>
                    )}
                </div>
            </div>

            {/* SEKMELER */}
            <div className={`flex flex-col xl:flex-row justify-between items-center gap-4 p-2 rounded-[24px] mb-6 shadow-sm relative z-10 w-full border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-slate-800/80'}`}>
                <div className={`flex p-1.5 rounded-full w-full xl:w-auto overflow-x-auto shadow-inner border custom-scroll ${theme === 'light' ? 'bg-slate-100 border-slate-200/50' : 'bg-[#1e293b]/50 border-white/5'}`}>
                    {[
                        { id: 'KANBAN', label: 'ÜRETİM EKRANI (KANBAN)', icon: Box },
                        { id: 'BOM', label: 'ÜRÜN REÇETELERİ (BOM)', icon: Layers }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 min-w-[220px] h-11 px-6 rounded-full text-[11px] font-black tracking-widest transition-all outline-none whitespace-nowrap flex items-center justify-center gap-2 border ${isActive ? (theme === 'light' ? 'bg-white text-indigo-600 shadow-sm border-slate-200' : 'bg-indigo-500/20 text-indigo-400 shadow-sm border-indigo-500/30') : (theme === 'light' ? 'text-slate-500 hover:text-slate-700 border-transparent' : 'text-slate-400 hover:text-slate-300 border-transparent')}`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* İçerik */}
            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                    <Factory className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4 animate-pulse" />
                    <div className="text-[12px] font-black uppercase tracking-widest text-slate-400">Veriler Yükleniyor...</div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 relative animate-in fade-in duration-500">
                    {activeTab === "KANBAN" ? (
                        <KanbanBoard orders={orders} handleUpdateStatus={handleUpdateStatus} setSelectedOrder={setSelectedOrder} />
                    ) : (
                        <BomManager boms={boms} products={products} fetchBoms={fetchBoms} />
                    )}
                </div>
            )}

            {/* YENİ ÜRETİM EMRİ MODALI */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
                        <div className="flex justify-between items-start px-8 py-6 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="relative z-10">
                                <h2 className="text-[20px] font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1 tracking-tight">
                                    <Factory className="w-5 h-5 text-indigo-500" />
                                    <span>Pre-flight: Üretim Kontrolü</span>
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse"></span>
                                    <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest">Reçete bazlı stok rezervasyonu</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 relative z-10 border border-slate-200 dark:border-slate-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scroll flex flex-col gap-6 bg-slate-50/50 dark:bg-[#0f172a]/50">
                            <div className="p-5 rounded-[24px] border bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 flex gap-4">
                                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
                                <div>
                                    <h4 className="text-[13px] font-black tracking-widest uppercase text-indigo-800 dark:text-indigo-300 mb-1">BOM & Fire Kontrolü Çalışacak</h4>
                                    <p className="text-[12px] font-bold text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed">
                                        Seçilen reçete katsayılarına göre <b>tahmini hammadde ihtiyacı</b> hesaplanacaktır. Hammaddeler stoka rezerve edilerek "Planlandı" aşamasına dahil edilir.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-widest px-1 text-slate-500 dark:text-slate-400">Reçete (BOM) <span className="text-red-500">*</span></label>
                                <select
                                    value={newOrder.bomId}
                                    onChange={e => setNewOrder({ ...newOrder, bomId: e.target.value })}
                                    className="w-full bg-white dark:bg-[#1e293b] p-3.5 text-[13px] font-bold text-slate-900 dark:text-white rounded-[16px] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors cursor-pointer shadow-sm"
                                >
                                    <option value="">Kayıtlı reçetelerden seçin...</option>
                                    {boms.map(bom => (
                                        <option key={bom.id} value={bom.id}>{bom.name} (Mamul: {bom.product?.name})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest px-1 text-slate-500 dark:text-slate-400">Üretilecek Miktar <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newOrder.plannedQuantity || ''}
                                        onChange={e => setNewOrder({ ...newOrder, plannedQuantity: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-white dark:bg-[#1e293b] py-3.5 px-4 text-[16px] font-black text-slate-900 dark:text-white rounded-[16px] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors shadow-inner"
                                    />
                                    {newOrder.bomId && (
                                        <div className="mt-1 ml-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                            Miktar * BOM Formülü = Rezerve
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest px-1 text-slate-500 dark:text-slate-400">Bağlı Şube / Atölye <span className="text-red-500">*</span></label>
                                    <select
                                        value={newOrder.branch}
                                        onChange={e => setNewOrder({ ...newOrder, branch: e.target.value })}
                                        className="w-full bg-white dark:bg-[#1e293b] p-3.5 text-[13px] font-bold text-slate-900 dark:text-white rounded-[16px] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors cursor-pointer shadow-sm"
                                    >
                                        {branches.map(b => (
                                            <option key={b.name} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-widest px-1 text-slate-500 dark:text-slate-400">Atölye Notları</label>
                                <textarea
                                    value={newOrder.notes}
                                    onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
                                    className="w-full bg-white dark:bg-[#1e293b] p-4 text-[13px] font-bold text-slate-900 dark:text-white rounded-[16px] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors shadow-inner min-h-[100px] resize-none"
                                    placeholder="Ustabaşına / atölyeye verilecek kritik notlar..."
                                />
                            </div>

                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] relative z-10 flex flex-col gap-3">
                            <button
                                onClick={handleSaveOrder}
                                disabled={isProcessing}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-[16px] font-black text-[14px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2 border border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {isProcessing ? "Eşzamanlanıyor..." : "Üretime Al & Kaynakları Bağla"}
                            </button>
                            <button
                                className="w-full py-3 text-[12px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isProcessing}
                            >
                                İptal Et
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ORDER DETAIL MODALI */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
                        <div className="flex justify-between items-start px-8 py-6 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-[20px] font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1 tracking-tight">
                                    <Factory className="w-5 h-5 opacity-60" /> Emir Detay: {selectedOrder.orderNumber}
                                </h2>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 relative z-10 border border-slate-200 dark:border-slate-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scroll flex flex-col gap-6 bg-slate-50/50 dark:bg-[#0f172a]/50">
                            <div className="p-6 rounded-[24px] border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/20 shadow-sm">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2">
                                        <div className="text-[11px] font-black uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-500">Hedef Mamul</div>
                                        <div className="text-[18px] font-black text-slate-900 dark:text-white">{selectedOrder.product?.name}</div>
                                        <div className="text-[12px] font-bold mt-1 text-indigo-600 dark:text-indigo-400">Reçete: {selectedOrder.bom?.name}</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-[#0f172a] rounded-[16px] border border-slate-100 dark:border-slate-800">
                                        <div className="text-[11px] font-black uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-500">Planlanan</div>
                                        <div className="text-[24px] font-black text-slate-900 dark:text-white tabular-nums">{selectedOrder.plannedQuantity} <span className="text-[12px] text-slate-400">Brm</span></div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-[#0f172a] rounded-[16px] border border-slate-100 dark:border-slate-800">
                                        <div className="text-[11px] font-black uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-500">Bağlı Atölye</div>
                                        <div className="text-[16px] font-bold mt-2 text-slate-900 dark:text-white">{selectedOrder.branch}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[13px] font-black tracking-widest uppercase mb-4 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Reçete İhtiyaç Haritası</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center px-5 py-4 rounded-[20px] border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 shadow-sm transition-colors hover:border-indigo-200 dark:hover:border-indigo-900/50 group">
                                            <div>
                                                <div className="text-[14px] font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.product?.name}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest mt-1 text-slate-400 dark:text-slate-500">Br MLYT: {formatCurrency(item.unitCost)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[15px] font-black text-slate-900 dark:text-white tabular-nums">{parseFloat(item.plannedQuantity).toFixed(2)} İhtiyaç</div>
                                                <div className="text-[11px] font-bold uppercase tracking-widest mt-0.5 text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md inline-block">∑ {formatCurrency(item.totalCost)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
