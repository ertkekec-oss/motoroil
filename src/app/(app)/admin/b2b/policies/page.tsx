"use client";

import React, { useState, useEffect } from "react";
import {
    EnterpriseCard,
    EnterpriseTable,
    EnterprisePageShell,
    EnterpriseButton,
    EnterpriseInput,
    EnterpriseSelect
} from "@/components/ui/enterprise";
import { ShieldAlert, Info, Edit2, Play, Lock } from "lucide-react";
import { format } from "date-fns";
import { useModal } from "@/contexts/ModalContext";

export default function AdminB2BPoliciesPage() {
    const { showSuccess, showError, showWarning } = useModal();
    const [policies, setPolicies] = useState<any[]>([]);
    const [totalVisible, setTotalVisible] = useState(0);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");

    const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
    const [selectedMode, setSelectedMode] = useState<string>("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPolicies = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.append("q", searchQuery);

                const res = await fetch(`/api/admin/b2b/policies?${params.toString()}`);
                const data = await res.json();

                if (data.items) {
                    setPolicies(data.items);
                    setTotalVisible(data.stats?.totalVisible || 0);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchPolicies, 400); // debounce
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleEditStart = (tenantId: string, currentMode: string) => {
        setEditingPolicy(tenantId);
        setSelectedMode(currentMode);
    };

    const handleSave = async (tenantId: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/b2b/policies/${tenantId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dealerAuthMode: selectedMode })
            });

            if (res.ok) {
                // Update local state and exit edit mode
                setPolicies(prev => prev?.map(p =>
                    p.tenantId === tenantId ? { ...p, dealerAuthMode: selectedMode, updatedAt: new Date().toISOString() } : p
                ));
                setEditingPolicy(null);
            } else {
                showError("Uyarı", 'Güncelleme başarısız oldu. Yetkiniz yok veya sunucu hatası.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingPolicy(null);
    };

    const AuthModeBadge = ({ mode }: { mode: string }) => {
        switch (mode) {
            case 'PASSWORD_ONLY':
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 w-max"><Lock className="w-3 h-3" /> ŞİFRE İLE GİRİŞ</span>;
            case 'OTP_ONLY':
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max"><ShieldAlert className="w-3 h-3" /> SADECE SMS OTP</span>;
            case 'OTP_OR_PASSWORD':
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 w-max"><Play className="w-3 h-3" /> HYBRID (OTP + ŞİFRE)</span>;
            default:
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-gray-100 text-gray-700">{mode}</span>;
        }
    };

    const headers = [
        "Tedarikçi (Tenant)",
        "VKN/Kimlik No",
        "Dealer Portal Auth Mode",
        "Son Güncelleme",
        { label: "Aksiyon", alignRight: true }
    ];

    const actions = (
        <div className="flex items-center gap-3">
            <EnterpriseInput
                placeholder="Tedarikçi Adı veya ID Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
            />
        </div>
    );

    return (
        <EnterprisePageShell
            title="Sistem Güvenlik & OTP Politikaları (Governance)"
            description="Tenant bazlı Dealer Portal giriş politikalarını (OTP, Şifre vb.) görüntüleyin ve platform çapında yönetin."
            actions={actions}
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
        >
            <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl p-4 flex gap-3 text-sky-800 dark:text-sky-300 shadow-sm align-start mb-6 items-start">
                <Info className="w-5 h-5 shrink-0" />
                <div>
                    <span className="text-[11px] font-black uppercase tracking-widest block mb-1 text-sky-900 dark:text-sky-400">Katı Politika İlkesi:</span>
                    <span className="text-[12px] font-medium leading-relaxed opacity-90">Platform adminleri (Süper/Platform Admin), B2B sisteminde güvenliği ihlal eden tenantların portal giriş şeklini zorunlu olarak "SADECE OTP" moduna zorlayabilir. OTP moduna geçen bayiler SMS kodu ile portal erişimi sağlayacaktır.</span>
                </div>
            </div>

            <EnterpriseCard noPadding className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 flex items-center bg-slate-50 dark:bg-slate-800/30 rounded-t-xl">
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Tenant İzinli Politikaları</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-white/5">
                                {headers.map((h: any, i) => (
                                    <th key={i} className={`px-4 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 ${h.alignRight ? 'text-right' : ''}`}>
                                        {typeof h === 'string' ? h : h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">Yükleniyor...</td>
                                </tr>
                            ) : policies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">Görüntülenecek politika kaydı bulunamadı.</td>
                                </tr>
                            ) : (
                                policies?.map((policy) => (
                                    <tr key={policy.tenantId} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="p-4 align-middle">
                                            <div className="font-black text-[11px] uppercase tracking-wide text-slate-900 dark:text-white">{policy.tenantName}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-1 font-bold">{policy.tenantId}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-black text-[11px] tracking-widest text-slate-700 dark:text-slate-200 font-mono">{policy.vkn || 'N/A'}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            {editingPolicy === policy.tenantId ? (
                                                <div className="w-56">
                                                    <EnterpriseSelect
                                                        value={selectedMode}
                                                        onChange={(e) => setSelectedMode(e.target.value)}
                                                    >
                                                        <option value="PASSWORD_ONLY">Sadece Şifre (Varsayılan)</option>
                                                        <option value="OTP_ONLY">Zorunlu OTP (Sadece SMS)</option>
                                                        <option value="OTP_OR_PASSWORD">Hybrid (OTP veya Şifre)</option>
                                                    </EnterpriseSelect>
                                                </div>
                                            ) : (
                                                <AuthModeBadge mode={policy.dealerAuthMode} />
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-[11px] font-black tracking-widest uppercase text-slate-600 dark:text-slate-300">
                                            {format(new Date(policy.updatedAt), "dd MMM yyyy HH:mm")}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {editingPolicy === policy.tenantId ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <EnterpriseButton variant="secondary" onClick={handleCancelEdit} disabled={saving}>İptal</EnterpriseButton>
                                                    <EnterpriseButton onClick={() => handleSave(policy.tenantId)} disabled={saving}>{saving ? '...' : 'Kaydet'}</EnterpriseButton>
                                                </div>
                                            ) : (
                                                <EnterpriseButton variant="secondary" onClick={() => handleEditStart(policy.tenantId, policy.dealerAuthMode)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Edit2 className="w-4 h-4 mr-1.5" />
                                                    Politika Düzenle
                                                </EnterpriseButton>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest flex justify-between bg-slate-50/50 dark:bg-slate-800/10 rounded-b-xl">
                    <span>Mevcut Aktif Politika: {totalVisible} KAYIT</span>
                </div>
            </EnterpriseCard>

        </EnterprisePageShell>
    );
}
