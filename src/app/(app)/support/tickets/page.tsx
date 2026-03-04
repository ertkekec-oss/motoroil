"use client";

import { useState, useEffect } from "react";
import FinanceStatusBanner from "@/components/FinanceStatusBanner";

export default function SupportTicketsPage() {
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterType, setFilterType] = useState("ALL");
    const [selectedTicket, setSelectedTicket] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/support/tickets?status=${filterStatus}&type=${filterType}`)
            .then(res => res.ok ? res.json() : { items: [] })
            .then(data => {
                setTickets(data.items || []);
                setSelectedTicket(null);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [filterStatus, filterType]);

    const handleSelectTicket = async (ticketId: string) => {
        try {
            const res = await fetch(`/api/support/tickets/${ticketId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedTicket(data);
            }
        } catch (e) {
            console.error("Failed to load ticket details", e);
        }
    };

    const filteredTickets = tickets;

    const formatDate = (dateString: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(dateString));

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "OPEN": return "bg-blue-100 text-blue-800 border-blue-200";
            case "IN_PROGRESS": return "bg-amber-100 text-amber-800 border-amber-200";
            case "SLA_BREACH": return "bg-red-100 text-red-800 border-red-200";
            case "RESOLVED": return "bg-emerald-100 text-emerald-800 border-emerald-200";
            default: return "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "OPEN": return "Açık / Beklemede";
            case "IN_PROGRESS": return "İnceleniyor";
            case "SLA_BREACH": return "SLA İhlali";
            case "RESOLVED": return "Çözümlendi";
            default: return status;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "SHIPPING_DISPUTE": return "Kargo İhtilafı";
            case "BILLING": return "Finans / Fatura";
            case "PAYOUT": return "Mali Çıkış (Payout)";
            default: return "Genel Destek";
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-transparent min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Enterprise Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-1">
                            Taleplerim & Müşteri Hizmetleri
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            B2B ağındaki finansal ihtilaflarınızı, iptal süreçlerinizi ve kurumsal destek taleplerinizi buradan yönetebilirsiniz.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button className="h-10 px-5 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm gap-2">
                            <span>+</span> Yeni Talep / İhtilaf Oluştur
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <FinanceStatusBanner />
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Tickets List */}
                    <div className="flex-1 space-y-4">

                        {/* Filters Strip */}
                        <div className="bg-white dark:bg-[#080911] p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex gap-2 w-full sm:w-auto">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="bg-slate-50 dark:bg-[#080911] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-slate-900 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/40 block px-3 py-2 transition-colors w-full sm:w-auto font-medium shadow-sm outline-none"
                                >
                                    <option value="ALL">Tüm Durumlar</option>
                                    <option value="OPEN">Yeni Katıldı (Açık)</option>
                                    <option value="IN_PROGRESS">Değerlendirmede</option>
                                    <option value="SLA_BREACH">Gecikmiş (SLA İhlali)</option>
                                    <option value="RESOLVED">Arşive Kaldırılanlar</option>
                                </select>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="bg-slate-50 dark:bg-[#080911] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-slate-900 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/40 block px-3 py-2 transition-colors w-full sm:w-auto font-medium shadow-sm outline-none"
                                >
                                    <option value="ALL">Tüm Operasyonlar</option>
                                    <option value="SHIPPING_DISPUTE">Kargo & Lojistik İhtilafı</option>
                                    <option value="BILLING">Fatura & Cari İtiraz</option>
                                    <option value="PAYOUT">Mali Hakediş (Payout)</option>
                                    <option value="OTHER">Diğer Hizmet Talepleri</option>
                                </select>
                            </div>
                        </div>

                        {/* List Container */}
                        <div className="bg-white dark:bg-[#080911] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <div className="p-16 flex flex-col items-center justify-center text-center">
                                    <div className="w-8 h-8 border-4 border-slate-200 dark:border-white/10 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">TALEPLER YÜKLENİYOR...</p>
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="p-16 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-[#080911] border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm opacity-60">
                                        🎫
                                    </div>
                                    <p className="text-[15px] font-semibold text-slate-900 dark:text-white">Açık Talep Bulunamadı</p>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 dark:text-slate-500 max-w-sm mt-1">Bu kriterlere uygun açık bir destek kaydınız veya iptal talebiniz yok.</p>
                                </div>
                            ) : (
                                filteredTickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => handleSelectTicket(ticket.id)}
                                        className={`p-5 cursor-pointer transition-colors relative group border-l-4 ${selectedTicket?.id === ticket.id ? 'bg-slate-50 dark:bg-[#080911] border-l-slate-900' : 'border-l-transparent hover:bg-slate-50 dark:bg-[#080911]'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                                                    #{ticket.id.slice(0, 8)}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(ticket.status)}`}>
                                                    {getStatusLabel(ticket.status)}
                                                </span>
                                            </div>
                                            <span className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">{formatDate(ticket.createdAt)}</span>
                                        </div>
                                        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1 leading-snug truncate group-hover:text-blue-700 transition-colors">
                                            B2B Ağ Operasyonu - Kasa & İşlem Bildirimi
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-3 border-t border-slate-100 dark:border-white/5 pt-3">
                                            <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10 font-semibold text-slate-600 dark:text-slate-300">
                                                {getTypeIcon(ticket.type)}
                                            </span>
                                            {ticket.relatedEntityId && (
                                                <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 font-mono text-[11px]">
                                                    REF: {ticket.relatedEntityId.slice(0, 10)}...
                                                </span>
                                            )}
                                            {ticket.status === 'SLA_BREACH' && (
                                                <span className="text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 animate-pulse">
                                                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Çözüm Süresi İhlali
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Ticket Detail Panel */}
                    <div className="hidden lg:flex w-[450px] flex-shrink-0 flex-col">
                        {selectedTicket ? (
                            <div className="bg-white dark:bg-[#080911] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col flex-1 max-h-[calc(100vh-120px)] overflow-hidden sticky top-8">
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#080911]/50 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">Kayıt Dosyası: #{selectedTicket.id.slice(0, 8)}...</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(selectedTicket.status)}`}>
                                            {getStatusLabel(selectedTicket.status)}
                                        </span>
                                    </div>
                                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">
                                        Tarih: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(selectedTicket.createdAt)}</span>
                                    </p>
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto space-y-5 bg-slate-50 dark:bg-[#080911]/30 custom-scrollbar">
                                    {selectedTicket.messages?.map((msg: any, idx: number) => (
                                        <div key={idx} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                    {msg.isMe ? 'Firma Yetkilisi' : (msg.senderRole === 'SYSTEM' || msg.senderRole === 'SUPER_ADMIN') ? 'Sistem / Müşteri Temsilcisi' : msg.senderRole}
                                                </span>
                                            </div>
                                            <div className={`p-4 rounded-xl text-[14px] leading-relaxed max-w-[90%] shadow-sm border ${msg.isMe ? 'bg-slate-900 text-white border-slate-800 rounded-tr-sm' : 'bg-white dark:bg-[#080911] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-tl-sm'}`}>
                                                {msg.message}
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                                        <div className="text-center text-slate-400 dark:text-slate-500 text-sm font-medium py-10 italic">
                                            İçerik yükleniyor veya henüz ilk mesaj kaydedilmedi...
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080911]/50">
                                    {selectedTicket.status !== 'RESOLVED' ? (
                                        <div className="flex flex-col gap-3">
                                            <textarea
                                                rows={3}
                                                placeholder="Dosyaya ek yanıt yazın..."
                                                className="w-full bg-white dark:bg-[#080911] border border-slate-300 dark:border-white/20 rounded-lg text-[14px] px-4 py-3 outline-none focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/10/10 transition-all font-medium resize-none shadow-sm"
                                            />
                                            <div className="flex justify-end">
                                                <button className="h-10 px-6 bg-slate-900 text-white rounded-lg text-[13px] font-bold hover:bg-slate-800 transition-colors shadow-sm">
                                                    Yanıtı İlet
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 dark:text-slate-500 text-[13px] font-medium p-4 rounded-xl flex items-center justify-center gap-2">
                                            <span>🔒</span> Talep çözüldüğü için arşive aktarıldı.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#080911] border border-slate-200 dark:border-white/10 rounded-2xl flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-10 text-center sticky top-8 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-[#080911] rounded-full flex items-center justify-center text-3xl mb-5 border border-slate-100 dark:border-white/5">
                                    📄
                                </div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Talep Detay Görünümü</h3>
                                <p className="text-[13px] font-medium leading-relaxed">
                                    Tüm talep geçmişini, muhasebe loglarını ve temsilci yanıtlarını okumak için yandaki listeden bir destek kaydı seçin.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

