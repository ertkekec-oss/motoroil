"use client";

import React, { useState, useEffect } from "react";
import { EnterpriseCard, EnterpriseTable } from "@/components/ui/enterprise";
import { X } from "lucide-react";

export default function DealersPage() {
    const [dealers, setDealers] = useState<any[]>([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");

    // Credit Limit Drawer State
    const [selectedDealer, setSelectedDealer] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [newCreditLimit, setNewCreditLimit] = useState("");

    useEffect(() => {
        fetch("/api/dealer-network/dealers")
            .then(res => res.json())
            .then(data => {
                if (data.data) setDealers(data.data);
            })
            .catch(err => console.error(err));
    }, []);

    const handleInvite = async () => {
        try {
            await fetch("/api/dealer-network/dealers/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail })
            });
            setIsInviteModalOpen(false);
            setInviteEmail("");
            alert("Davetiye başarıyla gönderildi.");
        } catch (error) {
            alert("Davetiye gönderilemedi.");
        }
    };

    const handleUpdateCreditLine = async () => {
        if (!selectedDealer) return;
        try {
            await fetch(`/api/dealer-network/dealers/${selectedDealer.id}/credit-limit`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creditLimit: parseFloat(newCreditLimit) })
            });
            setIsDrawerOpen(false);
            setSelectedDealer(null);
            setNewCreditLimit("");
            alert("Kredi limiti güncellendi.");
            // Ideally refetch dealers, here bypassing for demo
            setDealers(prev => prev.map(d => d.id === selectedDealer.id ? { ...d, creditLimit: newCreditLimit } : d));
        } catch (error) {
            alert("Limit güncellenemedi.");
        }
    };

    const openCreditDrawer = (dealer: any) => {
        setSelectedDealer(dealer);
        setNewCreditLimit(dealer.creditLimit?.toString() || "");
        setIsDrawerOpen(true);
    };

    const headers = ["Bayi Adı", "Vergi No", "Durum", "Kredi Limiti", "İşlemler"];

    return (
        <div className="p-8 space-y-6 relative">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Bayiler</h1>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                >
                    Bayi Davet Et
                </button>
            </div>

            <EnterpriseCard>
                <div className="p-5 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">Kayıtlı Bayiler</h3>
                </div>
                <EnterpriseTable headers={headers}>
                    {dealers.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-4 text-center text-sm text-slate-500">
                                Henüz bayi bulunmuyor.
                            </td>
                        </tr>
                    ) : (
                        dealers.map((dealer: any, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <td className="p-4 text-sm font-medium text-slate-900">{dealer.dealerName}</td>
                                <td className="p-4 text-sm text-slate-600">{dealer.taxNumber}</td>
                                <td className="p-4 text-sm text-slate-600">{dealer.status}</td>
                                <td className="p-4 text-sm font-medium text-slate-900">{dealer.creditLimit}</td>
                                <td className="p-4 text-sm">
                                    <button
                                        onClick={() => openCreditDrawer(dealer)}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                                    >
                                        Limit Düzenle
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </EnterpriseTable>
            </EnterpriseCard>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-900">Yeni Bayi Davet Et</h2>
                            <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Bayi Email Adresi</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="ornek@bayi.com"
                                />
                            </div>
                        </div>
                        <div className="bg-slate-50 p-6 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
                            <button onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">İptal</button>
                            <button onClick={handleInvite} className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800">Davet Gönder</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Credit Limit Drawer */}
            {isDrawerOpen && selectedDealer && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-900">Kredi Limiti Yönetimi</h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-sm text-slate-500">Seçili Bayi</p>
                                <p className="text-base font-semibold text-slate-900 mt-1">{selectedDealer.dealerName}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Yeni Kredi Limiti (₺)</label>
                                <input
                                    type="number"
                                    value={newCreditLimit}
                                    onChange={e => setNewCreditLimit(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="0.00"
                                />
                                <p className="mt-2 text-xs text-slate-500">Bu limit bayi tarafından yapılabilecek maks açık hesap alışveriş hacmini belirler.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">İptal</button>
                            <button onClick={handleUpdateCreditLine} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Limiti Kaydet</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
