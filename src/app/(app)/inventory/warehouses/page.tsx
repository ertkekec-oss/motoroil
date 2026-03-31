"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useModal } from "@/contexts/ModalContext";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Layers,
  Search,
  Box,
  MapPin,
  TrendingUp,
} from "lucide-react";
import TransferTabContent from "../components/TransferTabContent";

export default function WarehouseManagementPage() {
  const { theme } = useTheme();
  const { branches, currentUser } = useApp();
  const { showSuccess, showError, showWarning } = useModal();
  const isLight = theme === "light";

  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>("Tümü");

  const [activeTab, setActiveTab] = useState("general");
  const isSystemAdmin = !currentUser || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role?.toLowerCase().includes('admin');
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const productsToImport: any[] = [];
        const currentProducts = [...(products || [])];

        data.forEach((row: any, index) => {
          if (!row["Ürün Adı"]) {
            return;
          }

          let code = row["Stok Kodu"] ? String(row["Stok Kodu"]).trim() : "";
          if (!code) {
            let suffix = 1;
            let candidateCode = "";
            do {
              candidateCode = `OTO-${(currentProducts.length + index + suffix).toString().padStart(5, "0")}`;
              suffix++;
            } while (
              currentProducts.some((p) => p.code === candidateCode) ||
              productsToImport.some((p) => p.code === candidateCode)
            );
            code = candidateCode;
          }

          const sVatInc = row["Satış Dahil"]?.toString().toUpperCase() === "E";
          const pVatInc = row["Alış Dahil"]?.toString().toUpperCase() === "E";

          productsToImport.push({
            name: row["Ürün Adı"],
            code: code,
            barcode: (row["Barkod"] || "").toString(),
            category: row["Kategori"] || "Genel",
            brand: row["Marka"] || "Bilinmiyor",
            buyPrice: parseFloat(row["Alış Fiyatı"]) || 0,
            purchaseVat: parseInt(row["Alış KDV"]) || 20,
            purchaseVatIncluded: pVatInc,
            price: parseFloat(row["Satış Fiyatı"]) || 0,
            salesVat: parseInt(row["Satış KDV"]) || 20,
            salesVatIncluded: sVatInc,
            stock: parseInt(row["Stok"]) || 0,
            supplier: row["Tedarikçi"] || "",
            branch: row["Şube"] || "Merkez",
          });
        });

        if (productsToImport.length > 0) {
          showSuccess(
            "Yükleniyor...",
            `${productsToImport.length} ürün işleniyor, lütfen bekleyin.`,
          );

          const res = await fetch("/api/products/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products: productsToImport }),
          });

          const result = await res.json();

          if (result.success) {
            fetchProducts();
            showSuccess(
              "İşlem Tamamlandı",
              `${result.results.created} yeni ürün eklendi. ${result.results.updated} ürün güncellendi.` +
              (result.results.errors.length > 0
                ? `\n${result.results.errors.length} hata oluştu.`
                : ""),
            );
          } else {
            showError("Yükleme Hatası", result.error || "Bilinmeyen hata");
          }
        } else {
          showWarning(
            "Geçerli Ürün Bulunamadı",
            "Dosyada eklenecek geçerli ürün verisi bulunamadı.",
          );
        }
      } catch (error: any) {
        console.error("Excel parse error:", error);
        showError(
          "Dosya Hatası",
          "Excel dosyası okunurken bir hata oluştu: " + error.message,
        );
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportToExcel = () => {
    const data = products.map((p) => ({
      "Stok Kodu": p.code,
      Barkod: p.barcode || "",
      "Ürün Adı": p.name,
      Kategori: p.category,
      Marka: p.brand,
      Stok: p.stock,
      "Birim Fiyat": p.price,
      "Alış Fiyatı": p.buyPrice,
      "KDV (%)": p.salesVat,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Depo_Envanteri");
    XLSX.writeFile(
      wb,
      `Depo_Stok_Raporu_${new Date().toLocaleDateString()}.xlsx`,
    );
    showSuccess("Excel İndiriliyor", "Dosya indirme işlemi başlatıldı.");
  };

  const startCount = () => {
     router.push('/inventory?action=count');
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
         setProducts(data.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getBranchStock = (product: any, branchName: string) => {
    if (!product.stocks || !Array.isArray(product.stocks)) return 0;
    if (branchName === "Tümü") {
      return product.stocks.reduce((acc: number, s: any) => acc + (s.quantity || 0), 0);
    }
    const entry = product.stocks.find((s: any) => s.branch === branchName);
    return entry ? entry.quantity || 0 : 0;
  };

  const totalBranches = branches?.length || 0;
  
  const branchAnalytics = useMemo(() => {
    if (!products) return {};
    const analytics: any = { "Tümü": { totalQuantity: 0, totalValue: 0 } };
    
    products.forEach(p => {
        const globalQty = getBranchStock(p, "Tümü");
        analytics["Tümü"].totalQuantity += globalQty;
        analytics["Tümü"].totalValue += globalQty * (p.price || 0);

        if (p.stocks) {
            p.stocks.forEach((s: any) => {
                if (!analytics[s.branch]) analytics[s.branch] = { totalQuantity: 0, totalValue: 0 };
                analytics[s.branch].totalQuantity += (s.quantity || 0);
                analytics[s.branch].totalValue += (s.quantity || 0) * (p.price || 0);
            });
        }
    });
    return analytics;
  }, [products]);

  const displayProducts = products
    .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.code?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => {
       const qty = getBranchStock(p, selectedBranch);
       return qty > 0 || selectedBranch === "Tümü";
    })
    .sort((a,b) => getBranchStock(b, selectedBranch) - getBranchStock(a, selectedBranch));

  return (
    <div data-pos-theme={theme} className={`w-full min-h-[100vh] px-6 py-6 transition-colors duration-300 font-sans flex flex-col relative ${isLight ? "" : ""}`}>
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 shrink-0 relative z-30">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-[26px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <Layers className="w-6 h-6 text-indigo-500" /> Depo ve Stok Yönetimi
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-bold tracking-wide mt-1 uppercase">
            Şubeler arası stokları izleyin, depo transferlerini gerçekleştirin ve envanteri yönetin.
          </p>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-start xl:justify-end gap-3 flex-wrap xl:flex-nowrap w-full xl:w-auto mt-4 xl:mt-0">
          <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="h-[46px] px-6 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest rounded-full text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            {isProcessing ? "İşleniyor..." : "İçe Aktar"}
          </button>
          <button onClick={exportToExcel} className="h-[46px] px-6 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest rounded-full text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            İndir (Excel)
          </button>
          <button onClick={startCount} className="h-[46px] px-6 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest rounded-full text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            Stok Sayımı
          </button>
          <button onClick={() => router.push('/inventory/labels')} className="h-[46px] px-6 border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-black uppercase tracking-widest rounded-full text-[12px] hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            Etiket Yazdır
          </button>
        </div>
      </div>

      <div className={`flex flex-col xl:flex-row justify-between items-center gap-4 p-2 rounded-[24px] mb-6 shadow-sm relative z-10 w-full border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-slate-800/80'}`}>
          <div className={`flex p-1.5 rounded-full w-full xl:w-auto overflow-x-auto shadow-inner border custom-scroll ${isLight ? 'bg-slate-100 border-slate-200/50' : 'bg-[#1e293b]/50 border-white/5'}`}>
              {[
                { id: "general", label: "DEPO YÖNETİMİ" },
                { id: "transfers", label: "TRANSFER İŞLEMLERİ" }
              ].map((tab) => {
                 const isActive = activeTab === tab.id;
                 return (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[200px] h-11 px-6 rounded-full text-[11px] font-black tracking-widest uppercase transition-all outline-none whitespace-nowrap flex items-center justify-center gap-2 border ${isActive ? (isLight ? 'bg-white text-indigo-600 shadow-sm border-slate-200' : 'bg-indigo-500/20 text-indigo-400 shadow-sm border-indigo-500/30') : (isLight ? 'text-slate-500 hover:text-slate-700 border-transparent' : 'text-slate-400 hover:text-slate-300 border-transparent')}`}
                     >
                        {tab.label}
                     </button>
                 );
              })}
          </div>
      </div>

      {activeTab === "general" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className={`flex rounded-[24px] border overflow-hidden shadow-sm ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                <div className={`flex-1 p-6 border-r ${isLight ? "border-slate-100" : "border-slate-800/80"}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className={`w-4 h-4 ${isLight ? "text-indigo-500" : "text-indigo-400"}`} />
                        <span className={`text-[12px] font-black uppercase tracking-widest ${isLight ? "text-slate-400" : "text-slate-500"}`}>Toplam Şube / Depo</span>
                    </div>
                    <div className={`text-[32px] font-black tracking-tight tabular-nums ${isLight ? "text-slate-900" : "text-white"}`}>{totalBranches}</div>
                </div>
                <div className={`flex-1 p-6 border-r ${isLight ? "border-slate-100" : "border-slate-800/80"}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Package className={`w-4 h-4 text-emerald-500`} />
                        <span className={`text-[12px] font-black uppercase tracking-widest ${isLight ? "text-slate-400" : "text-slate-500"}`}>Aktif Toplam Stok</span>
                    </div>
                    <div className={`text-[32px] font-black tracking-tight text-emerald-500 tabular-nums`}>{branchAnalytics["Tümü"]?.totalQuantity || 0} Adet</div>
                </div>
                <div className={`flex-1 p-6`}>
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className={`w-4 h-4 text-blue-500`} />
                        <span className={`text-[12px] font-black uppercase tracking-widest ${isLight ? "text-slate-400" : "text-slate-500"}`}>Envanter Satış Değeri</span>
                    </div>
                    <div className={`text-[32px] font-black tracking-tight text-blue-500 tabular-nums`}>{formatCurrency(branchAnalytics["Tümü"]?.totalValue || 0)}</div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* LEFT SIDEBAR - WAREHOUSE LIST */}
                <div className="w-full lg:w-[320px] flex-shrink-0 space-y-4">
                    <h3 className={`text-[13px] font-black uppercase tracking-widest ${isLight ? "text-slate-500" : "text-slate-400"}`}>Depo Filtreleri</h3>
                    <div className={`rounded-[24px] border overflow-hidden shadow-sm flex flex-col ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                        <button 
                            onClick={() => setSelectedBranch("Tümü")}
                            className={`w-full text-left p-5 flex flex-col border-b last:border-0 transition-colors ${selectedBranch === "Tümü" ? (isLight ? "bg-indigo-50 border-l-[3px] border-l-indigo-500" : "bg-indigo-900/20 border-l-[3px] border-l-indigo-500") : (isLight ? "hover:bg-slate-50 border-l-[3px] border-transparent" : "hover:bg-slate-800/50 border-l-[3px] border-transparent")} ${isLight ? "border-slate-100" : "border-slate-800"}`}
                        >
                            <span className={`text-[14px] font-black ${selectedBranch === "Tümü" ? "text-indigo-600 dark:text-indigo-400" : (isLight ? "text-slate-900" : "text-white")}`}>Tüm Depolar (Genel)</span>
                            <span className={`text-[12px] font-bold mt-1 uppercase tracking-widest ${isLight ? "text-slate-400" : "text-slate-500"}`}>Toplam: {branchAnalytics["Tümü"]?.totalQuantity || 0} Adet</span>
                        </button>
                        {branches?.map(b => (
                            <button 
                                key={b.name}
                                onClick={() => setSelectedBranch(b.name)}
                                className={`w-full text-left p-5 flex flex-col border-b last:border-0 transition-colors ${selectedBranch === b.name ? (isLight ? "bg-indigo-50 border-l-[3px] border-l-indigo-500" : "bg-indigo-900/20 border-l-[3px] border-l-indigo-500") : (isLight ? "hover:bg-slate-50 border-l-[3px] border-transparent" : "hover:bg-slate-800/50 border-l-[3px] border-transparent")} ${isLight ? "border-slate-100" : "border-slate-800"}`}
                            >
                                <span className={`text-[14px] font-black ${selectedBranch === b.name ? "text-indigo-600 dark:text-indigo-400" : (isLight ? "text-slate-900" : "text-white")}`}>{b.name} Şubesi</span>
                                <span className={`text-[12px] font-bold mt-1 uppercase tracking-widest ${isLight ? "text-slate-400" : "text-slate-500"}`}>Toplam: {branchAnalytics[b.name]?.totalQuantity || 0} Adet</span>
                            </button>
                        ))}
                        
                        {/* Migration Button if Merkez exists */}
                        {branchAnalytics["Merkez"]?.totalQuantity > 0 && (
                            <button 
                                onClick={async () => {
                                    const btn = document.getElementById('migrate-merkez-btn');
                                    if(btn) btn.innerHTML = 'Taşınıyor... Bekleyin';
                                    try {
                                        const r = await fetch('/api/public/migrate-merkez?secret=periodya_migrate_123');
                                        const data = await r.json();
                                        if (data.success) {
                                            fetchProducts();
                                            if(btn) btn.innerHTML = 'Taşıma Başarılı! (✓)';
                                            setTimeout(() => { if(btn) btn.style.display = 'none'; }, 2000);
                                        } else {
                                            if(btn) btn.innerHTML = 'Hata: ' + (data.error || 'Bilinmiyor');
                                        }
                                    } catch (e: any) {
                                        if(btn) btn.innerHTML = 'Hata: Bağlantı sorunu';
                                    }
                                }}
                                id="migrate-merkez-btn"
                                className={`w-full text-center p-4 flex flex-col items-center justify-center transition-colors bg-red-50 hover:bg-red-100 border-t border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:border-red-900`}
                            >
                                <span className="text-[12px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Hayalet Stokları Aktar</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE - STOCK LIST */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-[500px]">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
                            <input
                                type="text"
                                placeholder="Stok Kodu veya Ürün adı ile depo içi arama..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full h-[46px] pl-11 pr-4 rounded-[16px] text-[13px] font-bold border transition-all outline-none focus:ring-1 shadow-sm ${isLight ? "bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500" : "bg-[#0f172a] border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500 placeholder-slate-500"}`}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-20 text-center font-black uppercase tracking-widest text-slate-400 text-[12px]">Veriler Yükleniyor...</div>
                    ) : displayProducts.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center py-24 rounded-[24px] border border-dashed ${isLight ? "bg-slate-50/50 border-slate-300" : "bg-slate-900/50 border-slate-700"}`}>
                            <Box className={`w-12 h-12 mb-4 opacity-30 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
                            <h3 className={`text-[16px] font-black ${isLight ? "text-slate-900" : "text-white"}`}>Liste Çok Temiz</h3>
                            <p className={`text-[13px] mt-1 font-bold ${isLight ? "text-slate-500" : "text-slate-400"}`}>Seçili depoda bu aramaya uygun stok kaydı bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className={`rounded-[24px] border overflow-hidden shadow-sm flex flex-col ${isLight ? "bg-white border-slate-200" : "bg-[#0f172a] border-slate-800"}`} style={{ height: 'calc(100vh - 350px)', minHeight: '400px' }}>
                            <div className="overflow-x-auto overflow-y-auto custom-scroll flex-1">
                                <table className="w-full text-left border-collapse relative">
                                    <thead className="sticky top-0 z-10 backdrop-blur-md">
                                        <tr className={isLight ? "bg-slate-50/95 border-b border-slate-200" : "bg-slate-900/95 border-b border-slate-800"}>
                                            <th className={`px-5 py-3.5 text-[11px] font-black uppercase tracking-widest ${isLight ? "text-slate-400" : "text-slate-500"}`}>Stok Kodu / Barkod</th>
                                            <th className={`px-5 py-3.5 text-[11px] font-black uppercase tracking-widest ${isLight ? "text-slate-400" : "text-slate-500"}`}>Ürün Adı</th>
                                            <th className={`px-5 py-3.5 text-[11px] font-black uppercase tracking-widest ${isLight ? "text-slate-400" : "text-slate-500"}`}>Kategori</th>
                                            <th className={`px-5 py-3.5 text-[11px] font-black uppercase tracking-widest ${isLight ? "text-slate-400" : "text-slate-500"}`}>Depo Dağılımı</th>
                                            <th className={`px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-right ${isLight ? "text-slate-400" : "text-slate-500"}`}>Mevcut Miktar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {displayProducts.map((p) => {
                                            const qtyInSelected = getBranchStock(p, selectedBranch);
                                            
                                            return (
                                                <tr key={p.id} className={`transition-colors group ${isLight ? "hover:bg-slate-50/80" : "hover:bg-slate-800/40"}`}>
                                                    <td className="px-5 py-4">
                                                        <div className={`text-[12px] font-black ${isLight ? "text-slate-900" : "text-white"}`}>{p.code || p.productCode}</div>
                                                        <div className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${isLight ? "text-slate-400" : "text-slate-500"}`}>{p.barcode || "-"}</div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className={`text-[13px] font-black ${isLight ? "text-slate-900" : "text-white"}`}>{p.name}</div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-300"}`}>{p.category}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {p.stocks?.filter((s:any) => s.quantity > 0).map((s:any) => (
                                                                <span key={s.id} className={`inline-flex items-center px-2.5 py-1 border rounded-[8px] text-[10px] font-black ${selectedBranch === s.branch ? "border-indigo-200 text-indigo-700 bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-400 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}>
                                                                    {s.branch}: {s.quantity}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className={`text-[15px] font-black tabular-nums ${qtyInSelected <= 0 ? "text-rose-500" : qtyInSelected < 10 ? "text-amber-500" : "text-emerald-500"}`}>{qtyInSelected} <span className="text-[12px] opacity-70">Brm</span></div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {activeTab === "transfers" && (
        <TransferTabContent
          isSystemAdmin={isSystemAdmin}
          products={products || []}
          filteredProducts={displayProducts}
          branches={branches?.map((b) => b.name) || ["Merkez", "Kadıköy"]}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}

    </div>
  );
}
