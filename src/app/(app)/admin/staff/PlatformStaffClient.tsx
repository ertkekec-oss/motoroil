"use client";

import React, { useState, useEffect } from "react";
import { Users, Shield, Plus, MoreVertical, Search, Edit2, Trash2 } from "lucide-react";

const PLATFORM_ROLES = [
    { id: "SUPER_ADMIN", label: "Süper Admin (Kurucu)", color: "rose" },
    { id: "PLATFORM_ADMIN", label: "Tam Yetkili Yönetici", color: "indigo" },
    { id: "PLATFORM_SUPPORT", label: "Destek ve Ticket Uzmanı", color: "emerald" },
    { id: "PLATFORM_FINANCE_ADMIN", label: "Finans ve Mutabakat", color: "amber" },
    { id: "PLATFORM_RISK_ADMIN", label: "Risk ve KYC Onaylayıcı", color: "blue" },
    { id: "PLATFORM_GROWTH_ADMIN", label: "Büyüme & Satış Uzmanı", color: "purple" }
];

export default function PlatformStaffClient({ currentUser }: { currentUser: any }) {
    const [staff, setStaff] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        email: "",
        name: "",
        password: "",
        role: "PLATFORM_SUPPORT"
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await fetch("/api/admin/staff");
            const data = await res.json();
            if (data.success) {
                setStaff(data.staff);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                setFormData({ email: "", name: "", password: "", role: "PLATFORM_SUPPORT" });
                fetchStaff();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Kayıt başarısız.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Personeli silmek istediğinize emin misiniz? (Şirket hesaplarını değil, sadece platform yetkisini siler)")) return;
        try {
            const res = await fetch(`/api/admin/staff`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id })
            });
            if (res.ok) {
                fetchStaff();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filtered = staff.filter(s => 
        (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                        Platform Ekibi (RBAC)
                    </h1>
                    <p className="text-sm text-slate-400">
                        Periodya arka yüzünü (Admin Panel) yönetebilecek kullanıcı rollerini atayın.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    <Plus size={16} /> Yeni Yetkili Ekle
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                placeholder="İsim veya e-posta ara..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 w-64"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0B1120] text-slate-400 border-b border-slate-800/50">
                            <tr>
                                <th className="px-5 py-4 font-semibold uppercase tracking-wider text-[11px]">Personel</th>
                                <th className="px-5 py-4 font-semibold uppercase tracking-wider text-[11px]">Bağlı Kurum</th>
                                <th className="px-5 py-4 font-semibold uppercase tracking-wider text-[11px]">Kapsam / Yetki Rolü</th>
                                <th className="px-5 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Yükleniyor...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Personel bulunamadı.</td></tr>
                            ) : (
                                filtered.map((user) => {
                                    const roleDef = PLATFORM_ROLES.find(r => r.id === user.role) || { label: user.role, color: "slate" };
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                                                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white">{user.name || 'İsimsiz Yetkili'}</div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-400">
                                                {user.tenantId === 'PLATFORM_ADMIN' ? (
                                                    <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                                                        <Shield className="w-3.5 h-3.5" /> Merkez
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-mono">{user.tenantId}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-${roleDef.color}-500/10 text-${roleDef.color}-400 border border-${roleDef.color}-500/20`}>
                                                    {roleDef.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDelete(user.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-auto"
                                                    title="Yetkiyi Kaldır"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <form onSubmit={handleSave} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Platform Yetkilisi</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Ad Soyad</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">E-Posta</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Atanacak Rol (Kapsam)</label>
                                <select 
                                    value={formData.role} 
                                    onChange={e => setFormData({ ...formData, role: e.target.value })} 
                                    className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    {PLATFORM_ROLES.map(r => (
                                        <option key={r.id} value={r.id}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Şifre Belirle</label>
                                <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors">
                                İptal
                            </button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                                Kaydet ve Yetkilendir
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
