"use client";

import React, { useEffect, useState } from 'react';
import { useModal } from '@/contexts/ModalContext';
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseTable,
    EnterpriseButton
} from '@/components/ui/enterprise';
import { Building2, Search, Link as LinkIcon, Edit } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AdminNetworkCompaniesPage() {
    const { showError } = useModal();
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/network/companies');
            const result = await res.json();
            if (res.ok) {
                setCompanies(result.data || []);
            } else {
                showError("Hata", result.error || "Şirketler yüklenemedi.");
            }
        } catch (error) {
            showError("Hata", "Ağ bağlantı hatası.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleAction = async (action: 'verify' | 'restrict' | 'recalculate-trust', id: string, name: string) => {
        try {
            const res = await fetch(`/api/admin/network/companies/${id}/${action}`, { method: 'POST' });
            if (!res.ok) throw new Error("İşlem başarısız");
            fetchCompanies();
        } catch (e) {
            showError("Hata", "İşlem sırasında bir hata oluştu.");
        }
    };

    const filtered = companies.filter(c =>
        (c.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <EnterprisePageShell
            title="Global Hub Firmaları"
            description="Tüm platformdaki network profili oluşturmuş firmaların merkezi listesi."
        >
            <EnterpriseCard noPadding className="mb-6 p-4">
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex-1 w-full md:w-auto relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <EnterpriseInput
                            className="pl-9"
                            placeholder="Display name veya slug ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </EnterpriseCard>

            <EnterpriseCard noPadding>
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">Global ağ verisi yükleniyor...</div>
                ) : (
                    <EnterpriseTable
                        headers={[
                            "Şirket & Slug",
                            "Görünürlük",
                            "Trust Score",
                            "Profil & Ağ",
                            "Doğrulama",
                            "Aksiyonlar"
                        ]}
                    >
                        {filtered.map(c => {
                            const badgeStr = c.trustScore?.badge || 'UNVERIFIED';
                            const relCount = (c._count?.sourceRelationships || 0) + (c._count?.targetRelationships || 0);
                            return (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            {c.displayName || 'İsimsiz'}
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-mono mt-1">
                                            {c.slug}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                                {c.visibilityLevel}
                                            </span>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase border ${c.isDiscoveryEnabled ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                {c.isDiscoveryEnabled ? 'Kşf: Açık' : 'Kşf: Kapalı'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-1.5 font-bold text-sm">
                                                <span className={c.trustScore?.score >= 70 ? 'text-emerald-600' : 'text-slate-700'}>
                                                    {c.trustScore?.score || 0}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                                                {badgeStr.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                            Profil: %{c.profileCompleteness || 0}
                                        </div>
                                        <div className="text-[11px] font-semibold text-slate-500 mt-1">
                                            Bağlantı: {relCount}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${c.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                            c.verificationStatus === 'RESTRICTED' ? 'bg-rose-100 text-rose-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {c.verificationStatus}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2 relative">
                                            {c.verificationStatus !== 'VERIFIED' && (
                                                <EnterpriseButton onClick={() => handleAction('verify', c.id, c.displayName)} variant="secondary" className="px-2 py-1 h-7 text-[10px]">Verify</EnterpriseButton>
                                            )}
                                            {c.verificationStatus !== 'RESTRICTED' && (
                                                <EnterpriseButton onClick={() => handleAction('restrict', c.id, c.displayName)} variant="secondary" className="px-2 py-1 h-7 text-[10px] text-rose-600 border-rose-200">Restrict</EnterpriseButton>
                                            )}
                                            <EnterpriseButton onClick={() => handleAction('recalculate-trust', c.id, c.displayName)} variant="secondary" className="px-2 py-1 h-7 text-[10px]">Hsp</EnterpriseButton>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
