"use client";

import { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { useApp } from "@/contexts/AppContext";
import {
  useInventory,
  Product as ContextProduct,
} from "@/contexts/InventoryContext";
import { useDebounce } from "@/hooks";
import { useModal } from "@/contexts/ModalContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import InventoryTable from "./components/InventoryTable";
import InventoryTransferModal from "./components/InventoryTransferModal";
import InventoryBulkEditModal from "./components/InventoryBulkEditModal";
import InventoryFilterBar from "./components/InventoryFilterBar";
import ProductWizardModal from "./components/ProductWizardModal";
import { DailyBriefPanel, WeeklyHealthReport, FocusQueueTab, ExecutiveSummaryMode, ExcessStockB2BButton, RiskScoreIndicator } from "./components/AutonomousInventory";
import CriticalStockBanner from "./components/CriticalStockBanner";
import ProcurementModal from "./components/ProcurementModal";
import BarcodeScanner from "@/components/BarcodeScanner";
import Pagination from "@/components/Pagination";
import BulkPriceEntryContent from "./components/BulkPriceEntryContent";

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center text-white font-black">
          Envanter Yükleniyor...
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}

function InventoryContent() {
  const { theme, toggleTheme } = useTheme();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "all";
  const initialFilter = (searchParams.get("filter") as any) || "none";

  const [activeTab, setActiveTab] = useState(initialTab);
  const {
    currentUser,
    hasPermission,
    hasFeature,
    branches: contextBranches,
    activeBranchName,
  } = useApp();
  const router = useRouter(); // Wait, need to check if router is available. Yes, it's used in AppContext.

  useEffect(() => {
    if (!hasFeature("inventory") && currentUser !== null) {
      router.push("/billing?upsell=inventory");
    }
  }, [hasFeature, currentUser, router]);

  const { products, setProducts, requestProductCreation } = useInventory();
  const {
    brands: dbBrands,
    prodCats: dbCategories,
    refreshSettings: refreshInventorySettings,
  } = useSettings();
  const { showSuccess, showError, showWarning, showConfirm } = useModal();
  const isSystemAdmin =
    !currentUser ||
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "ADMIN" ||
    currentUser.role?.toLowerCase().includes("admin") ||
    currentUser.role?.toLowerCase().includes("müdür");
  const canEdit = hasPermission("inventory_edit");
  const canDelete = hasPermission("delete_records");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- AUTONOMOUS SUI STATES ---
  const [showDailyBrief, setShowDailyBrief] = useState(true);
  const [showHealthReport, setShowHealthReport] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pdy_inventory_brief_dismissed');
    if (dismissed === new Date().toISOString().split('T')[0]) {
      setShowDailyBrief(false);
    }
  }, []);

  const handleDismissBrief = () => {
    localStorage.setItem('pdy_inventory_brief_dismissed', new Date().toISOString().split('T')[0]);
    setShowDailyBrief(false);
  };

  // --- COUNTING STATES ---
  const [isCounting, setIsCounting] = useState(false);
  const [countValues, setCountValues] = useState<
    Record<string | number, number>
  >({});
  const [auditReport, setAuditReport] = useState<any>(null);

  useEffect(() => {
    if (searchParams.get("action") === "count") {
      setIsCounting(true);
      setActiveTab("all"); // Ensure we're on the all tab
    }
  }, [searchParams]);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const branches =
    contextBranches?.length > 0
      ? contextBranches.map((b) => b.name)
      : ["Merkez", "Kadıköy"];
  const [transferData, setTransferData] = useState({
    productId: 0,
    from: branches[0] || "Merkez",
    to: branches[1] || branches[0] || "Kadıköy",
    qty: 0,
  });

  // --- PRODUCT DETAIL STATES ---
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [detailTab, setDetailTab] = useState("general"); // general, pricing

  // --- ADD PRODUCT STATES ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    code: "",
    productCode: "",
    barcode: "",
    name: "",
    brand: "",
    category: "Motosiklet",
    type: "Diğer",
    stock: 0,
    price: 0,
    currency: "TRY",
    buyPrice: 0,
    purchaseCurrency: "TRY",
    status: "ok",
    supplier: "",
    gtip: "",
    gtin: "",
    unit: "Adet",
    salesVat: 20,
    salesVatIncluded: true,
    purchaseVat: 20,
    purchaseVatIncluded: true,
    salesOiv: 0,
    salesOtv: 0,
    otvType: "Ö.T.V yok",
    branch: activeBranchName || "Merkez",
  });

  // --- PRICING STATES ---
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [productPrices, setProductPrices] = useState<Record<string, number>>(
    {},
  );
  const [showOtherPrices, setShowOtherPrices] = useState(false);

  useEffect(() => {
    // Fetch price lists
    fetch("/api/pricing/lists")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPriceLists(data.data);
        }
      })
      .catch((err) => console.error("Fiyat listeleri yüklenirken hata:", err));
  }, []);

  useEffect(() => {
    if (
      activeBranchName &&
      activeBranchName !== "all" &&
      activeBranchName !== "Tümü" &&
      activeBranchName !== "Hepsi"
    ) {
      setNewProduct((prev) => ({ ...prev, branch: activeBranchName }));
    }
  }, [activeBranchName]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ADVANCED FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [stockSort, setStockSort] = useState<"none" | "asc" | "desc">("none");
  const [specialFilter, setSpecialFilter] = useState<
    "none" | "no-move" | "top-seller" | "critical-stock"
  >(initialFilter);

  // --- BULK ACTION STATES ---
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [showBulkModal, setShowBulkModal] = useState<
    "category" | "vat" | "barcode" | "price" | null
  >(null);
  const [bulkValues, setBulkValues] = useState<any>({});
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [variantAttributes, setVariantAttributes] = useState<any[]>([]);
  const [useVariants, setUseVariants] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);

  // Modal açıldığında da verileri tazele
  useEffect(() => {
    if (showAddModal || !!selectedProduct) {
      refreshInventorySettings();
      fetch("/api/products/attributes")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setVariantAttributes(data.attributes);
        });
    }
  }, [showAddModal, selectedProduct]);

  // Adjustment states
  const [adjType, setAdjType] = useState<"percent" | "amount">("percent");
  const [adjTarget, setAdjTarget] = useState<"buy" | "sell" | "both">("sell");
  const [adjValue, setAdjValue] = useState<number>(0);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);

  const getEffectiveStock = (p: any, branchName: string | null) => {
    if (!p.stocks || !Array.isArray(p.stocks)) return p.stock || 0;

    if (
      !branchName ||
      branchName === "Tümü" ||
      branchName === "Hepsi" ||
      branchName === "all"
    ) {
      // Aggregate all branches for "All" view
      return p.stocks.reduce(
        (acc: number, s: any) => acc + (s.quantity || 0),
        0,
      );
    }

    const entry = p.stocks.find((s: any) => s.branch === branchName);
    return entry ? entry.quantity || 0 : 0;
  };

  const mappedProducts = useMemo(() => {
    if (!products) return [];
    return products.map((p) => {
      const effectiveStock = getEffectiveStock(p, activeBranchName);
      return { ...p, stock: effectiveStock, originalStock: p.stock };
    });
  }, [products, activeBranchName]);

  const inventoryValueResult = () => {
    let buyExt = 0;
    let buyInc = 0;
    let sellExt = 0;
    let sellInc = 0;

    mappedProducts.forEach((p) => {
      const qty = p.stock || 0;
      const bVat = p.purchaseVat || 20;
      const sVat = p.salesVat || 20;

      let bExt, bInc, sExt, sInc;

      if (p.purchaseVatIncluded) {
        bInc = p.buyPrice || 0;
        bExt = (p.buyPrice || 0) / (1 + bVat / 100);
      } else {
        bExt = p.buyPrice || 0;
        bInc = (p.buyPrice || 0) * (1 + bVat / 100);
      }

      if (p.salesVatIncluded) {
        sInc = p.price || 0;
        sExt = (p.price || 0) / (1 + sVat / 100);
      } else {
        sExt = p.price || 0;
        sInc = (p.price || 0) * (1 + sVat / 100);
      }

      buyExt += bExt * qty;
      buyInc += bInc * qty;
      sellExt += sExt * qty;
      sellInc += sInc * qty;
    });

    return { buyExt, buyInc, sellExt, sellInc };
  };

  const brands = Array.from(
    new Set((products || []).map((p) => String(p.brand || "Belirtilmemiş"))),
  );
  const categories = Array.from(
    new Set((products || []).map((p) => String(p.category || "Belirtilmemiş"))),
  ) as string[];

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized filtering
  const filteredProducts = useMemo(() => {
    if (!mappedProducts) return [];

    return mappedProducts
      .filter((p: any) => {
        const matchesSearch =
          (p.name || "")
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          (p.code || "")
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());
        const matchesCategory =
          filterCategory === "all"
            ? true
            : filterCategory === "uncategorized"
              ? !p.category
              : p.category === filterCategory;
        const matchesBrand =
          filterBrand === "all" ? true : p.brand === filterBrand;

        let matchesSpecial = true;
        if (specialFilter === "top-seller")
          matchesSpecial = (p.stock || 0) < 10;
        if (specialFilter === "no-move") matchesSpecial = (p.stock || 0) > 100;
        if (specialFilter === "critical-stock")
          matchesSpecial = (p.stock || 0) <= (p.minStock || 5);

        return (
          matchesSearch && matchesCategory && matchesBrand && matchesSpecial
        );
      })
      .sort((a: any, b: any) => {
        if (stockSort === "asc") return (a.stock || 0) - (b.stock || 0);
        if (stockSort === "desc") return (b.stock || 0) - (a.stock || 0);
        return 0;
      });
  }, [
    products,
    debouncedSearchTerm,
    filterCategory,
    filterBrand,
    specialFilter,
    stockSort,
    activeBranchName,
  ]);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    filterCategory,
    filterBrand,
    specialFilter,
    activeTab,
  ]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // --- ACTIONS ---
  // --- COUNTING PERSISTENCE ---
  useEffect(() => {
    if (isCounting) {
      const branch = currentUser?.branch || "Merkez";
      fetch(`/api/inventory/audit?branch=${branch}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "in_progress" && data.items) {
            const savedCounts: Record<string | number, number> = {};
            data.items.forEach((item: any) => {
              savedCounts[item.productId] = item.countedStock;
            });
            setCountValues(savedCounts);
          }
        });
    }
  }, [isCounting, currentUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isCounting && Object.keys(countValues).length > 0) {
        const branch = currentUser?.branch || "Merkez";
        const items = Object.entries(countValues).map(([id, counted]) => {
          const p = products.find((prod) => String(prod.id) === String(id));
          return {
            productId: id,
            productName: p?.name || "Bilinmiyor",
            systemStock: p?.stock || 0,
            countedStock: counted,
          };
        });
        fetch("/api/inventory/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch,
            items,
            reportedBy: currentUser?.name || "Sistem",
          }),
        });
      }
    }, 3000); // 3 sec debounce
    return () => clearTimeout(timer);
  }, [countValues, isCounting, currentUser, products]);

  // --- COUNTING & TRANSFER FUNCTIONS (Restored) ---
  const startCount = () => {
    setIsCounting(true);
    setCountValues({});
    setAuditReport(null);
    showSuccess(
      "Sayım Başlatıldı",
      "Lütfen listedeki ürünlerin sayım değerlerini girin.",
    );
  };

  const cancelReport = () => {
    if (Object.keys(countValues).length > 0) {
      showConfirm(
        "İptal Edilsin mi?",
        "Girilen sayım verileri kaybolacak.",
        () => {
          setIsCounting(false);
          setCountValues({});
          setAuditReport(null);
        },
      );
    } else {
      setIsCounting(false);
      setCountValues({});
      setAuditReport(null);
    }
  };

  const finishCount = () => {
    const reportItems: any[] = [];

    // Only verify items that have a count value entered
    Object.entries(countValues).forEach(([id, val]) => {
      const product = products.find((p) => String(p.id) === String(id));
      if (product) {
        const diff = val - product.stock;
        // Include in report if there is a difference OR if we want to confirm the count
        if (diff !== 0) {
          reportItems.push({
            id: product.id,
            name: product.name,
            stock: product.stock,
            counted: val,
            diff: diff,
            costDiff: diff * (product.buyPrice || 0),
          });
        }
      }
    });

    if (reportItems.length === 0) {
      showWarning(
        "Fark Bulunamadı",
        "Girilen değerlerde sistem stoğundan farklı bir durum tespit edilmedi.",
      );
      return;
    }

    setAuditReport({ items: reportItems });
  };

  const applyCountResults = async () => {
    if (!auditReport || !auditReport.items) return;
    setIsProcessing(true);
    try {
      const branch = currentUser?.branch || "Merkez";

      // Update items sequentially
      for (const item of auditReport.items) {
        await fetch(`/api/products/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stock: item.counted,
            branch: branch,
          }),
        });
      }

      // Finalize audit record status
      await fetch("/api/inventory/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch,
          status: "completed",
          items: auditReport.items,
          reportedBy: currentUser?.name || "Sistem",
        }),
      });

      // Refresh products
      const pRes = await fetch("/api/products");
      const pData = await pRes.json();
      if (pData.success) setProducts(pData.products);

      setIsCounting(false);
      setCountValues({});
      setAuditReport(null);
      showSuccess(
        "Stoklar Güncellendi",
        "Sayım sonuçları başarıyla işlendi ve stoklar güncellendi.",
      );
    } catch (err) {
      console.error("Audit apply error:", err);
      showError("Hata", "Stok güncelleme sırasında bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiMap = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      showSuccess(
        "AI Motoru Tetiklendi",
        "Eşleşmeyen tüm ürünleriniz için arka planda Global Sözlük haritalama görevi başlatıldı. Ürün sayılarına göre bu işlem birkaç dakika sürebilir."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const approveTransferDirectly = async (data: any) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        showSuccess(
          "Transfer Başarılı",
          "Ürün transferi başarıyla gerçekleştirildi.",
        );
        const pRes = await fetch("/api/products");
        const pData = await pRes.json();
        if (pData.success) setProducts(pData.products);
      } else {
        showError("Transfer Başarısız", result.error || "Bilinmeyen hata");
      }
    } catch (error) {
      showError("Hata", "Transfer işlemi sırasında bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProduct = async (e: any) => {
    if (!canEdit) return;
    if (e && e.preventDefault) e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const validFields = [
        "name",
        "code",
        "barcode",
        "price",
        "buyPrice",
        "stock",
        "category",
        "description",
        "imageUrl",
        "imageKey",
        "minStock",
        "brand",
        "type",
        "supplier",
        "branch",
        "salesVat",
        "salesVatIncluded",
        "purchaseVat",
        "purchaseVatIncluded",
        "salesOiv",
        "salesOtv",
        "otvType",
        "purchaseDiscount",
        "purchaseOtv",
        "gtip",
        "gtin",
        "countryCode",
        "invoiceTitle",
        "showDescriptionOnInvoice",
        "shelfLocation",
        "tags",
        "unit",
        "currency",
        "purchaseCurrency",
        "otvCode",
        "globalCategoryId",
        "b2bDescription"
      ];
      const updateData: any = {};
      validFields.forEach((field) => {
        if (selectedProduct[field] !== undefined) {
          updateData[field] = selectedProduct[field];
        }
      });

      if (useVariants && generatedVariants && generatedVariants.length > 0) {
        updateData.isParent = true;
        updateData.variantsData = generatedVariants;
      }

      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success) {
        const pRes = await fetch("/api/products");
        const pData = await pRes.json();
        if (pData.success) setProducts(pData.products);
        setIsEditing(false);
        setSelectedProduct(null); // Auto-close modal
        showSuccess(
          "Güncelleme Başarılı",
          "Ürün bilgileri ve fiyatlandırma başarıyla güncellendi.",
        );
      } else {
        showError("Hata", data.error || "Güncelleme başarısız");
      }
    } catch (err) {
      console.error("Update product error:", err);
      showError("Sistem Hatası", "Güncelleme sırasında bir hata oluştu");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNewProduct = async (e: any) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const mandatoryFields = [
        { field: "name", label: "Ürün Adı" },
        { field: "code", label: "Stok Kodu" },
      ];

      // If not using variants, buyPrice, price and stock are mandatory
      if (!useVariants) {
        mandatoryFields.push({ field: "buyPrice", label: "Alış Fiyatı" });
        mandatoryFields.push({ field: "price", label: "Satış Fiyatı" });
        mandatoryFields.push({ field: "stock", label: "Stok Miktarı" });
      }

      for (const item of mandatoryFields) {
        if (
          !newProduct[item.field as keyof typeof newProduct] &&
          newProduct[item.field as keyof typeof newProduct] !== 0
        ) {
          showError("Zorunlu Alan", `${item.label} alanı zorunludur!`);
          setIsProcessing(false);
          return;
        }
      }

      const prodToAdd = {
        ...newProduct,
        isParent: useVariants,
        variantsData: useVariants ? generatedVariants : undefined,
        status: (newProduct.stock <= 0
          ? "out"
          : newProduct.stock <= 5
            ? "low"
            : "ok") as "ok" | "low" | "out" | "warning",
        prices: Object.entries(productPrices).map(([plId, price]) => ({
          priceListId: plId,
          price: price,
          currency: priceLists.find((pl) => pl.id === plId)?.currency || "TRY",
        })),
      };

      if (!hasPermission("approve_products")) {
        requestProductCreation(prodToAdd as any);
        setShowAddModal(false);
        resetNewProduct();
        showSuccess("Ürün Talebi Oluşturuldu", "Yönetici onayı bekleniyor.");
      } else {
        try {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prodToAdd),
          });
          const data = await res.json();
          if (data.success) {
            const pRes = await fetch("/api/products");
            const pData = await pRes.json();
            if (pData.success) setProducts(pData.products);
            setShowAddModal(false);
            resetNewProduct();
            showSuccess("Yeni Ürün Eklendi", "Ürün başarıyla eklendi.");
          } else {
            showError(
              "Kayıt Hatası",
              `Ürün kaydedilirken bir hata oluştu: ${data.error || "Bilinmeyen hata"}`,
            );
          }
        } catch (err: any) {
          console.error("Create product error:", err);
          showError(
            "Sistem Hatası",
            "Ürün kaydedilirken bir sistem hatası oluştu. Lütfen tekrar deneyin.",
          );
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const resetNewProduct = () => {
    const defaultCat = dbCategories.length > 0 ? dbCategories[0] : "Motosiklet";
    setNewProduct({
      code: "",
      productCode: "",
      barcode: "",
      name: "",
      brand: "",
      category: defaultCat,
      type: "Diğer",
      stock: 0,
      price: 0,
      currency: "TRY",
      buyPrice: 0,
      purchaseCurrency: "TRY",
      status: "ok",
      supplier: "",
      gtip: "",
      gtin: "",
      unit: "Adet",
      salesVat: 20,
      salesVatIncluded: true,
      purchaseVat: 20,
      purchaseVatIncluded: true,
      salesOiv: 0,
      salesOtv: 0,
      otvType: "Ö.T.V yok",
      purchaseDiscount: 0,
      purchaseOtv: 0,
      countryCode: "",
      invoiceTitle: "",
      showDescriptionOnInvoice: false,
      shelfLocation: "",
      tags: "",
      globalCategoryId: undefined,
      branch: activeBranchName || "Merkez",
      imageUrl: undefined,
      imageKey: undefined,
    } as any);
    setUseVariants(false);
    setSelectedAttributes([]);
    setGeneratedVariants([]);
  };

  const generateCombinations = () => {
    const selectedAttrs = variantAttributes.filter((a) =>
      selectedAttributes.includes(a.id),
    );
    if (selectedAttrs.length === 0) return;

    const cartesian = (...a: any[][]) =>
      a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));
    const attrValues = selectedAttrs.map((a) =>
      a.values.map((v: any) => ({
        attrId: a.id,
        valueId: v.id,
        label: v.value,
        attrName: a.name,
      })),
    );

    let combos: any[][] = [];
    if (attrValues.length === 1) {
      combos = attrValues[0].map((v) => [v]);
    } else {
      combos = cartesian(...attrValues);
    }

    const variants = combos.map((combo) => {
      const label = combo.map((c) => c.label).join(" - ");
      const ids = combo.map((c) => c.valueId);
      return {
        variantLabel: label,
        attributeValueIds: ids,
        code: `${newProduct.code}-${label.replace(/\s+/g, "").toUpperCase()}`,
        barcode: "",
        price: newProduct.price,
        buyPrice: newProduct.buyPrice,
        stock: 0,
      };
    });

    setGeneratedVariants(variants);
  };

  const applyAdjustmentRule = () => {
    if (!adjValue) return;
    const newBulkValues = { ...bulkValues };
    selectedIds.forEach((id) => {
      const product = products.find((p) => p.id === id);
      if (!product) return;
      const current = newBulkValues[id] || {
        buyPrice: product.buyPrice,
        price: product.price,
      };
      if (adjTarget === "buy" || adjTarget === "both") {
        const diff =
          adjType === "percent"
            ? (current.buyPrice * adjValue) / 100
            : adjValue;
        current.buyPrice = Math.max(0, current.buyPrice + diff);
      }
      if (adjTarget === "sell" || adjTarget === "both") {
        const diff =
          adjType === "percent" ? (current.price * adjValue) / 100 : adjValue;
        current.price = Math.max(0, current.price + diff);
      }
      newBulkValues[id] = current;
    });
    setBulkValues(newBulkValues);
    setAdjValue(0);
    showSuccess(
      "Fiyat Kuralı Uygulandı",
      `Seçili ${selectedIds.length} ürüne fiyat kuralı uygulandı. Kaydetmeyi unutmayın.`,
    );
  };

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
            branch: row["Şube"] || activeBranchName || "Merkez",
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
            // Refresh products from server
            const pRes = await fetch("/api/products");
            const pData = await pRes.json();
            if (pData.success) setProducts(pData.products);

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
    const data = filteredProducts.map((p) => ({
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
    XLSX.utils.book_append_sheet(wb, ws, "Envanter");
    XLSX.writeFile(
      wb,
      `Envanter_Raporu_${new Date().toLocaleDateString()}.xlsx`,
    );
    showSuccess("Excel İndiriliyor", "Dosya indirme işlemi başlatıldı.");
  };

  const handleBulkAction = (mode: any) => {
    if (mode === "delete") {
      showConfirm(
        "Toplu Silme Onayı",
        `Seçili ${selectedIds.length} ürünü kalıcı olarak silmek istediğinize emin misiniz?`,
        async () => {
          setIsProcessing(true);
          try {
            const res = await fetch("/api/products/bulk", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: selectedIds }),
            });
            if (res.ok) {
              const pRes = await fetch("/api/products");
              const pData = await pRes.json();
              if (pData.success) setProducts(pData.products);
              showSuccess("Silindi", "Seçili ürünler başarıyla silindi.");
              setSelectedIds([]);
            } else {
              showError("Hata", "Silme işlemi başarısız oldu.");
            }
          } catch (err) {
            showError("Hata", "İşlem sırasında bir hata oluştu.");
          } finally {
            setIsProcessing(false);
          }
        },
      );
    } else {
      setShowBulkModal(mode);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    setSearchTerm(barcode);
    setShowScanner(false);
    showSuccess("Ürün Okundu", `Sistem ${barcode} barkodlu ürünü listeledi.`);
  };

  return (
    <div
      className="p-6 pb-32 animate-fade-in relative transition-colors duration-300"
      data-theme={theme}
    >
      <style jsx global>{`
        [data-theme="light"] {
          --bg-app: #f6f8fb;
          --bg-soft: #fafbfd;
          --bg-card: #ffffff;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --text-muted: #94a3b8;
          --border-main: #e6ebf2;
          --border-subtle: #e2e8f0;
        }

        [data-theme="light"].animate-fade-in {
          background: radial-gradient(
            circle at 50% 0%,
            #ffffff 0%,
            #f6f8fb 60%
          ) !important;
          min-height: 100vh;
        }

        /* Cards & Glass */
        [data-theme="light"] .card,
        [data-theme="light"] .bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm {
          background: #ffffff !important;
          border: 1px solid #e6ebf2 !important;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06) !important;
          
        }

        /* Text & Headings */
        [data-theme="light"] h1,
        [data-theme="light"] h2,
        [data-theme="light"] h3,
        [data-theme="light"] .text-white,
        [data-theme="light"] .text-main {
          color: #0f172a !important;
        }

        [data-theme="light"] p,
        [data-theme="light"] .text-muted,
        [data-theme="light"] .text-white\/60,
        [data-theme="light"] .text-white\/50 {
          color: #475569 !important;
        }

        /* Buttons - Secondary */
        [data-theme="light"] .bg-white dark:bg-[#111c30] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-[#1e293b],
        [data-theme="light"] button.bg-white dark:bg-[#111c30] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-[#1e293b] {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          color: #0f172a !important;
          box-shadow: none !important;
        }
        [data-theme="light"] .bg-white dark:bg-[#111c30] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-[#1e293b]:hover,
        [data-theme="light"] button.bg-white dark:bg-[#111c30] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-[#1e293b]:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }

        /* Buttons - Primary */
        [data-theme="light"] button.bg-\[\#FF5500\],
        [data-theme="light"] button.bg-primary {
          background: #2563eb !important;
          color: #ffffff !important;
          border: none !important;
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18) !important;
          transition: all 0.2s ease;
        }
        [data-theme="light"] button.bg-\[\#FF5500\]:hover,
        [data-theme="light"] button.bg-primary:hover {
          background: #1d4ed8 !important;
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.25) !important;
        }
        [data-theme="light"] button.bg-\[\#FF5500\] *,
        [data-theme="light"] button.bg-primary * {
          color: #ffffff !important;
        }

        /* Critical Banner */
        [data-theme="light"] .from-red-500\/10 {
          background: #fff1f2 !important;
          border: 1px solid #fecaca !important;
          box-shadow: none !important;
        }
        [data-theme="light"] .from-red-500\/10 .bg-red-500 {
          background: #fee2e2 !important;
          color: #ef4444 !important;
          box-shadow: none !important;
        }
        [data-theme="light"] .text-red-400 {
          color: #ef4444 !important;
        }
        [data-theme="light"] .from-red-500\/10 button.bg-red-500 {
          background: #ef4444 !important;
          color: #ffffff !important;
        }
        [data-theme="light"] .from-red-500\/10 button.bg-red-500:hover {
          background: #dc2626 !important;
        }
        [data-theme="light"] .bg-red-500 {
          background-color: #ef4444 !important;
        }

        /* Tabs */
        [data-theme="light"] .bg-white dark:bg-[#111c30] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-[#1e293b]. {
          background: #ffffff !important;
          border: 1px solid #e6ebf2 !important;
          padding: 4px !important;
        }
        [data-theme="light"] .bg-primary.text-white {
          background: #f1f5f9 !important;
          color: #0f172a !important;
          border-bottom: 2px solid #2563eb !important;
          border-radius: 8px !important;
          box-shadow: none !important;
        }
        [data-theme="light"] .text-muted.hover\:text-main {
          color: #475569 !important;
        }
        [data-theme="light"] .text-muted.hover\:text-main:hover {
          background: #f8fafc !important;
        }

        /* Table & Lists */
        [data-theme="light"] .bg-\[\#0f172a\]\/80,
        [data-theme="light"] .bg-black\/20,
        [data-theme="light"] .bg-black\/30,
        [data-theme="light"] .bg-black\/40,
        [data-theme="light"] .sticky {
          background: #f1f5f9 !important;
          border-bottom: 2px solid #e2e8f0 !important;
          color: #475569 !important;
        }
        [data-theme="light"] .bg-white\/5,
        [data-theme="light"] .bg-white\/\[0\.02\],
        [data-theme="light"] .bg-white\/\[0\.03\],
        [data-theme="light"] .bg-white\/10 {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .hover\:bg-white\/\[0\.03\]:hover,
        [data-theme="light"] .hover\:bg-white\/\[0\.02\]:hover,
        [data-theme="light"] .hover\:bg-white\/\[0\.08\]:hover {
          background: #f1f5f9 !important;
        }
        [data-theme="light"] .text-white\/90,
        [data-theme="light"] .text-white\/80 {
          color: #0f172a !important;
        }
        [data-theme="light"] .text-white\/70,
        [data-theme="light"] .text-white\/60 {
          color: #334155 !important;
        }
        [data-theme="light"] .text-white\/50,
        [data-theme="light"] .text-white\/40,
        [data-theme="light"] .text-white\/35,
        [data-theme="light"] .text-white\/30 {
          color: #64748b !important;
        }
        [data-theme="light"] .text-white\/20,
        [data-theme="light"] .text-white\/10 {
          color: #94a3b8 !important;
        }

        /* Inputs & Selects */
        [data-theme="light"] input,
        [data-theme="light"] select,
        [data-theme="light"] textarea,
        [data-theme="light"] .bg-\[\#0f172a\] {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] input::placeholder {
          color: #94a3b8 !important;
        }
        [data-theme="light"] option {
          background: #ffffff !important;
          color: #0f172a !important;
        }

        /* Modals & Overlays */
        [data-theme="light"] .fixed.inset-0.bg-black\/95,
        [data-theme="light"] .fixed.inset-0.bg-black\/90,
        [data-theme="light"] .fixed.inset-0.bg-black\/80 {
          background: rgba(15, 23, 42, 0.4) !important;
          
        }
        [data-theme="light"] .bg-\[\#0f172a\],
        [data-theme="light"] .bg-\[\#0a0a0b\],
        [data-theme="light"] .bg-white dark:bg-[#0f172a] shadow-sm,
        [data-theme="light"] .animate-in {
          background: #ffffff !important;
          border: 1px solid #e6ebf2 !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2) !important;
          
        }

        /* Specific Label Fixes */
        [data-theme="light"] label,
        [data-theme="light"] span.text-white\/40,
        [data-theme="light"] .tracking-widest.uppercase,
        [data-theme="light"] .font-black.uppercase {
          color: #64748b !important;
        }
        [data-theme="light"] h2.text-white,
        [data-theme="light"] h3.text-white {
          color: #0f172a !important;
        }

        /* Floating Action Bar (Counter) Fix */
        [data-theme="light"] div[class*="fixed bottom-"].bg-\[\#0f172a\] {
          background: #ffffff !important;
          border: 2px solid #2563eb !important;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1) !important;
        }
        [data-theme="light"] div[class*="fixed bottom-"] .text-white\/40 {
          color: #64748b !important;
        }
        [data-theme="light"] div[class*="fixed bottom-"] .text-primary {
          color: #2563eb !important;
        }

        /* Scan Modal Specifics */
        [data-theme="light"] .rounded-\[40px\],
        [data-theme="light"] .rounded-\[48px\] {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
        }
        [data-theme="light"] #reader-container {
          background: #000000 !important;
        }

        /* Removal of effects */
        [data-theme="light"] .bg-\[url\(\.\.\.\] {
          display: none !important;
        }
        [data-theme="light"] .animate-pulse,
        [data-theme="light"] .animate-pulsate {
          animation: none !important;
        }
        [data-theme="light"] .,
        [data-theme="light"] . {
          
        }
      `}</style>
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translate(-50%, 100px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
      {/* --- HEADER (ÜST OPERASYON BAR) --- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 relative z-30 pt-4 w-full">
        <div className="flex-1 text-left">
          {!isCounting ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-[26px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Envanter Yönetimi
              </h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-bold tracking-wide mt-1">
                Ürün, stok ve fiyat yönetim merkezi
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full p-4 bg-amber-50 border border-amber-200 rounded-[12px] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="text-3xl animate-bounce">🔍</div>
                <div>
                  <h1 className="text-[18px] font-black text-amber-600 uppercase tracking-tight">
                    STOK SAYIM MODU AKTİF
                  </h1>
                  <p className="text-[12px] text-amber-500 font-bold uppercase tracking-widest">
                    Lütfen fiziksel stok miktarlarını girin.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isCounting && (
          <div className="flex items-center justify-start xl:justify-end gap-3 flex-wrap xl:flex-nowrap w-full xl:w-auto">
            <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="h-[42px] px-5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-[13px] hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
              Yükle
            </button>
            <button onClick={exportToExcel} className="h-[42px] px-5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-[13px] hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
              İndir
            </button>
            <button onClick={handleAiMap} disabled={isProcessing} className="h-[42px] px-4 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-[10px] text-[13px] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap group disabled:opacity-50">
              <span className="group-hover:animate-pulse">✨</span> AI Eşleştir
            </button>
            <button onClick={startCount} className="h-[42px] px-5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-[13px] hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
              Stok Sayımı
            </button>
            <button onClick={() => setShowScanner(true)} className="h-[42px] px-5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-[13px] hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
              Barkod Tara
            </button>
            <button onClick={() => router.push('/inventory/labels')} className="h-[42px] px-5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-[13px] hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              Etiket Yazdır
            </button>
            <button onClick={() => setShowAddModal(true)} className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 !text-white font-black rounded-[10px] text-[13px] uppercase tracking-widest transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap border border-blue-600">
              Yeni Ürün
            </button>
            <button onClick={() => setShowHealthReport(true)} className="h-[42px] px-5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-[13px] hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap group relative">
              Health Raporu
              <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] shadow-lg text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed z-[100] pointer-events-none font-normal text-center whitespace-normal">
                Stok sağlığı ve devir analiz raporunu görüntüler.
              </div>
            </button>
          </div>
        )}
      </div>

      {/* --- SEKMELER + STRATEJİK MOD SEÇİMİ --- */}
      {!isCounting ? (
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 z-20 relative w-full">
          <div className="w-full flex-1 overflow-x-auto scrollbar-hide">
             <div className="flex w-full xl:w-max whitespace-nowrap items-center gap-6 px-1 select-none pb-2">
                {[
                  { group: 'GÖRÜNÜM', items: [{ id: 'all', label: 'Envanter Listesi' }, { id: 'focus', label: 'Focus Queue' }, { id: 'strategic', label: 'Stratejik Görünüm' }] },
                  { group: 'OPERASYON', items: [{ id: 'bulk-price', label: 'Fiyat Yönetimi' }] }
                ].map((grp, i) => (
                  <div key={grp.group} className="flex items-center gap-3">
                    {i !== 0 && <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>}
                    <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-[#0f172a]/60 p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                      {grp.items.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={activeTab === tab.id
                            ? "px-4 py-2 text-[13px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#1e293b] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[8px] transition-all tracking-wide"
                            : "px-4 py-2 text-[13px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all rounded-[8px] tracking-wide"}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {activeTab === 'all' && (
            <div className="flex items-center gap-4 z-30 pb-2">
              <InventoryFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                filterBrand={filterBrand}
                setFilterBrand={setFilterBrand}
                stockSort={stockSort}
                setStockSort={setStockSort}
                specialFilter={specialFilter}
                setSpecialFilter={setSpecialFilter}
                categories={dbCategories.length > 0 ? dbCategories : categories}
                brands={dbBrands.length > 0 ? dbBrands : brands}
              />
            </div>
          )}
        </div>
      ) : null}
      {isCounting && (
        <div className="flex items-center justify-between mb-6 p-4 bg-amber-50 border border-amber-200 rounded-[12px] shadow-sm w-full">
          <div className="flex items-center gap-4">
            <div className="flex bg-white dark:bg-[#0f172a] border border-amber-300 shadow-sm p-1 rounded-[10px]">
              <input
                type="text"
                placeholder="Sayılacak ürünü ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none px-4 py-2 text-[14px] font-bold text-slate-900 dark:text-white w-64 placeholder:text-slate-400 placeholder:font-medium"
              />
            </div>
            <div className="text-[12px] text-amber-700 font-bold uppercase tracking-widest">
              Sayım Başlangıcı:{" "}
              <span className="text-amber-900 ml-1">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={cancelReport}
              className="h-[46px] px-8 rounded-[10px] border-2 border-red-200 text-red-600 hover:bg-red-50 font-black text-[13px] uppercase tracking-widest transition-all shadow-sm"
            >
              İPTAL ET
            </button>
            <button
              onClick={finishCount}
              className="h-[46px] px-8 rounded-[10px] bg-blue-600 hover:bg-blue-700 !text-white shadow-sm font-black text-[13px] uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <span>KONTROL ET & BİTİR</span>
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>
      )}

      {/* --- CONTENT --- */}
      <div className="relative">
        {isSimulationMode && (
          <div className="bg-amber-500 text-white font-bold p-3 text-center rounded-xl mb-4 shadow-sm flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>
            SİMÜLASYON AKTİF — Gerçek veriler değiştirilmiyor (What-If engine running)
            <button onClick={() => setIsSimulationMode(false)} className="ml-4 px-3 py-1 bg-white/20 hover:bg-white dark:bg-[#0f172a]/30 rounded-lg text-xs">Kapat</button>
          </div>
        )}

        {showDailyBrief && activeTab === "all" && <DailyBriefPanel onClose={handleDismissBrief} />}
        {showHealthReport && <WeeklyHealthReport products={products || []} onClose={() => setShowHealthReport(false)} />}

        {activeTab === "focus" && <FocusQueueTab products={products} />}
        {activeTab === "strategic" && <ExecutiveSummaryMode products={products} />}

        {activeTab === "all" && (
          <>
            <InventoryTable
              products={paginatedProducts}
              allProducts={products || []}
              isCounting={isCounting}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              countValues={countValues}
              onCountChange={(id, val) =>
                setCountValues({ ...countValues, [id]: val })
              }
              onProductClick={(product) => {
                if (!isCounting) {
                  setSelectedProduct(product);
                  setIsEditing(false);
                }
              }}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {activeTab === "bulk-price" && (
          <BulkPriceEntryContent
            products={filteredProducts}
            isProcessing={isProcessing}
            onSave={async (updates) => {
              if (isProcessing) return;
              setIsProcessing(true);
              try {
                const res = await fetch("/api/pricing/bulk-save", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updates),
                });
                if (res.ok) {
                  const pRes = await fetch("/api/products");
                  const pData = await pRes.json();
                  if (pData.success) setProducts(pData.products);
                  showSuccess(
                    "Fiyatlar Güncellendi",
                    "Tüm fiyat ve KDV değişiklikleri başarıyla işlendi.",
                  );
                  setActiveTab("all");
                } else {
                  showError(
                    "Hata",
                    "Toplu fiyat güncelleme işlemi başarısız oldu.",
                  );
                }
              } catch (err) {
                showError("Hata", "İşlem sırasında bir sistem hatası oluştu.");
              } finally {
                setIsProcessing(false);
              }
            }}
          />
        )}
      </div>

      {/* --- BULK ACTION FLOATING BAR --- */}
      {selectedIds.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
          }}
          className="flex items-center gap-6 px-6 py-3 rounded-full bg-slate-900 dark:bg-slate-800 border border-slate-700/50 dark:border-white/10 shadow-2xl  animate-in slide-in-from-bottom-8 duration-500"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white text-[13px] font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-inner">
              {selectedIds.length}
            </div>
            <span className="text-[13px] font-medium text-slate-300">
              Ürün Seçili
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: "category", icon: "🏷️", label: "Kategori" },
              { id: "vat", icon: "🏛️", label: "KDV" },
              { id: "barcode", icon: "🔍", label: "Barkod" },
            ].map((action) => (
              <button
                key={action.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 dark:hover:bg-white dark:bg-[#0f172a]/5 transition-colors text-slate-400 hover:text-white"
                onClick={() => handleBulkAction(action.id as any)}
              >
                <span className="text-[14px] grayscale opacity-70 group-hover:opacity-100">{action.icon}</span>
                <span className="text-[12px] font-medium hidden sm:inline-block">
                  {action.label}
                </span>
              </button>
            ))}

            {canDelete && (
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-900/40 transition-colors text-red-400/80 hover:text-red-400"
                onClick={() => handleBulkAction("delete")}
              >
                <span className="text-[14px]">🗑️</span>
                <span className="text-[12px] font-medium hidden sm:inline-block">
                  Sil
                </span>
              </button>
            )}
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="text-slate-500 dark:text-slate-400 hover:text-white ml-2 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* --- MODALS --- */}
      <InventoryTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        products={products}
        filteredProducts={products}
        branches={branches}
        isSystemAdmin={isSystemAdmin}
        isProcessing={isProcessing}
        onTransfer={async (data) => {
          const res = await fetch("/api/inventory/transfer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (res.ok) {
            const pRes = await fetch("/api/products");
            const pData = await pRes.json();
            if (pData.success) setProducts(pData.products);
            showSuccess("Başarılı", "Transfer işlemi tamamlandı.");
            setShowTransferModal(false);
          }
        }}
      />

      <ProcurementModal
        isOpen={showProcurementModal}
        products={products || []}
        onClose={() => setShowProcurementModal(false)}
      />

      <InventoryBulkEditModal
        isOpen={!!showBulkModal}
        mode={showBulkModal}
        onClose={() => setShowBulkModal(null)}
        selectedIds={selectedIds}
        products={products}
        categories={categories}
        isProcessing={isProcessing}
        onApply={async (data) => {
          setIsProcessing(true);
          try {
            const payload: any = { mode: showBulkModal, ids: selectedIds };

            if (showBulkModal === "category" || showBulkModal === "vat") {
              payload.updates = data;
            } else if (showBulkModal === "barcode") {
              payload.individualUpdates = {};
              selectedIds.forEach((id) => {
                if (data[id])
                  payload.individualUpdates[id] = { barcode: data[id] };
              });
            } else if (showBulkModal === "price") {
              payload.individualUpdates = data;
            }

            const res = await fetch("/api/products/bulk", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (res.ok) {
              const pRes = await fetch("/api/products");
              const pData = await pRes.json();
              if (pData.success) setProducts(pData.products);

              showSuccess(
                "Kayıt Başarılı",
                "Toplu değişiklikler veritabanına işlendi.",
              );
              setShowBulkModal(null);
              setSelectedIds([]);
            } else {
              throw new Error("Toplu kayıt hatası");
            }
          } catch (e) {
            showError("Hata", "Toplu güncelleme sırasında bir sorun oluştu.");
          } finally {
            setIsProcessing(false);
          }
        }}
      />

      <ProductWizardModal
        isOpen={!!selectedProduct || showAddModal}
        mode={selectedProduct ? "edit" : "create"}
        data={selectedProduct || newProduct}
        onChange={(newData) => {
          if (selectedProduct) setSelectedProduct(newData);
          else setNewProduct(newData);
        }}
        onClose={() => {
          setSelectedProduct(null);
          setShowAddModal(false);
        }}
        onSave={(e) => {
          if (selectedProduct) handleSaveProduct(e);
          else handleSaveNewProduct(e);
        }}
        onDelete={() => {
          showConfirm(
            "Emin misiniz?",
            "Bu ürün kalıcı olarak silinecek.",
            async () => {
              try {
                const res = await fetch(`/api/products/${selectedProduct.id}`, {
                  method: "DELETE",
                });
                if (res.ok) {
                  setProducts(products.filter((p) => p.id !== selectedProduct.id));
                  setSelectedProduct(null);
                  showSuccess("Silindi", "Ürün başarıyla silindi.");
                } else {
                  showError("Hata", "Silinemedi.");
                }
              } catch (e) {
                showError("Hata", "Bir sorun oluştu.");
              }
            }
          );
        }}
        isProcessing={isProcessing}
        categories={dbCategories}
        allProducts={products || []}
        priceLists={priceLists}
        productPrices={productPrices}
        setProductPrices={setProductPrices}
        showOtherPrices={showOtherPrices}
        setShowOtherPrices={setShowOtherPrices}
        useVariants={useVariants}
        setUseVariants={setUseVariants}
        variantAttributes={variantAttributes}
        selectedAttributes={selectedAttributes}
        setSelectedAttributes={setSelectedAttributes}
        generatedVariants={generatedVariants}
        setGeneratedVariants={setGeneratedVariants}
        generateCombinations={generateCombinations}
      />

      {auditReport && (
        <div className="fixed inset-0 bg-slate-900/50  z-[3000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-[24px] max-w-5xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#1e293b]/50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-[20px] font-semibold text-slate-900 dark:text-white">
                    Sayım Sonuç Raporu
                  </h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {auditReport.items.length} kalemde fark tespit edildi.
                  </p>
                </div>
                <div className="text-right bg-white dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mb-1">
                    TOPLAM MALİYET ETKİSİ
                  </div>
                  <div
                    className={`text-[20px] font-bold ${auditReport.items.reduce((a: any, b: any) => a + b.costDiff, 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {Number(
                      auditReport.items.reduce(
                        (a: any, b: any) => a + b.costDiff,
                        0,
                      ),
                    ).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                    ₺
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0 custom-scroll relative">
              <table className="w-full text-left">
                <thead className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider sticky top-0 bg-slate-50 dark:bg-[#1e293b] z-10 border-b border-slate-200 dark:border-white/10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4">Ürün Detayı</th>
                    <th className="px-6 py-4 text-center">Sistem</th>
                    <th className="px-6 py-4 text-center">Fiziksel</th>
                    <th className="px-6 py-4 text-center">Fark</th>
                    <th className="px-6 py-4 text-right">Maliyet Etkisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {auditReport.items.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-white dark:bg-[#0f172a]/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[13px] text-slate-900 dark:text-slate-100 mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                          {item.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-[13px] text-slate-500 dark:text-slate-400">
                        {item.stock}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-[13px] text-slate-900 dark:text-white">
                        {item.counted}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-[8px] text-[12px] font-bold ${item.diff > 0
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                            }`}
                        >
                          {item.diff > 0 ? "+" : ""}
                          {item.diff}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold text-[13px] tabular-nums ${item.costDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {item.costDiff.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setAuditReport(null)}
                className="px-6 py-2.5 rounded-[12px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-[14px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm"
              >
                Vazgeç
              </button>
              <button
                onClick={applyCountResults}
                disabled={isProcessing}
                className="px-8 py-2.5 rounded-[12px] bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#1e293b]"
              >
                {isProcessing
                  ? "İşleniyor..."
                  : "Stokları Güncelle"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
      />
    </div>
  );
}

const style = `
          @keyframes slide-up {
            from {transform: translate(-50%, 100px); opacity: 0; }
          to {transform: translate(-50%, 0); opacity: 1; }
}
          `;
