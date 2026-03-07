"use client";

import React, { useEffect, useState } from 'react';
import { useModal } from '@/contexts/ModalContext';
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseTabs,
    EnterpriseTable,
    EnterpriseEmptyState,
    EnterpriseButton
} from '@/components/ui/enterprise';
import { Inbox, Send, Check, X, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function NetworkInvitationsPage() {
    const { showError, showSuccess, showConfirm } = useModal();
    const [invitations, setInvitations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('incoming'); // incoming | outgoing

    const fetchInvitations = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/network/invitations');
            const data = await res.json();
            if (res.ok) {
                setInvitations(data.invites || []);
            } else {
                showError("Hata", data.error || "Davetler getirilemedi.");
            }
        } catch (error) {
            showError("Hata", "Ağ bağlantı hatası.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleAction = (id: string, action: 'accept' | 'reject') => {
        const title = action === 'accept' ? 'Başvuruyu Kabul Et' : 'Başvuruyu Reddet';
        const msg = action === 'accept'
            ? 'Bu firmayla ticari bağlantı kurmayı onaylıyor musunuz?'
            : 'Bu bağlantı isteğini reddetmek istediğinize emin misiniz?';

        showConfirm(title, msg, async () => {
            try {
                const res = await fetch(`/api/network/invitations/${id}/${action}`, {
                    method: 'POST'
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                showSuccess("İşlem Başarılı", `Davet ${action === 'accept' ? 'kabul edildi' : 'reddedildi'}.`);
                fetchInvitations();
            } catch (err: any) {
                showError("İşlem Başarısız", err.message || "Bilinmeyen hata oluştu.");
            }
        });
    };

    const isIncoming = activeTab === 'incoming';
    // Filter logic: if incoming, we act as toTenant. Assume current user tenant ID is dynamically handled by backend and invites array has a 'direction' property if we injected it, OR we just map based on the profile data. Wait, our API returns:
    // { id, fromProfile, toProfile, status, createdAt, proposedRelationshipType... }
    // We need to know if we are 'from' or 'to'. The API currently returns two lists or a combined list.
    // Let's assume the API returns two arrays: received and sent, or we filter based on a property. 
    // Wait, let's look at `invitations.ts` route.
    // The GET route: `const sent = await prisma... where fromTenantId. const received = await prisma... where toTenantId`
    // Returns `{ sent, received }`.

    const [sent, setSent] = useState<any[]>([]);
    const [received, setReceived] = useState<any[]>([]);

    useEffect(() => {
        const loadAPI = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/network/invitations');
                const data = await res.json();
                if (res.ok) {
                    setSent(data.sent || []);
                    setReceived(data.received || []);
                } else {
                    showError("Hata", data.error || "Davetler yüklenemedi.");
                }
            } catch (e) {
                showError("Hata", "Sistem hatası.");
            } finally {
                setIsLoading(false);
            }
        }
        loadAPI();
    }, []);

    const displayList = isIncoming ? received : sent;

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'PENDING': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold tracking-wider">BEKLİYOR</span>;
            case 'ACCEPTED': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold tracking-wider">KABUL EDİLDİ</span>;
            case 'REJECTED': return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-[10px] font-bold tracking-wider">REDDEDİLDİ</span>;
            case 'CANCELED': return <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold tracking-wider">İPTAL EDİLDİ</span>;
            default: return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold tracking-wider">{status}</span>;
        }
    }

    return (
        <EnterprisePageShell
            title="Network Davetleri"
            description="Ağ geçmişinizi, aldığınız ve gönderdiğiniz bağlantı isteklerini yönetin."
        >
            <EnterpriseTabs
                tabs={[
                    { id: 'incoming', label: `Gelen İstekler (${received.filter((r: any) => r.status === 'PENDING').length})`, icon: '📥' },
                    { id: 'outgoing', label: `Gönderilenler (${sent.filter((s: any) => s.status === 'PENDING').length})`, icon: '📤' }
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <EnterpriseCard noPadding>
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">Yükleniyor...</div>
                ) : displayList.length === 0 ? (
                    <EnterpriseEmptyState
                        icon={isIncoming ? <Inbox /> : <Send />}
                        title={isIncoming ? "Gelen davet yok" : "Giden davet yok"}
                        description="Şu anda bekleyen veya geçmiş bir bağlantı isteği bulunmuyor."
                    />
                ) : (
                    <EnterpriseTable
                        headers={[
                            "Şirket",
                            "Bağlantı Tipi",
                            "Tarih/Saat",
                            "Durum",
                            { label: "İşlem", alignRight: true }
                        ]}
                    >
                        {displayList.map((item: any) => {
                            const otherProfile = isIncoming ? item.fromProfile : item.toProfile;
                            return (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-sm text-slate-900 dark:text-white">
                                            {otherProfile?.displayName || 'Bilinmeyen'}
                                        </div>
                                        {item.message && (
                                            <div className="text-[11px] text-slate-500 mt-1 max-w-sm truncate" title={item.message}>
                                                "{item.message}"
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {item.proposedRelationshipType}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs text-slate-500">
                                            {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="p-4 text-right">
                                        {isIncoming && item.status === 'PENDING' ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleAction(item.id, 'reject')}
                                                    className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                                                    title="Reddet"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(item.id, 'accept')}
                                                    className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                                                    title="Kabul Et"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 dark:text-slate-500 pr-2">-</div>
                                        )}
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
