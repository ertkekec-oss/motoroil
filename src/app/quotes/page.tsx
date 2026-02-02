"use client";

import { useState, useMemo, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import QuoteList from '@/components/QuoteList';
import QuoteForm from '@/components/QuoteForm';

export default function QuotesPage() {
    const { showSuccess, showError } = useModal();
    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
    const [editingQuote, setEditingQuote] = useState<any>(null);
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
        // Ideally open a print-friendly modal or page
        showSuccess('Bilgi', 'Baskı önizleme özelliği hazırlandığında aktif edilecektir.');
    };

    return (
        <div className="p-4 sm:p-6 pb-32 animate-fade-in-up">
            {/* Header & Stats Dashboard */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
                <div className="flex-1">
                    <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        📋 Teklif Yönetimi
                    </h1>
                    <p className="text-muted text-sm font-medium">Müşterilerinize profesyonel teklifler sunun ve satış süreçlerinizi optimize edin.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                    {[
                        { label: 'Toplam', val: stats.total, color: 'text-white' },
                        { label: 'Onaylanan', val: stats.accepted, color: 'text-green-400' },
                        { label: 'Bekleyen', val: stats.pending, color: 'text-blue-400' },
                        { label: 'Dönüşüm', val: `%${stats.convRate.toFixed(1)}`, color: 'text-purple-400' }
                    ].map((s, idx) => (
                        <div key={idx} className="card glass-plus p-3 px-4 min-w-[120px]">
                            <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">{s.label}</div>
                            <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Bar */}
            {activeTab === 'list' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sticky top-0 z-20 bg-main/80 backdrop-blur-md p-2 -mx-2 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <input
                                type="text"
                                placeholder="Teklif no veya müşteri ara..."
                                className="input input-bordered w-full bg-black/40 pl-10 h-10 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span className="absolute left-3 top-2.5 text-muted">🔍</span>
                        </div>
                        <select
                            className="select select-bordered select-sm bg-black/40 h-10 w-32"
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
                        className="btn btn-primary btn-md w-full sm:w-auto shadow-lg shadow-primary/20"
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
                    <div className="animate-in slide-in-from-right-4 fade-in duration-300 max-w-7xl mx-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => { setActiveTab('list'); setEditingQuote(null); }}
                                className="btn btn-circle btn-ghost border border-white/10 hover:bg-white/10 hover:scale-105 transition-all"
                            >
                                ←
                            </button>
                            <div>
                                <h2 className="text-3xl font-black">
                                    {activeTab === 'create' ? '✨ Yeni Teklif Oluştur' : '✏️ Teklifi Düzenle'}
                                </h2>
                                <p className="text-muted text-xs font-semibold uppercase tracking-widest mt-1">Sektörel Standartlarda Profesyonel Belge</p>
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
        </div>
    );
}
