"use client";

import { useState, useEffect } from "react";
import FinanceStatusBanner from "@/components/FinanceStatusBanner";

export default function SupportTicketsPage() {
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterType, setFilterType] = useState("ALL");
    const [selectedTicket, setSelectedTicket] = useState<any>(null); // State for opening ticket detail

    useEffect(() => {
        setLoading(true);
        // Mock API
        setTimeout(() => {
            setTickets([
                { id: "T-0091", type: "PAYOUT", status: "OPEN", subject: "Para Çekim Gecikmesi", orderRef: null, createdAt: "2026-02-27T10:00:00Z", slaDue: "2026-02-28T10:00:00Z", slaBreach: false, messages: [{ sender: "USER", text: "Merhaba, hesabıma halen para geçmedi." }] },
                { id: "T-0084", type: "SHIPPING_DISPUTE", status: "SLA_BREACH", subject: "Ürün kargoda kayboldu alıcı parayı istiyor", orderRef: "ORD-99124", createdAt: "2026-02-24T14:30:00Z", slaDue: "2026-02-26T14:30:00Z", slaBreach: true, messages: [{ sender: "USER", text: "Alıcı iade istiyor ancak pazarama kargosu kayıp." }, { sender: "SYSTEM", text: "Talebiniz incelenmektedir. Escrow askıya alınmıştır." }] },
                { id: "T-0071", type: "BILLING", status: "RESOLVED", subject: "Boost Faturası İtiraz", orderRef: null, createdAt: "2026-02-15T09:15:00Z", slaDue: "2026-02-17T09:15:00Z", slaBreach: false, messages: [{ sender: "USER", text: "Faturamda yanlışlık var inceler misiniz?" }, { sender: "AGENT", text: "[PII REDACTED] Faturanız başarıyla düzeltilmiştir ve mahsuplaşılmıştır." }] },
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const filteredTickets = tickets.filter(t => {
        if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
        if (filterType !== "ALL" && t.type !== filterType) return false;
        return true;
    });

    const formatDate = (dateString: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(dateString));

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "OPEN": return "bg-blue-100 text-blue-800 border-blue-200";
            case "IN_PROGRESS": return "bg-indigo-100 text-indigo-800 border-indigo-200";
            case "SLA_BREACH": return "bg-red-100 text-red-800 border-red-200 animate-pulse font-black shadow-red-100 shadow-lg";
            case "RESOLVED": return "bg-green-100 text-green-800 border-green-200";
            default: return "bg-slate-100 text-slate-800 border-slate-200";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "SHIPPING_DISPUTE": return "📦 İhtilaf";
            case "BILLING": return "🧾 Finans";
            case "PAYOUT": return "💳 Çekim";
            default: return "🎫 Destek";
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">📝 Taleplerim & Destek</h1>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">+ Yeni Talep / İhtilaf Oluştur</button>
            </div>

            <FinanceStatusBanner />

            <div className="flex flex-col lg:flex-row gap-6">

                {/* Tickets List */}
                <div className="flex-1 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 transition-colors w-full sm:w-auto font-medium"
                            >
                                <option value="ALL">Tüm Durumlar</option>
                                <option value="OPEN">Açık</option>
                                <option value="IN_PROGRESS">İnceleniyor</option>
                                <option value="SLA_BREACH">Gecikmiş (SLA İhlali)</option>
                                <option value="RESOLVED">Çözümlendi</option>
                            </select>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 transition-colors w-full sm:w-auto font-medium"
                            >
                                <option value="ALL">Tüm Konular</option>
                                <option value="SHIPPING_DISPUTE">Kargo & İhtilaf</option>
                                <option value="BILLING">Fatura İtirazı</option>
                                <option value="PAYOUT">Para Çekme</option>
                                <option value="OTHER">Diğer</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 divide-y divide-slate-100">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 font-medium">Talepler yükleniyor...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-medium">Bu kriterlere uygun açık talebiniz bulunmuyor.</div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`p-5 hover:bg-slate-50 cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'bg-indigo-50/50 border-l-4 border-indigo-500 pl-4' : 'border-l-4 border-transparent pl-4'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{ticket.id}</span>
                                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusStyle(ticket.status)}`}>{ticket.status}</span>
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">{formatDate(ticket.createdAt)}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">{ticket.subject}</h3>
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-3">
                                        <span className="bg-slate-100 px-2 py-1 rounded">{getTypeIcon(ticket.type)}</span>
                                        {ticket.orderRef && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">Ref: {ticket.orderRef}</span>}
                                        {ticket.slaBreach && <span className="text-red-600 bg-red-50 px-2 py-1 rounded">Destek Süresi Aşıldı!</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Ticket Detail Panel - Desktop Only View (Can be modal on mobile) */}
                <div className="hidden lg:block w-96 flex-shrink-0">
                    {selectedTicket ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sticky top-6 max-h-[calc(100vh-120px)]">
                            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                                <h3 className="font-bold text-slate-800 text-sm mb-1">{selectedTicket.id} Nolu Talep Detayı</h3>
                                <p className="text-xs font-medium text-slate-500">{selectedTicket.subject}</p>
                            </div>
                            <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-slate-50/50">
                                {selectedTicket.messages.map((msg: any, idx: number) => (
                                    <div key={idx} className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                                        <span className="text-[10px] font-bold uppercase text-slate-400 mb-1 ml-1 mr-1">{msg.sender === 'USER' ? 'Siz' : (msg.sender === 'SYSTEM' ? 'Sistem' : 'Müşteri Temsilcisi')}</span>
                                        <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${msg.sender === 'USER' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border text-slate-700 border-slate-200 rounded-tl-sm shadow-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
                                {selectedTicket.status !== 'RESOLVED' ? (
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Yanıtınızı yazın..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-indigo-500 transition-colors" />
                                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Gönder</button>
                                    </div>
                                ) : (
                                    <div className="bg-slate-100 text-slate-500 text-sm font-medium p-3 rounded-lg text-center">Bu talep çözüme kavuştuğu için kapatılmıştır.</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl h-96 flex flex-col items-center justify-center text-slate-400 p-8 text-center sticky top-6">
                            <span className="text-4xl mb-4 opacity-50">🎫</span>
                            <p className="text-sm font-medium">Tüm talep geçmişini ve yanıtları okumak için listeden bir destek kaydı seçin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
