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
  ArrowRightLeft,
  Search,
  CheckCircle2,
  Box,
  MapPin,
  TrendingUp,
  History,
  AlertCircle
} from "lucide-react";
import TransferTabContent from "../components/TransferTabContent";

export default function WarehouseManagementPage() {
  const { theme } = useTheme();
  const { hasPermission, branches, currentUser } = useApp();
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

    setIsProcessing(true); // Show loading state

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
     router.push('/inventory?action=count'); // Redirect to Inventory Count view
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

  // UI Class Generators
  const cardClass = isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-900 border border-slate-800";
  const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
  const textValueClass = isLight ? "text-slate-900" : "text-white";
  const inputClass = isLight
    ? "h-[40px] px-3 rounded-[10px] text-[13px] font-medium border border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500 outline-none transition-all"
    : "h-[40px] px-3 rounded-[10px] text-[13px] font-medium border border-slate-800 bg-slate-900/50 text-slate-200 focus:border-blue-500 outline-none transition-all";

  const totalBranches = branches?.length || 0;
  
  // Calculate analytics
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
       return qty > 0 || selectedBranch === "Tümü"; // If filtering by branch, only show items that have stock in it (or all if "Tümü")
    })
    .sort((a,b) => getBranchStock(b, selectedBranch) - getBranchStock(a, selectedBranch));

  return (
    <div data-pos-theme={theme} className={`w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans ${isLight ? "bg-[#FAFAFA]" : ""}`}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className={`text-[24px] font-semibold tracking-tight flex items-center gap-3 ${textValueClass}`}>
             <Layers className="w-6 h-6 text-indigo-500" /> Depo ve Stok Yönetimi
          </h1>
          <p className={`text-[13px] mt-1 font-medium ${textLabelClass}`}>
            Şubeler arası stokları izleyin, depo transferlerini gerçekleştirin ve envanteri yönetin.
          </p>
        </div>
        
        {/* ACTION BUTTONS FROM INVENTORY */}
        <div className="flex items-center justify-start xl:justify-end gap-3 flex-wrap xl:flex-nowrap w-full xl:w-auto mt-4 xl:mt-0">
          <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="h-[42px] px-5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-[13px] hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            {isProcessing ? "İşleniyor..." : "Yükle"}
          </button>
          <button onClick={exportToExcel} className="h-[42px] px-5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-[13px] hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            İndir
          </button>
          <button onClick={startCount} className="h-[42px] px-5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-[13px] hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            Stok Sayımı
          </button>
          <button onClick={() => router.push('/inventory/labels')} className="h-[42px] px-5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-[13px] hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            Etiket Yazdır
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-[#0f172a]/60 p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm w-max mb-6">
          <button
            onClick={() => setActiveTab("general")}
            className={activeTab === "general"
              ? "px-5 py-2.5 text-[13px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#1e293b] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[8px] transition-all tracking-wide"
              : "px-5 py-2.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all rounded-[8px] tracking-wide"}
          >
            Depo Yönetimi
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={activeTab === "transfers"
              ? "px-5 py-2.5 text-[13px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#1e293b] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[8px] transition-all tracking-wide"
              : "px-5 py-2.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all rounded-[8px] tracking-wide"}
          >
            Transfer İşlemleri
          </button>
      </div>

      {activeTab === "general" && (
        <>
        <div className={`flex rounded-[14px] border overflow-hidden ${cardClass}`}>
        <div className={`flex-1 p-5 border-r ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className={`w-4 h-4 ${isLight ? "text-indigo-500" : "text-indigo-400"}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Toplam Şube/Depo</span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight ${textValueClass}`}>{totalBranches}</div>
        </div>
        <div className={`flex-1 p-5 border-r ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Package className={`w-4 h-4 text-emerald-500`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Aktif Toplam Stok</span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight text-emerald-500`}>{branchAnalytics["Tümü"]?.totalQuantity || 0} Adet</div>
        </div>
        <div className={`flex-1 p-5 border-r ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`w-4 h-4 text-blue-500`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Envanter Satış Değeri</span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight text-blue-500`}>{formatCurrency(branchAnalytics["Tümü"]?.totalValue || 0)}</div>
        </div>
      </div>

      <div className="flex gap-6">
          {/* LEFT SIDEBAR - WAREHOUSE LIST */}
          <div className="w-[300px] flex-shrink-0 space-y-4">
              <h3 className={`text-[14px] font-bold uppercase tracking-wider ${textLabelClass}`}>Filtrele</h3>
              <div className={`rounded-[14px] border overflow-hidden flex flex-col ${cardClass}`}>
                 <button 
                    onClick={() => setSelectedBranch("Tümü")}
                    className={`w-full text-left p-4 flex flex-col border-b last:border-0 transition-colors ${selectedBranch === "Tümü" ? (isLight ? "bg-indigo-50 border-l-4 border-l-indigo-500" : "bg-indigo-900/20 border-l-4 border-l-indigo-500") : (isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/50")} ${isLight ? "border-slate-100" : "border-slate-800"}`}
                 >
                     <span className={`text-[14px] font-bold ${selectedBranch === "Tümü" ? "text-indigo-600 dark:text-indigo-400" : textValueClass}`}>Tüm Depolar (Genel)</span>
                     <span className={`text-[12px] font-medium mt-1 ${textLabelClass}`}>Toplam: {branchAnalytics["Tümü"]?.totalQuantity || 0} Adet</span>
                 </button>
                 {branches?.map(b => (
                     <button 
                        key={b.name}
                        onClick={() => setSelectedBranch(b.name)}
                        className={`w-full text-left p-4 flex flex-col border-b last:border-0 transition-colors ${selectedBranch === b.name ? (isLight ? "bg-indigo-50 border-l-4 border-l-indigo-500" : "bg-indigo-900/20 border-l-4 border-l-indigo-500") : (isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/50")} ${isLight ? "border-slate-100" : "border-slate-800"}`}
                     >
                        <span className={`text-[14px] font-bold ${selectedBranch === b.name ? "text-indigo-600 dark:text-indigo-400" : textValueClass}`}>{b.name} Şubesi</span>
                        <span className={`text-[12px] font-medium mt-1 ${textLabelClass}`}>Toplam: {branchAnalytics[b.name]?.totalQuantity || 0} Adet</span>
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
                        className={`w-full text-center p-3 flex flex-col items-center justify-center transition-colors bg-red-50 hover:bg-red-100 border-t border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:border-red-900`}
                     >
                        <span className="text-[12px] font-bold text-red-600 dark:text-red-400">Hayalet (Merkez) Stoklarını Taşı</span>
                     </button>
                 )}
              </div>
          </div>

          {/* RIGHT SIDE - STOCK LIST */}
          <div className="flex-1 space-y-4">
             <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-[500px]">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
                <input
                    type="text"
                    placeholder="Stok Kodu veya Ürün adı ile depo içi arama..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-[38px] ${inputClass}`}
                />
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center">Yükleniyor...</div>
            ) : displayProducts.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-20 rounded-[14px] border border-dashed ${cardClass}`}>
                <Box className={`w-12 h-12 mb-4 opacity-20 ${textLabelClass}`} />
                <h3 className={`text-[16px] font-semibold ${textValueClass}`}>Depo Boş veya Kayıt Bulunamadı</h3>
                <p className={`text-[13px] mt-1 ${textLabelClass}`}>Seçili depoda mevcut stok kaydı bulunmamaktadır.</p>
                </div>
            ) : (
                <div className={`rounded-[14px] border overflow-hidden ${cardClass}`}>
                <div className="overflow-x-auto custom-scroll max-h-[calc(100vh-320px)]">
                    <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 z-10 backdrop-blur-md">
                        <tr className={isLight ? "bg-slate-50/90 border-b border-slate-200" : "bg-slate-900/90 border-b border-slate-800"}>
                        <th className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Stok Kodu / Barkod</th>
                        <th className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Ürün Adı</th>
                        <th className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Kategori</th>
                        <th className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Bulunduğu Depo(lar)</th>
                        <th className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-right ${textLabelClass}`}>Sahip Olunan Stok</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {displayProducts.map((p) => {
                           const qtyInSelected = getBranchStock(p, selectedBranch);
                           
                           return (
                        <tr key={p.id} className={`transition-colors ${isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/50"}`}>
                            <td className="px-5 py-3">
                            <div className={`text-[12px] font-bold ${textValueClass}`}>{p.code || p.productCode}</div>
                            <div className={`text-[11px] mt-0.5 ${textLabelClass}`}>{p.barcode || "-"}</div>
                            </td>
                            <td className="px-5 py-3">
                              <div className={`text-[13px] font-semibold ${textValueClass}`}>{p.name}</div>
                            </td>
                            <td className="px-5 py-3">
                               <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase ${isLight ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-300"}`}>{p.category}</span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-wrap gap-1">
                                  {p.stocks?.filter((s:any) => s.quantity > 0).map((s:any) => (
                                      <span key={s.id} className={`inline-flex items-center px-1.5 py-0.5 border rounded-[4px] text-[10px] font-semibold ${selectedBranch === s.branch ? "border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}>
                                           {s.branch}: {s.quantity}
                                      </span>
                                  ))}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right">
                               <div className={`text-[15px] font-black ${qtyInSelected <= 0 ? "text-red-500" : qtyInSelected < 10 ? "text-amber-500" : "text-emerald-500"}`}>{qtyInSelected} Adet</div>
                            </td>
                        </tr>
                        )})}
                    </tbody>
                    </table>
                </div>
                </div>
            )}
          </div>
      </div>
      </>
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
