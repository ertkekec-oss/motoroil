"use client";

import React, { useEffect, useState } from 'react';
import { useModal } from '@/contexts/ModalContext';
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseTable,
    EnterpriseEmptyState
} from '@/components/ui/enterprise';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AdminNetworkInvitationsPage() {
    const { showError } = useModal();
    const [invites, setInvites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInvites = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/network/invitations');
            const data = await res.json();
            if (res.ok) {
                setInvites(data.invites || []);
            } else {
                showError("Hata", data.error || "Davetler yüklenemedi.");
            }
        } catch (error) {
            showError("Hata", "Ağ bağlantı hatası.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'PENDING': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold tracking-wider">BEKLİYOR</span>;
            case 'ACCEPTED': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold tracking-wider">KABUL EDİLDİ</span>;
            case 'REJECTED': return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-[10px] font-bold tracking-wider">REDDEDİLDİ</span>;
            default: return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold tracking-wider">{status}</span>;
        }
    }

    return (
        <EnterprisePageShell
            title="Global Davet İzleme Aracı"
            description="Tenant'lar arası kurulan tüm pending ve resolve olmuş isteklerin log kayıtları."
        >
            <EnterpriseCard noPadding>
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">Global davetler yükleniyor...</div>
                ) : invites.length === 0 ? (
                    <EnterpriseEmptyState
                        icon={<Send className="w-8 h-8" />}
                        title="İstek Yok"
                        description="Sistemde henüz gönderilmiş bir bağlantı isteği (davet) kaydı bulunmuyor."
                    />
                ) : (
                    <EnterpriseTable
                        headers={[
                            "Kimden (From)",
                            "Kime (To)",
                            "Talep Edilen Rol",
                            "Tarih/Saat",
                            "Durum"
                        ]}
                    >
                        {invites.map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="p-4">
                                    <div className="font-semibold text-sm text-slate-900 line-clamp-1">
                                        {inv.fromProfile?.displayName || inv.fromTenantId}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                                        {inv.fromTenantId}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-semibold text-sm text-slate-900 line-clamp-1">
                                        {inv.toProfile?.displayName || inv.toTenantId}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                                        {inv.toTenantId}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                        {inv.proposedRelationshipType}
                                    </div>
                                </td>
                                <td className="p-4 text-xs text-slate-500">
                                    <div>{format(new Date(inv.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}</div>
                                    {inv.respondedAt && (
                                        <div className="mt-1 text-slate-400">
                                            R: {format(new Date(inv.respondedAt), 'dd.MM, HH:mm', { locale: tr })}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={inv.status} />
                                </td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
