"use client";

import React, { useEffect, useState } from 'react';
import { useModal } from '@/contexts/ModalContext';
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseTable,
    EnterpriseEmptyState
} from '@/components/ui/enterprise';
import { Network, Search, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AdminNetworkRelationshipsPage() {
    const { showError } = useModal();
    const [relationships, setRelationships] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRelationships = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/network/relationships');
            const data = await res.json();
            if (res.ok) {
                setRelationships(data.relationships || []);
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
        fetchRelationships();
    }, []);

    return (
        <EnterprisePageShell
            title="Global İlişkiler Grafiği"
            description="Tenant'lar arası kurulan tüm bağlantı türlerinin sistem yöneticisi izleme ekranı."
        >
            <EnterpriseCard noPadding>
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">Global ilişkiler yükleniyor...</div>
                ) : relationships.length === 0 ? (
                    <EnterpriseEmptyState
                        icon={<Network className="w-8 h-8" />}
                        title="Bağlantı Yok"
                        description="Sistemde henüz tenant'lar arası kurulmuş bir bağlantı yok."
                    />
                ) : (
                    <EnterpriseTable
                        headers={[
                            "Kaynak Firma (Source)",
                            "Bağlantı Rolü",
                            "Hedef Firma (Target)",
                            "Yön / Durum",
                            "Oluşturulma Tarihi"
                        ]}
                    >
                        {relationships.map((rel: any) => (
                            <tr key={rel.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="p-4">
                                    <div className="font-semibold text-sm text-slate-900 line-clamp-1">
                                        {rel.sourceProfile?.displayName || rel.sourceTenantId}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                                        {rel.sourceTenantId}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                        {rel.relationshipType}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="font-semibold text-sm text-slate-900 line-clamp-1">
                                        {rel.targetProfile?.displayName || rel.targetTenantId}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                                        {rel.targetTenantId}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase ${rel.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {rel.status}
                                        </span>
                                        <span className="text-[9px] font-medium text-slate-400">
                                            {rel.directionType}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-xs text-slate-500">
                                    {format(new Date(rel.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                                </td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
