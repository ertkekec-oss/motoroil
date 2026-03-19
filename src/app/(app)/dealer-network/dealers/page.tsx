"use client";

import React, { useState, useEffect } from "react";
import { EnterpriseCard, EnterpriseTable } from "@/components/ui/enterprise";
import { X, Search, Trash2, Eye, CreditCard, UserPlus, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DealersPage() {
    const router = useRouter();
    const [dealers, setDealers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteType, setInviteType] = useState<"email" | "customer">("customer");
    const [inviteEmail, setInviteEmail] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [customers, setCustomers] = useState<any[]>([]);
    const [isInviting, setIsInviting] = useState(false);
    const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

    // Credit Limit Drawer State
    const [selectedDealer, setSelectedDealer] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [newCreditLimit, setNewCreditLimit] = useState("");

    const fetchDealers = () => {
        fetch("/api/dealer-network/dealers")
            .then(res => res.json())
            .then(data => {
                if (data.data) setDealers(data.data);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchDealers();

        fetch("/api/customers?limit=100") // Fetch enough customers for the dropdown
            .then(res => res.json())
            .then(data => {
                if (data.customers) setCustomers(data.customers);
                else if (data.data) setCustomers(data.data);
                else if (Array.isArray(data)) setCustomers(data);
            })
            .catch(err => console.error(err));
    }, []);

    const handleInvite = async () => {
        if (inviteType === 'email' && !inviteEmail) {
            toast.error('Lütfen e-posta adresi girin.');
            return;
        }
        if (inviteType === 'customer' && !selectedCustomerId) {
            toast.error('Lütfen bir cari seçin.');
            return;
        }

        setIsInviting(true);
        try {
            const res = await fetch("/api/dealer-network/dealers/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inviteType === 'email' ? { email: inviteEmail } : { customerId: selectedCustomerId })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Davetiye gönderilemedi.");
            }
            setIsInviteModalOpen(false);
            setInviteEmail("");
            setSelectedCustomerId("");
            toast.success("Davetiye başarıyla gönderildi.");
            fetchDealers();
        } catch (error: any) {
            toast.error(error.message || "Davetiye gönderilemedi.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/dealer-network/dealers/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Bayi silinemedi.");
            }
            toast.success("Bayi başarıyla silindi ve erişimi sonlandırıldı.");
            setDeleteModalId(null);
            fetchDealers();
        } catch (error: any) {
            toast.error(error.message || "Silme işlemi sırasında hata oluştu.");
        }
    };

    const handleUpdateCreditLine = async () => {
        if (!selectedDealer) return;
        try {
            const res = await fetch(`/api/dealer-network/dealers/${selectedDealer.id}/credit-limit`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creditLimit: parseFloat(newCreditLimit) })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Limit güncellenemedi.");
            }
            setIsDrawerOpen(false);
            setSelectedDealer(null);
            setNewCreditLimit("");
            toast.success("Kredi limiti güncellendi.");
            setDealers(prev => prev.map(d => d.id === selectedDealer.id ? { ...d, creditLimit: newCreditLimit } : d));
        } catch (error: any) {
            toast.error(error.message || "Limit güncellenemedi.");
        }
    };

    const openCreditDrawer = (dealer: any) => {
        setSelectedDealer(dealer);
        setNewCreditLimit(dealer.creditLimit?.toString() || "");
        setIsDrawerOpen(true);
    };

    const filteredDealers = dealers.filter(d => 
        d.dealerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.taxNumber?.includes(searchQuery)
    );

    const headers = ["Bayi Adı", "Vergi No", "Durum", "Kredi Limiti", "İşlemler"];

    return (
        <div className="p-8 space-y-6 relative max-w-[1400px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        Periodya <span className="text-indigo-600 dark:text-indigo-400">Bayi Ağı</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">B2B portalınızda yer alan onaylı bayileriniz ve işlem limitleri.</p>
                </div>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/20"
                >
                    <UserPlus className="w-4 h-4" />
                    Yeni Bayi Davet Et
                </button>
            </div>

            <EnterpriseCard>
                <div className="p-5 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Kayıtlı Bayiler</h3>
                            <p className="text-xs text-slate-500">{dealers.length} aktif bağlantı</p>
                        </div>
                    </div>
                    {/* Search Field */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Bayi ara veya Vergi No..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0f172a] text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <EnterpriseTable headers={headers}>
                        {filteredDealers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center bg-white dark:bg-[#020817]">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Search className="w-10 h-10 mb-3 opacity-20" />
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Harika bir ağ kurmaya hazır mısınız?</p>
                                        <p className="text-xs mt-1">Görünüşe göre henüz aradığınız kriterde bayi yok.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredDealers.map((dealer: any, idx) => (
                                <tr key={idx} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase border border-indigo-100 dark:border-indigo-500/20">
                                                {dealer.dealerName.charAt(0)}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{dealer.dealerName}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400 font-mono tracking-tight">{dealer.taxNumber}</td>
                                    <td className="p-4">
                                        {dealer.status === "ACTIVE" ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                Bekliyor / Pasif
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm font-semibold text-slate-900 dark:text-white">
                                        ₺{dealer.creditLimit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {dealer.customerId && (
                                                <Link href={`/customers/${dealer.customerId}`} passHref>
                                                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-all border border-emerald-100 dark:border-emerald-500/20">
                                                        <Eye className="w-4 h-4" />
                                                        İncele
                                                    </button>
                                                </Link>
                                            )}
                                            {!dealer.customerId && (
                                                <button disabled title="Cari eşleşmesi bulunamadı (Vergi No ile tarandı)" className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-400 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed">
                                                    <ShieldAlert className="w-4 h-4" />
                                                    Eşleşme Yok
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => openCreditDrawer(dealer)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 transition-all"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                Limit
                                            </button>
                                            
                                            <button
                                                onClick={() => setDeleteModalId(dealer.id)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </EnterpriseTable>
                </div>
            </EnterpriseCard>

            {/* Delete Confirmation Modal */}
            {deleteModalId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bayiyi Sil</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Bu bayiyi B2B ağınızdan kaldırmak istediğinize emin misiniz? Cari verileri etkilenmeyecek, sadece B2B erişimi kapatılacaktır.</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-[#1e293b] flex gap-3 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={() => setDeleteModalId(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors">İptal</button>
                            <button onClick={() => handleDelete(deleteModalId)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20">Evet, Sil</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-indigo-500" />
                                Bayi Davet Et
                            </h2>
                            <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Invite Type Switcher */}
                            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                                <button
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${inviteType === 'customer' ? 'bg-white dark:bg-[#0f172a] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    onClick={() => setInviteType('customer')}
                                >
                                    Mevcut Cari Seç
                                </button>
                                <button
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${inviteType === 'email' ? 'bg-white dark:bg-[#0f172a] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    onClick={() => setInviteType('email')}
                                >
                                    Harici E-posta
                                </button>
                            </div>

                            {/* Forms */}
                            {inviteType === 'customer' ? (
                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Portföyden Cari Seçimi</label>
                                    <select
                                        value={selectedCustomerId}
                                        onChange={e => setSelectedCustomerId(e.target.value)}
                                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white transition-all"
                                    >
                                        <option value="">-- Cariye ait B2B hesabı aç --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.email ? `(${c.email})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3">
                                        <p className="text-xs text-amber-700 dark:text-amber-400">Seçilen carinin CRM kartında geçerli bir e-posta adresi olması gereklidir. Yoksa davetiye iletilemez.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Yeni Bayi Email Adresi</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm bg-white dark:bg-[#0f172a] transition-all"
                                        placeholder="ornek@bayifirmasi.com.tr"
                                    />
                                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
                                        <p className="text-xs text-blue-700 dark:text-blue-400">Bu adrese, kayıt işlemlerini tamamlayabilmesi için özel tek kullanımlık bir B2B davet bağlantısı gönderilecektir.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-50 dark:bg-[#1e293b] p-5 flex justify-end gap-3 rounded-b-2xl border-t border-slate-100 dark:border-white/5">
                            <button onClick={() => setIsInviteModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">İptal</button>
                            <button onClick={handleInvite} disabled={isInviting || (inviteType === 'email' ? !inviteEmail : !selectedCustomerId)} className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/20">
                                {isInviting ? "Gönderiliyor..." : "Daveti Gönder"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Credit Limit Drawer */}
            {isDrawerOpen && selectedDealer && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-500" />
                                Finansal Limitler
                            </h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            <div className="p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                                <p className="text-xs font-semibold text-indigo-600/80 dark:text-indigo-400/80 uppercase tracking-wider">İşlem Yapılan Bayi</p>
                                <p className="text-lg font-bold text-indigo-950 dark:text-indigo-100 mt-1">{selectedDealer.dealerName}</p>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Açık Hesap Limiti (₺)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₺</span>
                                    <input
                                        type="number"
                                        value={newCreditLimit}
                                        onChange={e => setNewCreditLimit(e.target.value)}
                                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 pl-8 pr-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-base font-medium bg-white dark:bg-[#0f172a] transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Bu limit bayi tarafından yapılabilecek maksimum açık hesap alışveriş hacmini belirler. Siparişleri sırasında bu limit referans alınacaktır.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsDrawerOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">İptal</button>
                            <button onClick={handleUpdateCreditLine} className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/20">Limiti Güncelle</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
