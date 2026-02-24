"use client";

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

export default function NotificationsPage() {
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'approvals' | 'alerts'>('approvals');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchSummary = async () => {
        try {
            const res = await fetch('/api/notifications/summary');
            const data = await res.json();
            if (data.success) {
                setSummary(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        const interval = setInterval(fetchSummary, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (type: string, id: string, action: 'approve' | 'reject') => {
        setProcessingId(id);
        try {
            // Placeholder for actual approval logic
            // In a real app, this would call specific endpoints like /api/transfers/approve
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('İşlem başarıyla gerçekleştirildi');
            fetchSummary();
        } catch (e) {
            toast.error('İşlem başarısız');
        } finally {
            setProcessingId(null);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchSummary();
                toast.success('Bildirim silindi');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const {
        pendingInvoices = [],
        pendingTransfers = [],
        pendingCounts = [],
        recentEcommerceSales = [],
        activeServices = [],
        expiringWarranties = [],
        systemNotifications = [],
        securityEvents = []
    } = summary || {};

    const approvalItems = useMemo(() => {
        const items = [
            ...pendingInvoices.map((inv: any) => ({
                id: inv.id,
                type: 'Invoice',
                title: 'Fatura Onayı Bekliyor',
                subtitle: inv.customer?.name || 'Müşteri',
                amount: `₺${Number(inv.totalAmount).toLocaleString()}`,
                date: inv.createdAt,
                icon: '📄',
                color: 'blue',
                data: inv
            })),
            ...pendingTransfers.map((tr: any) => ({
                id: tr.id,
                type: 'Transfer',
                title: 'Stok Transfer Onayı',
                subtitle: `${tr.fromBranch} ➔ ${tr.toBranch}`,
                amount: `${tr.qty} Adet`,
                date: tr.shippedAt || tr.createdAt,
                icon: '🚚',
                color: 'orange',
                data: tr
            })),
            ...pendingCounts.map((c: any) => ({
                id: c.id,
                type: 'Count',
                title: 'Sayım Sonucu Onayı',
                subtitle: `Sayım #${c.id}`,
                amount: c.status,
                date: c.createdAt,
                icon: '🔢',
                color: 'purple',
                data: c
            }))
        ];
        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [pendingInvoices, pendingTransfers, pendingCounts]);

    const alertItems = useMemo(() => {
        const items = [
            ...systemNotifications.map((n: any) => ({
                id: n.id,
                type: 'System',
                title: 'Sistem Bildirimi',
                text: n.text,
                date: n.createdAt,
                icon: n.icon || '🔔',
                color: 'slate'
            })),
            ...securityEvents.map((e: any) => ({
                id: e.id,
                type: 'Security',
                title: 'Şüpheli İşlem Tespit Edildi',
                text: `"${e.detectedPhrase}" - ${e.staff} (${e.branch})`,
                date: e.timestamp,
                icon: '🚨',
                color: 'red'
            })),
            ...recentEcommerceSales.map((s: any) => ({
                id: s.id,
                type: 'Ecommerce',
                title: `${s.marketplace} Yeni Sipariş`,
                text: `${s.customerName} - ${s.orderNumber}`,
                date: s.orderDate,
                amount: `₺${Number(s.totalAmount).toLocaleString()}`,
                icon: '🛒',
                color: 'green'
            })),
            ...expiringWarranties.map((w: any) => ({
                id: w.id,
                type: 'Warranty',
                title: 'Garanti Süresi Azaldı',
                text: `${w.productName} - ${w.customerName}`,
                date: w.endDate,
                icon: '🛡️',
                color: 'yellow'
            }))
        ];
        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [systemNotifications, securityEvents, recentEcommerceSales, expiringWarranties]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium font-outfit">Bildirimler Hazırlanıyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white font-outfit tracking-tight">
                        Aksiyon <span className="text-primary italic">Merkezi</span>
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">İş akışınızdaki bekleyen onaylar ve kritik uyarılar</p>
                </div>

                <div className="flex p-1.5 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl">
                    <button
                        onClick={() => setActiveTab('approvals')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'approvals'
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        📝 Onay Bekleyenler
                        {approvalItems.length > 0 && (
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{approvalItems.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'alerts'
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        🔔 Bildirimler
                        {alertItems.length > 0 && (
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{alertItems.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 gap-6">
                {activeTab === 'approvals' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {approvalItems.length === 0 ? (
                            <EmptyState
                                icon="✨"
                                title="Harika!"
                                text="Şu an için onay bekleyen herhangi bir işlem bulunmuyor."
                            />
                        ) : (
                            approvalItems.map((item) => (
                                <ApprovalCard
                                    key={item.id}
                                    item={item}
                                    onAction={handleAction}
                                    isProcessing={processingId === item.id}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {alertItems.length === 0 ? (
                            <EmptyState
                                icon="📭"
                                title="Bildirim Yok"
                                text="Okunmamış veya yeni bir bildiriminiz bulunmuyor."
                            />
                        ) : (
                            alertItems.map((item) => (
                                <AlertItem
                                    key={item.id}
                                    item={item}
                                    onDelete={deleteNotification}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .font-outfit { font-family: 'Outfit', sans-serif; }
                @keyframes pulse-soft {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
}

function ApprovalCard({ item, onAction, isProcessing }: any) {
    const colorMap: any = {
        blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
        orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400',
        purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400',
        green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400'
    };

    return (
        <div className={`group relative bg-gradient-to-br ${colorMap[item.color]} border rounded-3xl p-6 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden`}>
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>

            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                    {item.icon}
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{item.type}</span>
                    <div className="text-xs font-bold mt-1 opacity-80">
                        {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-black text-white mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
            <p className="text-sm text-white/50 font-medium mb-4">{item.subtitle}</p>

            <div className="bg-black/20 rounded-2xl p-4 mb-6 flex justify-between items-center border border-white/5">
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Miktar / Tutar</span>
                <span className="text-xl font-black text-white">{item.amount}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    disabled={isProcessing}
                    onClick={() => onAction(item.type, item.id, 'reject')}
                    className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40 transition-all disabled:opacity-50"
                >
                    Reddet
                </button>
                <button
                    disabled={isProcessing}
                    onClick={() => onAction(item.type, item.id, 'approve')}
                    className="py-3 px-4 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>✅ Onayla</>
                    )}
                </button>
            </div>
        </div>
    );
}

function AlertItem({ item, onDelete }: any) {
    const colorMap: any = {
        slate: 'border-slate-800 bg-slate-800/20 hover:border-slate-600',
        red: 'border-red-500/20 bg-red-500/5 hover:border-red-500/40',
        green: 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40',
        yellow: 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40'
    };

    return (
        <div className={`p-5 rounded-3xl border transition-all duration-300 flex items-center gap-5 group ${colorMap[item.color]}`}>
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shrink-0 shadow-premium">
                {item.icon}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-black text-white tracking-tight">{item.title}</h4>
                    <span className="text-[10px] font-bold text-white/30 uppercase">
                        {new Date(item.date).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <p className="text-sm text-white/50 font-medium line-clamp-1">{item.text}</p>
                {item.amount && (
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                        {item.amount}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                <button
                    onClick={() => onDelete(item.id)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg hover:bg-red-500/20 hover:text-red-400 transition-all shadow-sm"
                    title="Sil"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}

function EmptyState({ icon, title, text }: any) {
    return (
        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="text-6xl animate-bounce duration-[3s]">{icon}</div>
            <div>
                <h3 className="text-xl font-black text-white">{title}</h3>
                <p className="text-slate-500 max-w-xs">{text}</p>
            </div>
        </div>
    );
}
