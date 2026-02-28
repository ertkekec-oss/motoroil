"use client";

import { useState, useMemo, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useApp } from '@/contexts/AppContext';
import QuoteList from '@/components/QuoteList';
import QuoteForm from '@/components/QuoteForm';
import QuotePreviewModal from '@/components/modals/QuotePreviewModal';

export default function QuotesPage() {
    const { showSuccess, showError } = useModal();
    const { branches } = useApp();
    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
    const [editingQuote, setEditingQuote] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewQuote, setPreviewQuote] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [quotes, setQuotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQuotes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/quotes');
            const data = await res.json();
            if (data.success) {
                setQuotes(data.quotes);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    // Statistics
    const stats = useMemo(() => {
        const total = quotes.length;
        const accepted = quotes.filter(q => q.status === 'Accepted' || q.status === 'Converted').length;
        const pending = quotes.filter(q => q.status === 'Draft' || q.status === 'Sent').length;
        const totalVal = quotes.reduce((acc, q) => acc + Number(q.totalAmount || 0), 0);
        const convRate = total > 0 ? (accepted / total) * 100 : 0;

        return { total, accepted, pending, totalVal, convRate };
    }, [quotes]);

    const handleSave = async (data: any) => {
        try {
            const url = editingQuote ? `/api/quotes/${editingQuote.id}` : '/api/quotes';
            const method = editingQuote ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const json = await res.json();
            if (json.success) {
                showSuccess('Başarılı', editingQuote ? 'Teklif güncellendi' : 'Teklif oluşturuldu');
                setActiveTab('list');
                setEditingQuote(null);
                fetchQuotes();
            } else {
                showError('Hata', json.error);
            }
        } catch (error) {
            showError('Hata', 'İşlem sırasında bir hata oluştu');
        }
    };

    const handleEdit = (quote: any) => {
        setEditingQuote(quote);
        setActiveTab('edit');
    };

    const handlePreview = (quote: any) => {
        setPreviewQuote(quote);
        setIsPreviewOpen(true);
    };

    return (
        <div className="p-4 sm:p-6 pb-32 animate-fade-in-up">
            {/* Header & Stats Dashboard */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
                <div className="flex-1">
                    <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                        <span className="text-primary text-4xl">📋</span> Teklif Yönetimi
                    </h1>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Müşterilerinize profesyonel teklifler sunun ve satış süreçlerinizi optimize edin.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
                    {[
                        { label: 'Toplam', val: stats.total, color: 'text-white' },
                        { label: 'Onaylanan', val: stats.accepted, color: 'text-emerald-400' },
                        { label: 'Bekleyen', val: stats.pending, color: 'text-blue-400' },
                        { label: 'Dönüşüm', val: `%${stats.convRate.toFixed(1)}`, color: 'text-purple-400' }
                    ].map((s, idx) => (
                        <div key={idx} className="bg-[#0a0a0b]/80 backdrop-blur-xl border border-white/5 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[140px] hover:border-white/10 transition-all duration-300 group">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-black mb-1 group-hover:text-white/60 transition-colors">{s.label}</div>
                            <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Bar */}
            {activeTab === 'list' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-2xl p-4 -mx-4 rounded-3xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative group w-full sm:w-72">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity text-sm">🔍</span>
                            <input
                                type="text"
                                placeholder="Teklif no veya müşteri ara..."
                                className="w-full bg-white/[0.03] border border-white/10 py-3 pl-10 pr-4 rounded-xl text-white/90 text-xs font-bold placeholder-white/20 outline-none transition-all duration-500 focus:border-primary/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-primary/10 shadow-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-white/[0.02] hover:bg-white/[0.06] py-3 px-4 rounded-xl border border-white/10 text-xs font-bold text-white outline-none cursor-pointer focus:border-primary/50 transition-all duration-300 w-40"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">Tüm Durumlar</option>
                            <option value="Draft">Taslak</option>
                            <option value="Sent">Gönderildi</option>
                            <option value="Accepted">Onaylandı</option>
                            <option value="Rejected">Reddedildi</option>
                            <option value="Converted">Faturalandı</option>
                        </select>
                    </div>

                    <button
                        onClick={() => { setEditingQuote(null); setActiveTab('create'); }}
                        className="bg-primary hover:bg-transparent hover:text-primary hover:border-primary border border-transparent text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        ✨ Yeni Teklif Oluştur
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <div className="mt-4">
                {activeTab === 'list' ? (
                    <QuoteList
                        onEdit={handleEdit}
                        onPreview={handlePreview}
                        initialQuotes={quotes}
                        isLoading={isLoading}
                        searchTerm={searchTerm}
                        statusFilter={statusFilter}
                        refreshList={fetchQuotes}
                    />
                ) : (
                    <div className="animate-in slide-in-from-right-4 fade-in duration-500 max-w-7xl mx-auto">
                        <div className="flex items-center gap-4 mb-6 bg-[#0a0a0b]/80 border border-white/5 p-6 rounded-3xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <button
                                onClick={() => { setActiveTab('list'); setEditingQuote(null); }}
                                className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all duration-300 text-white/50 hover:text-white"
                            >
                                ←
                            </button>
                            <div>
                                <h2 className="text-2xl font-black flex items-center gap-3">
                                    <span className="text-primary text-3xl">✨</span> {activeTab === 'create' ? 'Yeni Teklif Oluştur' : 'Teklifi Düzenle'}
                                </h2>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Sektörel Standartlarda Profesyonel Belge</p>
                            </div>
                        </div>

                        <QuoteForm
                            initialData={editingQuote}
                            onSave={handleSave}
                            onCancel={() => { setActiveTab('list'); setEditingQuote(null); }}
                        />
                    </div>
                )}
            </div>

            <QuotePreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                quote={previewQuote}
                branches={branches}
            />
        </div >
    );
}
