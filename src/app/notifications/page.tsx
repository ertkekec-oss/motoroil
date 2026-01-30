
"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';

export default function NotificationsPage() {
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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
        const interval = setInterval(fetchSummary, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return <div className="p-10 text-center text-white/50">Yükleniyor...</div>;
    }

    const {
        pendingInvoices = [],
        pendingTransfers = [],
        pendingCounts = [],
        recentEcommerceSales = [],
        activeServices = [],
        expiringWarranties = []
    } = summary || {};

    const NotificationCard = ({ title, icon, color, items, renderItem, emptyText }: any) => (
        <div className="card glass relative overflow-hidden group hover:border-white/10 transition-all duration-300">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-xl shadow-lg`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white/90">{title}</h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{items.length} Bildirim</p>
                    </div>
                </div>
                {items.length > 0 && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-white/20 text-sm font-medium italic">{emptyText}</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {items.map((item: any, idx: number) => (
                            <div key={idx} className="p-4 hover:bg-white/5 transition-colors text-sm">
                                {renderItem(item)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="container p-6 mx-auto max-w-[1600px] min-h-screen">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
                    Bildirim Merkezi
                </h1>
                <p className="text-white/40 mt-2 font-medium">Operasyonel uyarılar ve onay bekleyen işlemler</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* 1. FATURALAŞACAKLAR */}
                <NotificationCard
                    title="Faturalaşacaklar"
                    icon="📄"
                    color="bg-blue-500/20 text-blue-400"
                    items={pendingInvoices}
                    emptyText="Bekleyen fatura işlemi yok."
                    renderItem={(item: any) => (
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold text-white/90">{item.customer?.name || 'Müşteri'}</div>
                                <div className="text-xs text-white/50">{new Date(item.createdAt || Date.now()).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-blue-400">₺{Number(item.totalAmount || 0).toLocaleString()}</div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">Taslak</span>
                            </div>
                        </div>
                    )}
                />

                {/* 2. TRANSFER ONAYLARI */}
                <NotificationCard
                    title="Transfer Onayları"
                    icon="🚚"
                    color="bg-orange-500/20 text-orange-400"
                    items={pendingTransfers}
                    emptyText="Onay bekleyen transfer yok."
                    renderItem={(item: any) => (
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold text-white/90">{item.productName}</div>
                                <div className="text-xs text-white/50">{item.fromBranch} ➔ {item.toBranch}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-orange-400">{item.qty} Adet</div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400">Yolda</span>
                            </div>
                        </div>
                    )}
                />

                {/* 3. STOK SAYIM ONAYLARI */}
                <NotificationCard
                    title="Stok Sayım Onayları"
                    icon="🔢"
                    color="bg-purple-500/20 text-purple-400"
                    items={pendingCounts}
                    emptyText="İncelenecek sayım sonucu yok."
                    renderItem={(item: any) => (
                        <div>
                            <div className="font-bold text-white/90">Sayım #{item.id}</div>
                            <div className="text-xs text-white/50">Durum: {item.status}</div>
                        </div>
                    )}
                />

                {/* 4. E-TİCARET SATIŞLARI */}
                <NotificationCard
                    title="E-Ticaret Satışları"
                    icon="🛒"
                    color="bg-green-500/20 text-green-400"
                    items={recentEcommerceSales}
                    emptyText="Yeni e-ticaret satışı yok."
                    renderItem={(item: any) => (
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold text-white/90">{item.description || 'Satış'}</div>
                                <div className="text-xs text-white/50">{new Date(item.date).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-green-400">₺{Number(item.amount).toLocaleString()}</div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">Yeni</span>
                            </div>
                        </div>
                    )}
                />

                {/* 5. SERVİS UYARILARI */}
                <NotificationCard
                    title="Servis Uyarıları"
                    icon="🛠️"
                    color="bg-red-500/20 text-red-400"
                    items={activeServices}
                    emptyText="Aktif servis uyarısı yok."
                    renderItem={(item: any) => (
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold text-white/90">{item.vehicle} ({item.plate})</div>
                                <div className="text-xs text-white/50">{item.technician || 'Atanmamış'}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">{item.status}</span>
                            </div>
                        </div>
                    )}
                />

                {/* 6. GARANTİ BİTİMİNE AZ KALANLAR */}
                <NotificationCard
                    title="Garanti Bitiyor (2 Ay)"
                    icon="🛡️"
                    color="bg-yellow-500/20 text-yellow-400"
                    items={expiringWarranties}
                    emptyText="Yakın zamanda süresi dolacak garanti yok."
                    renderItem={(item: any) => (
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold text-white/90">{item.productName}</div>
                                <div className="text-xs text-white/50">{item.customerName || 'Müşteri'}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-yellow-400">{new Date(item.endDate).toLocaleDateString()}</div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">Bitiyor</span>
                            </div>
                        </div>
                    )}
                />

            </div>
        </div>
    );
}
