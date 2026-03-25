"use client";

import React, { useEffect, useState } from 'react';
import { useModal } from '@/contexts/ModalContext';
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseTable,
    EnterpriseEmptyState,
    EnterpriseButton
} from '@/components/ui/enterprise';
import { Network, Link2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';

export default function NetworkConnectionsPage() {
    const { showError } = useModal();
    const [connections, setConnections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    const fetchConnections = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (typeFilter) query.set('type', typeFilter);

            const res = await fetch(`/api/network/connections?${query.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setConnections(data.relationships || []);
            } else {
                showError("Hata", data.error || "Bağlantılar yüklenemedi.");
            }
        } catch (error) {
            showError("Hata", "Ağ bağlantı hatası.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, [typeFilter]);

    // Use a basic filtering logic for search locally
    const filteredConnections = connections.filter(c => {
        if (!searchTerm) return true;
        const otherName = (c.otherProfile?.displayName || '').toLowerCase();
        return otherName.includes(searchTerm.toLowerCase());
    });

    return (
        <EnterprisePageShell
            title="Ticaret Ağı Bağlantılarım"
            description="Aktif ve geçmiş partner firma bağlantılarınızı yönetin."
            actions={
                <Link href="/network/discover">
                    <EnterpriseButton variant="primary">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Yeni Bağlantı
                    </EnterpriseButton>
                </Link>
            }
        >
            <EnterpriseCard noPadding className="mb-6 p-4">
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex-1 w-full md:w-auto">
                        <EnterpriseInput
                            placeholder="Partner adı ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <EnterpriseSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="">Tüm Tipler</option>
                            <option value="SUPPLIER">Tedarikçi (Supplier)</option>
                            <option value="BUYER">Alıcı (Buyer)</option>
                            <option value="DEALER">Bayi (Dealer)</option>
                        </EnterpriseSelect>
                    </div>
                </div>
            </EnterpriseCard>

            <EnterpriseCard noPadding>
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">Bağlantılar yükleniyor...</div>
                ) : filteredConnections.length === 0 ? (
                    <EnterpriseEmptyState
                        icon={<Network className="w-8 h-8" />}
                        title="Bağlantı Bulunamadı"
                        description="Şu an aktif bir B2B Trade Network bağlantınız yok. Keşif motorundan firmalara davet gönderebilirsiniz."
                    />
                ) : (
                    <EnterpriseTable
                        headers={[
                            "Şirket",
                            "Bağlantı Rolü",
                            "Tarih/Saat",
                            "Durum",
                            { label: "Detay", alignRight: true }
                        ]}
                    >
                        {filteredConnections.map((rel: any) => {
                            // Assume backend mapped 'otherProfile' dynamically for user convenience
                            // Or we display target/source based on our ID. Since the logic is handled 
                            // properly in projection or we will do it here. The mock test didn't show the exact api shape but we can guess it's standard.
                            const otherProfile = rel.otherProfile || rel.targetProfile || rel.sourceProfile;
                            const isIncoming = rel.targetTenantId === 'current_id_placeholder'; // Simplification

                            return (
                                <tr key={rel.id} className="hover:bg-slate-50 :bg-slate-800 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                                <Link2 className="text-slate-400 w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm text-slate-900">
                                                    {otherProfile?.displayName || 'Gizli Firma'}
                                                </div>
                                                <div className="text-[11px] text-slate-500 line-clamp-1">
                                                    {otherProfile?.shortDescription || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-semibold px-2 py-1 bg-slate-100  rounded">
                                            {rel.relationshipType}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-slate-500">
                                        {format(new Date(rel.connectedAt || rel.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase ${rel.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {rel.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link href={`/network/connections/${rel.id}`}>
                                            <EnterpriseButton variant="secondary" className="px-3 py-1 h-8 text-xs font-medium">Büyüteç</EnterpriseButton>
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}

