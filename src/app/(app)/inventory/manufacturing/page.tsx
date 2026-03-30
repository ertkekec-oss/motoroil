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

    const modalClass = isLight ? "bg-white border border-slate-200 shadow-2xl" : "bg-slate-900 border border-slate-800 shadow-2xl";
    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";
    const inputClass = isLight
        ? "w-full h-[40px] px-3 rounded-[16px] text-[13px] font-medium border border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500 outline-none transition-all"
        : "w-full h-[40px] px-3 rounded-[16px] text-[13px] font-medium border border-slate-800 bg-slate-900/50 text-slate-200 focus:border-blue-500 outline-none transition-all";

    return (
        <div data-pos-theme={theme} className={`w-full h-full min-h-[100vh] px-8 py-8 transition-colors duration-300 font-sans flex flex-col ${isLight ? "bg-[#FAFAFA]" : ""}`}>
            {/* ÜST BAŞLIK & YENİ ÜRETİM EMRİ ÇAĞRISI */}
            <div className="flex justify-between items-end mb-6 shrink-0">
                <div>
                    <h1 className={`text-[24px] font-[900] tracking-tight ${textValueClass}`}>
                        Üretim Kontrol Merkezi
                    </h1>
                    <p className={`text-[13px] mt-1.5 font-bold uppercase tracking-wider ${textLabelClass}`}>
                        Gelişmiş MRP Panosu: Reçete (BOM), Kanban ve Sipariş Karşılama
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {canManage && activeTab === 'KANBAN' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className={`h-[40px] px-5 flex items-center justify-center gap-2 rounded-full text-[13px] font-bold tracking-wide transition-all shadow-sm ${isLight ? "bg-slate-800 text-white hover:bg-black" : "bg-blue-600 text-white hover:bg-blue-500"}`}
                        >
                            <Play className="w-4 h-4" />
                            Yeni Üretim Başlat
                        </button>
                    )}
                </div>
            </div>

            {/* SEKMELER */}
            <div className={`flex flex-col md:flex-row justify-between items-center gap-4 p-2 rounded-[20px] mb-6 border shadow-sm relative z-10 w-full ${isLight ? "bg-white border-slate-200" : "bg-[#0f172a] border-white/5"}`}>
                <div className={`flex p-1.5 rounded-full w-full md:w-auto overflow-x-auto shadow-inner border custom-scroll ${isLight ? "bg-slate-100 border-slate-200/50" : "bg-[#1e293b]/50 border-white/5"}`}>
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
                                className={`flex-1 min-w-[200px] h-11 px-6 rounded-full text-[11px] font-black tracking-widest transition-all outline-none whitespace-nowrap flex items-center justify-center gap-2 border ${isActive ? (isLight ? 'bg-white text-indigo-600 shadow-sm border-slate-200' : 'bg-indigo-500/20 text-indigo-400 shadow-sm border-indigo-500/30') : (isLight ? 'text-slate-500 hover:text-slate-700 border-transparent' : 'text-slate-400 hover:text-slate-300 border-transparent')}`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* İçerik */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center py-20 text-[14px] font-bold uppercase tracking-wider text-slate-400">Yükleniyor...</div>
            ) : (
                <div className="flex-1 min-h-0 relative">
                    {activeTab === "KANBAN" ? (
                        <KanbanBoard orders={orders} handleUpdateStatus={handleUpdateStatus} setSelectedOrder={setSelectedOrder} />
                    ) : (
                        <BomManager boms={boms} products={products} fetchBoms={fetchBoms} />
                    )}
                </div>
            )}

            {/* YENİ ÜRETİM EMRİ MODALI (SAYFAMIZIN "AKILLI CHECK" BÖLÜMÜNÜ İÇERİR) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className={`w-[600px] max-w-full rounded-[32px]} animate-in zoom-in-95 duration-200`}>
                        <div className={`flex justify-between items-center px-8 py-5 border-b ${isLight ? "border-slate-100" : "border-slate-800"}`}>
                            <h2 className={`text-[18px] font-bold flex items-center gap-2 ${textValueClass}`}>
                                <Factory className="w-5 h-5 text-indigo-500" />
                                <span className={isLight ? "text-indigo-900" : "text-indigo-100"}>Pre-flight: Üretim Kontrolü</span>
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className={`text-2xl leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scroll flex flex-col gap-6">
                            <div className={`p-4 rounded-[20px] border flex gap-4 ${isLight ? "bg-indigo-50/50 border-indigo-100" : "bg-indigo-900/10 border-indigo-900/30"}`}>
                                <AlertCircle className={`w-6 h-6 shrink-0 mt-0.5 ${isLight ? "text-indigo-600" : "text-indigo-400"}`} />
                                <div>
                                    <h4 className={`text-[14px] font-[900] tracking-wider uppercase ${isLight ? "text-indigo-800" : "text-indigo-300"}`}>BOM & Fire Kontrolü Çalışacak</h4>
                                    <p className={`text-[12px] font-medium mt-1 ${isLight ? "text-indigo-600/80" : "text-indigo-400/80"}`}>
                                        Seçilen reçete katsayılarına göre <b>tahmini hammadde ihtiyacı</b> hesaplanacaktır. Hammaddeler stoka rezerve edilerek "Planlandı" aşamasına dahil edilir.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${textLabelClass}`}>Reçete (BOM) <span className="text-red-500">*</span></label>
                                <select
                                    value={newOrder.bomId}
                                    onChange={e => setNewOrder({ ...newOrder, bomId: e.target.value })}
                                    className={`${inputClass} !h-[48px]`}
                                >
                                    <option value="">Kayıtlı reçetelerden seçin...</option>
                                    {boms.map(bom => (
                                        <option key={bom.id} value={bom.id}>{bom.name} (Mamul: {bom.product?.name})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${textLabelClass}`}>Üretilecek Miktar <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newOrder.plannedQuantity}
                                        onChange={e => setNewOrder({ ...newOrder, plannedQuantity: parseInt(e.target.value) || 1 })}
                                        className={`${inputClass} !h-[48px]`}
                                    />
                                    {newOrder.bomId && (
                                        <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                                            Miktar * BOM Formülü = Rezerve
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${textLabelClass}`}>Bağlı Şube / Atölye <span className="text-red-500">*</span></label>
                                    <select
                                        value={newOrder.branch}
                                        onChange={e => setNewOrder({ ...newOrder, branch: e.target.value })}
                                        className={`${inputClass} !h-[48px]`}
                                    >
                                        {branches.map(b => (
                                            <option key={b.name} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${textLabelClass}`}>Atölye Notları</label>
                                <textarea
                                    value={newOrder.notes}
                                    onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
                                    className={`${inputClass} min-h-[100px] py-3 resize-none`}
                                    placeholder="Ustabaşına / atölyeye verilecek kritik notlar..."
                                />
                            </div>

                        </div>

                        <div className={`p-8 bg-slate-50 dark:bg-slate-900 border-t ${isLight ? "border-slate-100" : "border-slate-800"}`}>
                            <button
                                onClick={handleSaveOrder}
                                disabled={isProcessing}
                                className={`w-full h-[54px] rounded-full text-[15px] font-[900] tracking-widest uppercase text-white transition-all flex justify-center items-center gap-2 ${isLight ? "bg-indigo-600 hover:bg-slate-900" : "bg-indigo-600 hover:bg-white hover:text-indigo-900"} ${isProcessing ? 'opacity-50' : ''}`}
                            >
                                {isProcessing ? "Eşzamanlanıyor..." : "Üretime Al & Kaynakları Bağla"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SADECE BİLGİLENDİRME AMAÇLI ORDER DETAIL MODALI (Kanbandan tıklandığında) */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className={`w-[600px] max-w-full rounded-[32px]} animate-in zoom-in-95 duration-200`}>
                        <div className={`flex justify-between items-center px-8 py-5 border-b ${isLight ? "border-slate-100" : "border-slate-800"}`}>
                            <h2 className={`text-[16px] font-[900] tracking-wider uppercase flex items-center gap-2 ${textValueClass}`}><Factory className="w-5 h-5 opacity-60" /> Emir Detay: {selectedOrder.orderNumber}</h2>
                            <button onClick={() => setSelectedOrder(null)} className={`text-2xl leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scroll flex flex-col gap-6">
                            <div className={`p-5 rounded-[16px] border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700"}`}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70 ${textLabelClass}`}>Hedef Mamul</div>
                                        <div className={`text-[16px] font-[900] ${textValueClass}`}>{selectedOrder.product?.name}</div>
                                        <div className={`text-[12px] font-bold mt-1 ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>Reçete: {selectedOrder.bom?.name}</div>
                                    </div>
                                    <div>
                                        <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70 ${textLabelClass}`}>Planlanan</div>
                                        <div className={`text-[20px] font-[900] ${textValueClass}`}>{selectedOrder.plannedQuantity} Brm</div>
                                    </div>
                                    <div>
                                        <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70 ${textLabelClass}`}>Bağlı Atölye</div>
                                        <div className={`text-[16px] font-bold mt-1 ${textValueClass}`}>{selectedOrder.branch}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className={`text-[14px] font-[900] tracking-wider uppercase mb-3 ${textValueClass}`}>Reçete İhtiyaç Haritası</h3>
                                <div className="space-y-2">
                                    {selectedOrder.items?.map((item: any, idx: number) => (
                                        <div key={idx} className={`flex justify-between items-center p-3 rounded-[20px] border ${isLight ? "bg-white border-slate-100" : "bg-slate-800/50 border-slate-700"}`}>
                                            <div>
                                                <div className={`text-[13px] font-[900] ${textValueClass}`}>{item.product?.name}</div>
                                                <div className={`text-[11px] font-bold uppercase tracking-wider mt-1 opacity-60 ${textLabelClass}`}>Br MLYT: {formatCurrency(item.unitCost)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[13px] font-[900] ${textValueClass}`}>{parseFloat(item.plannedQuantity).toFixed(2)} Adet İhtiyaç</div>
                                                <div className={`text-[11px] font-[900] uppercase tracking-wider mt-0.5 text-indigo-500`}>∑ {formatCurrency(item.totalCost)}</div>
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
