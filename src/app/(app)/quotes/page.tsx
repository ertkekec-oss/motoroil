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
            {/* Minimal Header Strip & Stats Dashboard */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex-1">
                    <h1 className="text-[20px] sm:text-[22px] font-semibold text-slate-900 dark:text-white mb-1 tracking-tight">
                        Teklif Yönetimi
                    </h1>
                    <p className="text-[13px] text-slate-500 font-medium">Satış süreçlerinizi yönetin ve profesyonel finansal belgeler hazırlayın.</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    {[
                        { label: 'TOPLAM', val: stats.total, color: 'text-slate-900 dark:text-white' },
                        { label: 'ONAYLANAN', val: stats.accepted, color: 'text-green-600 dark:text-green-400' },
                        { label: 'BEKLEYEN', val: stats.pending, color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'DÖNÜŞÜM', val: `%${stats.convRate.toFixed(1)}`, color: 'text-slate-700 dark:text-slate-300' }
                    ].map((s, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 h-[56px] px-4 rounded-[14px] min-w-[120px] flex flex-col justify-center">
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">{s.label}</div>
                            <div className={`text-[20px] font-semibold leading-none ${s.color}`}>{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Bar */}
            {activeTab === 'list' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-2xl">
                        <div className="relative w-full sm:w-80">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Teklif no veya müşteri ara..."
                                className="w-full h-[40px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 pl-9 pr-4 rounded-lg text-slate-900 dark:text-white text-[13px] placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative w-40">
                            <select
                                className="w-full h-[40px] bg-slate-50 dark:bg-[#1e293b] pr-8 pl-3 rounded-lg border border-slate-200 dark:border-white/10 text-[13px] text-slate-900 dark:text-white outline-none cursor-pointer focus:border-blue-500 transition-colors appearance-none font-medium"
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
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => { setEditingQuote(null); setActiveTab('create'); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-[42px] px-5 rounded-xl text-[13px] font-medium transition-colors shadow-sm w-full sm:w-auto"
                    >
                        Yeni Teklif Oluştur
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
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-6xl mx-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => { setActiveTab('list'); setEditingQuote(null); }}
                                className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-500 dark:text-slate-400 disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <div>
                                <h2 className="text-[20px] font-semibold text-slate-900 dark:text-white tracking-tight">
                                    {activeTab === 'create' ? 'Yeni Teklif Oluştur' : 'Teklifi Düzenle'}
                                </h2>
                                <p className="text-[13px] text-slate-500 mt-0.5">Sektörel standartlarda profesyonel belge detayları.</p>
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
