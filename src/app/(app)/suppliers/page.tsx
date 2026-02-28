"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useCRM } from "@/contexts/CRMContext";
import { useModal } from "@/contexts/ModalContext";
import SupplierPurchaseModal from "@/components/modals/SupplierPurchaseModal";
import { formatCurrency } from "@/lib/utils";
import Pagination from "@/components/Pagination";
import { TURKISH_CITIES, TURKISH_DISTRICTS } from "@/lib/constants";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search,
  Filter,
  Grid,
  List,
  Plus,
  Percent,
  Users,
  DollarSign,
  Wallet,
  ShoppingCart,
  Trash2,
  ChevronRight,
  Pencil,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function SuppliersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, branches, hasPermission, activeBranchName } = useApp();
  const { suppliers, suppClasses: dbSuppClasses } = useCRM();
  const { showSuccess, showError, showWarning, showConfirm } = useModal();
  const { theme } = useTheme();

  const isLight = theme === "light";
  const canDelete = hasPermission("delete_records");

  // UI States
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [branchFilter, setBranchFilter] = useState(activeBranchName || "all");

  useEffect(() => {
    if (activeBranchName) {
      setBranchFilter(activeBranchName);
      setNewSupplier((prev) => ({ ...prev, branch: activeBranchName }));
      setCurrentPage(1);
    }
  }, [activeBranchName]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "İstanbul",
    district: "",
    category: "",
    taxNumber: "",
    taxOffice: "",
    contactPerson: "",
    iban: "",
    branch: activeBranchName || currentUser?.branch || "Merkez",
  });

  const [editSupplier, setEditSupplier] = useState<any>({
    id: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    category: "",
    taxNumber: "",
    taxOffice: "",
    contactPerson: "",
    iban: "",
    branch: "",
  });

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedSup, setSelectedSup] = useState<any>(null);

  // --- FILTER LOGIC ---
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setCurrentPage(1);
  };

  const filteredSuppliers = suppliers.filter((sup) => {
    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      const match =
        (sup.name || "").toLowerCase().includes(low) ||
        (sup.phone || "").includes(searchTerm) ||
        (sup.city || "").toLowerCase().includes(low) ||
        (sup.category || "").toLowerCase().includes(low);
      if (!match) return false;
    }
    if (activeTab === "debt" && sup.balance >= 0) return false;
    if (activeTab === "credit" && sup.balance <= 0) return false;
    if (activeTab === "passive" && sup.isActive !== false) return false;
    if (branchFilter !== "all" && (sup.branch || "Merkez") !== branchFilter)
      return false;
    return true;
  });

  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Stats
  const totalDebt = suppliers
    .filter((s) => s.balance < 0)
    .reduce((acc, s) => acc + Math.abs(s.balance), 0);
  const totalCredit = suppliers
    .filter((s) => s.balance > 0)
    .reduce((acc, s) => acc + s.balance, 0);

  const handleAddSupplier = async () => {
    if (!newSupplier.name) {
      showWarning("Hata", "Firma adı zorunludur!");
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSupplier),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("Başarılı", "Tedarikçi başarıyla oluşturuldu.");
        setIsModalOpen(false);
        setNewSupplier({
          name: "",
          phone: "",
          email: "",
          address: "",
          city: "İstanbul",
          district: "",
          category: "",
          taxNumber: "",
          taxOffice: "",
          contactPerson: "",
          iban: "",
          branch: activeBranchName || currentUser?.branch || "Merkez",
        });
        window.location.reload();
      } else {
        showError("Hata", data.error || "Beklenmedik bir hata oluştu.");
      }
    } catch (e: any) {
      showError("Hata", "Bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditSupplier = async () => {
    if (!editSupplier.name) {
      showWarning("Hata", "Firma adı zorunludur!");
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/suppliers/${editSupplier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSupplier),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("Başarılı", "Tedarikçi başarıyla güncellendi.");
        setIsEditModalOpen(false);
        setEditSupplier({
          id: "", name: "", phone: "", email: "", address: "", city: "", district: "", category: "", taxNumber: "", taxOffice: "", contactPerson: "", iban: "", branch: ""
        });
        window.location.reload();
      } else {
        showError("Hata", data.error || "Beklenmedik bir hata oluştu.");
      }
    } catch (e: any) {
      showError("Hata", "Bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSupplier = async (supplier: any) => {
    if (!canDelete) return;
    showConfirm(
      "Tedarikçiyi Sil",
      `"${supplier.name}" tedarikçisini silmek istediğinizden emin misiniz?`,
      async () => {
        try {
          const res = await fetch(`/api/suppliers?id=${supplier.id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            showSuccess("Başarılı", "Tedarikçi silindi.");
            window.location.reload();
          } else showError("Hata", data.error || "Silme başarısız.");
        } catch {
          showError("Hata", "Bir hata oluştu.");
        }
      },
    );
  };

  const tabs = [
    { id: "all", label: "Tümü" },
    { id: "debt", label: "Borçlular" },
    { id: "credit", label: "Alacaklılar" },
    { id: "passive", label: "Pasifler" },
  ];

  // Colors and Themes
  const cardClass = isLight
    ? "bg-white border border-slate-200 shadow-sm"
    : "bg-slate-900 border border-slate-800";
  const modalClass = isLight
    ? "bg-white border border-slate-200 shadow-2xl"
    : "bg-slate-900 border border-slate-800 shadow-2xl";

  const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
  const textValueClass = isLight ? "text-slate-900" : "text-white";

  const inputClass = isLight
    ? "w-full h-[44px] px-3 rounded-[10px] text-[13px] font-medium border border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
    : "w-full h-[44px] px-3 rounded-[10px] text-[13px] font-medium border border-slate-800 bg-slate-900/50 text-slate-200 focus:border-blue-500 outline-none transition-all";

  const getBalColor = (bal: number) => {
    if (bal < 0) return isLight ? "text-red-600" : "text-red-500";
    if (bal > 0) return isLight ? "text-emerald-600" : "text-emerald-500";
    return isLight ? "text-slate-500" : "text-slate-400";
  };

  return (
    <div
      data-pos-theme={theme}
      className={`w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans ${isLight ? "bg-[#FAFAFA]" : ""}`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className={`text-[24px] font-semibold tracking-tight ${textValueClass}`}>
            Tedarikçi Kontrol Konsolu
          </h1>
          <p className={`text-[13px] mt-1 font-medium ${textLabelClass}`}>
            Toptancı listesi, bakiyeler ve satın alma işlemleri
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className={`h-[40px] px-5 flex items-center gap-2 rounded-[12px] font-medium text-[13px] transition-all shadow-sm ${isLight
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
          >
            <Plus className="w-4 h-4" />
            Yeni Tedarikçi
          </button>
        </div>
      </div>

      {/* KPI Banner */}
      <div className={`flex rounded-[14px] border overflow-hidden ${cardClass}`}>
        <div className={`flex-1 p-5 border-r ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Users className={`w-4 h-4 ${isLight ? "text-blue-500" : "text-blue-400"}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>
              Toplam Tedarikçi
            </span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight ${textValueClass}`}>
            {suppliers.length}
          </div>
          <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Aktif Tedarikçi</div>
        </div>
        <div className={`flex-1 p-5 border-r ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-4 h-4 ${isLight ? "text-red-500" : "text-red-400"}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>
              Toplam Borcumuz
            </span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight ${isLight ? "text-red-600" : "text-red-500"}`}>
            {formatCurrency(totalDebt)}
          </div>
          <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Tedarikçilere Olan Bakiye</div>
        </div>
        <div className={`flex-1 p-5 border-r ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className={`w-4 h-4 ${isLight ? "text-emerald-500" : "text-emerald-400"}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>
              Toplam Alacağımız
            </span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight ${isLight ? "text-emerald-600" : "text-emerald-500"}`}>
            {formatCurrency(totalCredit)}
          </div>
          <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Avans / Alacak Bakiyesi</div>
        </div>
        <div className="flex-1 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Percent className={`w-4 h-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>
              Net Durum
            </span>
          </div>
          <div className={`text-[28px] font-semibold tracking-tight ${textValueClass}`}>
            {formatCurrency(totalCredit - totalDebt)}
          </div>
          <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Genel Tedarikçi Durumu</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-[600px]">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tedarikçi adı, kategori veya telefon ile ara..."
              className={`w-full h-[40px] pl-[38px] pr-4 rounded-[10px] text-[13px] font-medium border outline-none transition-all ${isLight
                  ? "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  : "bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 focus:border-blue-500"
                }`}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-[40px] px-4 rounded-[10px] text-[13px] font-semibold border flex items-center gap-2 transition-all ${showFilters
                  ? isLight
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-blue-900/20 border-blue-800/50 text-blue-400"
                  : isLight
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                }`}
            >
              <Filter className="w-4 h-4" />
              Filtreler
            </button>
            <div className={`flex p-1 rounded-[10px] border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-800"}`}>
              <button
                onClick={() => setViewMode("grid")}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-colors ${viewMode === "grid"
                    ? isLight
                      ? "bg-white shadow-sm text-blue-600"
                      : "bg-slate-800 text-blue-400"
                    : isLight
                      ? "text-slate-400 hover:text-slate-600"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-colors ${viewMode === "list"
                    ? isLight
                      ? "bg-white shadow-sm text-blue-600"
                      : "bg-slate-800 text-blue-400"
                    : isLight
                      ? "text-slate-400 hover:text-slate-600"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Collapse */}
        {showFilters && (
          <div className={`p-5 rounded-[12px] border flex flex-wrap gap-8 animate-in slide-in-from-top-2 overflow-hidden ${cardClass}`}>
            <div>
              <div className={`text-[11px] font-semibold uppercase tracking-wide mb-3 ${textLabelClass}`}>
                Görünüm
              </div>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`h-[32px] px-4 rounded-[10px] text-[12px] font-medium border transition-colors ${isActive
                          ? isLight
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-blue-900/20 border-blue-800/50 text-blue-400"
                          : isLight
                            ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                        }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 min-w-[200px] max-w-[300px]">
              <div className={`text-[11px] font-semibold uppercase tracking-wide mb-3 ${textLabelClass}`}>
                Şube
              </div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                disabled={!hasPermission("branch_administration")}
                className={`w-full h-[36px] px-3 rounded-[10px] text-[13px] font-medium border outline-none ${isLight ? "bg-white border-slate-200 text-slate-700" : "bg-slate-900 border-slate-800 text-slate-300"
                  }`}
              >
                {hasPermission("branch_administration") && (
                  <option value="all">Tüm Şubeler</option>
                )}
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* DATA DISPLAY */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedSuppliers.map((sup) => {
            const balColor = getBalColor(sup.balance);
            return (
              <div
                key={sup.id}
                className={`rounded-[14px] p-5 flex flex-col gap-4 border transition-all ${cardClass} hover:shadow-md ${isLight ? 'hover:border-blue-200' : 'hover:border-blue-800'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-[15px] font-bold shrink-0 ${isLight ? "bg-blue-50 text-blue-600" : "bg-blue-900/30 text-blue-400"
                        }`}
                    >
                      {sup.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className={`text-[15px] font-semibold truncate ${textValueClass}`}>
                        {sup.name}
                      </h3>
                      <p className={`text-[12px] truncate ${textLabelClass}`}>
                        {sup.category || "Genel Tedarikçi"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-[10px] border border-slate-100 dark:border-slate-800/50">
                    <span className={`text-[12px] font-medium ${textLabelClass}`}>Bakiye</span>
                    <div className="text-right">
                      <div className={`text-[15px] font-semibold ${balColor}`}>
                        {formatCurrency(Math.abs(sup.balance))}
                      </div>
                      <div className={`text-[10px] font-semibold uppercase tracking-wide ${balColor}`}>
                        {sup.balance < 0 ? "Borçluyuz" : sup.balance > 0 ? "Alacaklıyız" : "Dengeli"}
                      </div>
                    </div>
                  </div>
                  {(sup.city || sup.phone) && (
                    <div className="flex items-center justify-between px-1">
                      {sup.city && (
                        <span className={`text-[12px] ${textLabelClass}`}>📍 {sup.city}</span>
                      )}
                      {sup.phone && (
                        <span className={`text-[12px] ${textLabelClass}`}>📱 {sup.phone}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <Link
                    href={`/suppliers/${sup.id}`}
                    className={`flex-1 h-[36px] flex items-center justify-center gap-2 rounded-[8px] text-[13px] font-medium border transition-colors ${isLight
                        ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                  >
                    Detay
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedSup(sup);
                      setIsPurchaseModalOpen(true);
                    }}
                    className={`h-[36px] px-3 rounded-[8px] border flex items-center justify-center transition-colors ${isLight
                        ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                        : "bg-blue-900/20 border-blue-800/50 text-blue-400 hover:bg-blue-900/40"
                      }`}
                    title="Alım Yap"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditSupplier({ ...sup });
                      setIsEditModalOpen(true);
                    }}
                    className={`h-[36px] px-3 rounded-[8px] border flex items-center justify-center transition-colors ${isLight
                        ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                      }`}
                    title="Düzenle"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteSupplier(sup)}
                      className={`h-[36px] px-3 rounded-[8px] border flex items-center justify-center transition-colors ${isLight
                          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          : "bg-red-900/20 border-red-800/50 text-red-400 hover:bg-red-900/40"
                        }`}
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`rounded-[14px] border overflow-hidden ${cardClass}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={isLight ? "bg-slate-50 border-b border-slate-200" : "bg-slate-900 border-b border-slate-800"}>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Tedarikçi</th>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>İletişim</th>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Kategori</th>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide text-right ${textLabelClass}`}>Bakiye</th>
                  <th className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-wide text-right ${textLabelClass}`}>İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedSuppliers.map((sup) => {
                  const balColor = getBalColor(sup.balance);
                  return (
                    <tr key={sup.id} className={`transition-colors ${isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/50"}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] font-bold ${isLight ? "bg-blue-50 text-blue-600" : "bg-blue-900/30 text-blue-400"
                            }`}>
                            {sup.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={`text-[14px] font-semibold ${textValueClass}`}>{sup.name}</div>
                            {sup.isActive === false && (
                              <span className={`text-[10px] font-semibold uppercase text-red-500`}>Pasif</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`text-[13px] ${textValueClass}`}>{sup.phone || '-'}</div>
                        <div className={`text-[12px] ${textLabelClass}`}>{sup.city || '-'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-[6px] text-[11px] font-medium ${isLight ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-300"
                          }`}>
                          {sup.category || "Genel"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className={`text-[14px] font-semibold ${balColor}`}>
                          {formatCurrency(Math.abs(sup.balance))}
                        </div>
                        <div className={`text-[10px] font-semibold uppercase tracking-wide ${balColor}`}>
                          {sup.balance < 0 ? "Borçluyuz" : sup.balance > 0 ? "Alacaklıyız" : "Dengeli"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSup(sup);
                              setIsPurchaseModalOpen(true);
                            }}
                            className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors ${isLight ? "text-slate-400 hover:text-blue-600 hover:bg-blue-50" : "text-slate-500 hover:text-blue-400 hover:bg-blue-900/20"
                              }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/suppliers/${sup.id}`}
                            className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors ${isLight ? "text-slate-400 hover:text-blue-600 hover:bg-blue-50" : "text-slate-500 hover:text-blue-400 hover:bg-blue-900/20"
                              }`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {paginatedSuppliers.length === 0 && (
        <div className={`flex flex-col items-center justify-center py-20 rounded-[14px] border border-dashed ${isLight ? "border-slate-300 bg-white" : "border-slate-800 bg-slate-900/50"}`}>
          <Search className={`w-12 h-12 mb-4 opacity-20 ${isLight ? "text-slate-900" : "text-white"}`} />
          <h3 className={`text-[16px] font-semibold ${textValueClass}`}>Kayıt Bulunamadı</h3>
          <p className={`text-[13px] mt-1 ${textLabelClass}`}>Arama kriterlerinize veya seçilen filtrelere uygun tedarikçi bulunmuyor.</p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* PURCHASE MODAL */}
      {selectedSup && (
        <SupplierPurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          supplierId={selectedSup.id}
          supplierName={selectedSup.name}
        />
      )}

      {/* ADD/EDIT MODAL FORMS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className={`w-[600px] max-w-full rounded-[16px] overflow-hidden flex flex-col max-h-[90vh] ${modalClass} animate-in zoom-in-95 duration-200`}>
            <div className={`flex justify-between items-center px-6 py-4 border-b ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <h2 className={`text-[16px] font-semibold ${textValueClass}`}>Yeni Tedarikçi Ekle</h2>
              <button onClick={() => setIsModalOpen(false)} className={`text-2xl leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
            </div>
            <div className="p-6 overflow-y-auto custom-scroll flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Firma Adı <span className="text-red-500">*</span></label>
                  <input type="text" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} className={inputClass} placeholder="Örn: X Bilişim A.Ş." />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Yetkili Kişi</label>
                  <input type="text" value={newSupplier.contactPerson} onChange={e => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })} className={inputClass} placeholder="Örn: Ahmet Bey" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Sınıf / Kategori</label>
                  <select value={newSupplier.category} onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })} className={inputClass}>
                    <option value="">Seçiniz...</option>
                    {dbSuppClasses.length > 0 ? dbSuppClasses.map(c => <option key={c} value={c}>{c}</option>) : ["Saha Tedarikçisi", "Distribütör", "Yedek Parça", "Hizmet"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Şube</label>
                  <select value={newSupplier.branch} onChange={e => setNewSupplier({ ...newSupplier, branch: e.target.value })} className={inputClass}>
                    {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Telefon</label>
                  <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>E-Posta</label>
                  <input type="email" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi No</label>
                  <input type="text" value={newSupplier.taxNumber} onChange={e => setNewSupplier({ ...newSupplier, taxNumber: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi Dairesi</label>
                  <input type="text" value={newSupplier.taxOffice} onChange={e => setNewSupplier({ ...newSupplier, taxOffice: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>IBAN</label>
                <input type="text" value={newSupplier.iban} onChange={e => setNewSupplier({ ...newSupplier, iban: e.target.value })} className={inputClass} placeholder="TR..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Şehir</label>
                  <select value={newSupplier.city} onChange={e => setNewSupplier({ ...newSupplier, city: e.target.value, district: '' })} className={inputClass}>
                    <option value="">Seçiniz...</option>
                    {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İlçe</label>
                  <select value={newSupplier.district} onChange={e => setNewSupplier({ ...newSupplier, district: e.target.value })} className={inputClass} disabled={!newSupplier.city}>
                    <option value="">Seçiniz...</option>
                    {(TURKISH_DISTRICTS[newSupplier.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Açık Adres</label>
                <textarea value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} className={`${inputClass} min-h-[80px] py-3 resize-none`} />
              </div>
            </div>
            <div className={`p-6 bg-slate-50 dark:bg-slate-900 border-t ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <button onClick={handleAddSupplier} disabled={isProcessing} className={`w-full h-[44px] rounded-[10px] text-[14px] font-semibold text-white transition-all ${isLight ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-500"} ${isProcessing ? 'opacity-50' : ''}`}>
                {isProcessing ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className={`w-[600px] max-w-full rounded-[16px] overflow-hidden flex flex-col max-h-[90vh] ${modalClass} animate-in zoom-in-95 duration-200`}>
            <div className={`flex justify-between items-center px-6 py-4 border-b ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <h2 className={`text-[16px] font-semibold ${textValueClass}`}>Tedarikçi Düzenle</h2>
              <button onClick={() => setIsEditModalOpen(false)} className={`text-2xl leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
            </div>
            <div className="p-6 overflow-y-auto custom-scroll flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Firma Adı <span className="text-red-500">*</span></label>
                  <input type="text" value={editSupplier.name} onChange={e => setEditSupplier({ ...editSupplier, name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Yetkili Kişi</label>
                  <input type="text" value={editSupplier.contactPerson} onChange={e => setEditSupplier({ ...editSupplier, contactPerson: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Sınıf / Kategori</label>
                  <select value={editSupplier.category} onChange={e => setEditSupplier({ ...editSupplier, category: e.target.value })} className={inputClass}>
                    <option value="">Seçiniz...</option>
                    {dbSuppClasses.length > 0 ? dbSuppClasses.map(c => <option key={c} value={c}>{c}</option>) : ["Saha Tedarikçisi", "Distribütör", "Yedek Parça", "Hizmet"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Şube</label>
                  <select value={editSupplier.branch} onChange={e => setEditSupplier({ ...editSupplier, branch: e.target.value })} className={inputClass} disabled>
                    {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Telefon</label>
                  <input type="text" value={editSupplier.phone} onChange={e => setEditSupplier({ ...editSupplier, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>E-Posta</label>
                  <input type="email" value={editSupplier.email} onChange={e => setEditSupplier({ ...editSupplier, email: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi No</label>
                  <input type="text" value={editSupplier.taxNumber} onChange={e => setEditSupplier({ ...editSupplier, taxNumber: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi Dairesi</label>
                  <input type="text" value={editSupplier.taxOffice} onChange={e => setEditSupplier({ ...editSupplier, taxOffice: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>IBAN</label>
                <input type="text" value={editSupplier.iban} onChange={e => setEditSupplier({ ...editSupplier, iban: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Şehir</label>
                  <select value={editSupplier.city} onChange={e => setEditSupplier({ ...editSupplier, city: e.target.value, district: '' })} className={inputClass}>
                    <option value="">Seçiniz...</option>
                    {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İlçe</label>
                  <select value={editSupplier.district} onChange={e => setEditSupplier({ ...editSupplier, district: e.target.value })} className={inputClass} disabled={!editSupplier.city}>
                    <option value="">Seçiniz...</option>
                    {(TURKISH_DISTRICTS[editSupplier.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Açık Adres</label>
                <textarea value={editSupplier.address} onChange={e => setEditSupplier({ ...editSupplier, address: e.target.value })} className={`${inputClass} min-h-[80px] py-3 resize-none`} />
              </div>
            </div>
            <div className={`p-6 bg-slate-50 dark:bg-slate-900 border-t ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <button onClick={handleEditSupplier} disabled={isProcessing} className={`w-full h-[44px] rounded-[10px] text-[14px] font-semibold text-white transition-all ${isLight ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-500"} ${isProcessing ? 'opacity-50' : ''}`}>
                {isProcessing ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
