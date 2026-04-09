"use client";

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useModal } from '@/contexts/ModalContext';
import { ShieldAlert, Activity, CheckCircle, XCircle, Trash2, ListFilter, AlertTriangle, PackageSearch } from 'lucide-react';

export default function SuspiciousActivityPage() {
    const {
        suspiciousEvents: events,
        clearSuspiciousEvents,
        branches,
    } = useApp();
    
    const {
        pendingProducts,
        approveProduct,
        rejectProduct,
    } = useInventory();
    
    const { showSuccess, showError, showConfirm } = useModal();
    
    const [filter, setFilter] = useState<'all' | 'today' | 'week'>('today');
    const [branchFilter, setBranchFilter] = useState('all');
    const [activeSecurityTab, setActiveSecurityTab] = useState<'suspicious' | 'approvals'>('suspicious');

    // Notification permission request
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const now = new Date();
            const eventDate = new Date(event.timestamp);

            if (filter === 'today') {
                if (eventDate.toDateString() !== now.toDateString()) return false;
            } else if (filter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (eventDate < weekAgo) return false;
            }

            if (branchFilter !== 'all' && event.branch !== branchFilter) {
                return false;
            }

            return true;
        });
    }, [events, filter, branchFilter]);

    const stats = useMemo(() => {
        const today = new Date().toDateString();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        return {
            today: events.filter(e => new Date(e.timestamp).toDateString() === today).length,
            week: events.filter(e => new Date(e.timestamp) >= weekAgo).length,
            total: events.length,
            pendingApprovals: pendingProducts.filter(p => p.status === 'pending').length
        };
    }, [events, pendingProducts]);

    return (
        <div className="p-6 md:p-8 animate-in fade-in min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Canlı Güvenlik Monitörü</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Satış ve Onay Merkezi</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Şüpheli işlemler ve personel ürün ekleme taleplerinin denetimi.</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-fit shrink-0">
                    <button
                        onClick={() => setActiveSecurityTab('suspicious')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeSecurityTab === 'suspicious' 
                                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        Şüpheli İşlemler
                        {stats.today > 0 && <span className="ml-1.5 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px]">{stats.today}</span>}
                    </button>
                    <button
                        onClick={() => setActiveSecurityTab('approvals')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeSecurityTab === 'approvals' 
                                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Onay Bekleyenler
                        {stats.pendingApprovals > 0 && <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px]">{stats.pendingApprovals}</span>}
                    </button>
                </div>
            </header>

            {activeSecurityTab === 'suspicious' ? (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[14px] bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bugün</h4>
                                <div className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{stats.today}</div>
                                <p className="text-[10px] font-bold text-red-500 mt-0.5 uppercase">Tespit Edilen Olay</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[14px] bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Son 7 Gün</h4>
                                <div className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{stats.week}</div>
                                <p className="text-[10px] font-bold text-amber-500 mt-0.5 uppercase">Haftalık Toplam</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[14px] bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                                <ListFilter className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tüm Zamanlar</h4>
                                <div className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{stats.total}</div>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">Kayıtlı Olay</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-center space-y-2">
                            <select
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            >
                                <option value="all">Tüm Şubeler</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.name}>{b.name}</option>
                                ))}
                            </select>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            >
                                <option value="today">Sadece Bugün</option>
                                <option value="week">Son 7 Gün</option>
                                <option value="all">Tümü</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Bar */}
                    {events.length > 0 && (
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => {
                                    showConfirm('Emin Misiniz?', 'Tüm olay kayıtlarını silmek istediğinize emin misiniz?', () => {
                                        clearSuspiciousEvents();
                                        showSuccess('Başarılı', 'Tüm olaylar temizlendi.');
                                    });
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                TÜMÜNÜ TEMİZLE
                            </button>
                        </div>
                    )}

                    {/* Logs Table Area */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/10">
                            <div className="flex items-center gap-3">
                                <h3 className="text-base font-bold text-slate-800 dark:text-white">Olay Günlüğü</h3>
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-[9px] font-bold uppercase tracking-wider">Canlı</span>
                            </div>
                        </div>

                        {filteredEvents.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">Kayıtlı olay bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredEvents.map((event) => (
                                    <div key={event.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            
                                            <div className="flex items-start lg:items-center gap-4 flex-1">
                                                <div className="w-10 h-10 shrink-0 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center">
                                                    <AlertTriangle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800 dark:text-white">Şüpheli Cümle: <span className="text-red-500 dark:text-red-400">"{event.detectedPhrase}"</span></div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-semibold text-slate-500">
                                                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                                            👤 {event.staff}
                                                        </span>
                                                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                                            📍 {event.branch}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{new Date(event.timestamp).toLocaleDateString('tr-TR')} {new Date(event.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 self-start lg:self-auto shrink-0">
                                                <div className="text-left lg:text-right hidden sm:block">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Analiz Güveni</div>
                                                    <div className={`text-sm font-black ${event.confidence > 0.8 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        %{Math.round(event.confidence * 100)}
                                                    </div>
                                                </div>
                                                
                                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden lg:block"></div>

                                                <div className="min-w-[140px]">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Satış Durumu</div>
                                                    {event.hasSaleInLast5Min ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-md">
                                                            <CheckCircle className="w-3 h-3" />
                                                            KAYITLI SATIŞ VAR
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-2 py-1 rounded-md">
                                                            <XCircle className="w-3 h-3" />
                                                            SATIŞ YOK
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        clearSuspiciousEvents(event.id);
                                                        showSuccess('İşlem Başarılı', 'Olay kaydı incelendi ve kapatıldı.');
                                                    }}
                                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold transition-colors ml-2 shrink-0"
                                                >
                                                    KAPAT
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Approvals Tab */
                <div className="animate-in fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Ürün Ekleme Onayları</h3>
                    </div>

                    {pendingProducts.filter(p => p.status === 'pending').length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm">
                            <CheckCircle className="w-16 h-16 mb-4 text-emerald-500 opacity-50" />
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Bekleyen onay kalmadı.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {pendingProducts.filter(p => p.status === 'pending').map((pending) => (
                                <div key={pending.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                    <PackageSearch className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{pending.productData.name}</h4>
                                                    <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                                        Personel: <span className="text-slate-700 dark:text-slate-300">{pending.requestedBy}</span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        Tarih: {new Date(pending.requestedAt || "").toLocaleString('tr-TR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Kod / Barkod</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                                    {pending.productData.code} <span className="text-slate-300 dark:text-slate-600 mx-1">|</span> {pending.productData.barcode || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Stok / Marka</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {pending.productData.stock} <span className="text-slate-400 text-[10px] ml-1">ADET</span> <span className="text-slate-300 dark:text-slate-600 mx-1">|</span> {pending.productData.brand || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Kategori</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{pending.productData.category}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Alış</p>
                                                    <p className="text-sm font-black text-slate-600 dark:text-slate-400">₺{Number(pending.productData.buyPrice).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Satış</p>
                                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₺{Number(pending.productData.price).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Card Actions */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                                        <button
                                            onClick={() => {
                                                rejectProduct(pending.id);
                                                showError('Reddedildi', 'Ürün ekleme talebi reddedildi.');
                                            }}
                                            className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 text-xs font-bold transition-all"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            REDDET
                                        </button>
                                        <button
                                            onClick={() => {
                                                approveProduct(pending.id);
                                                showSuccess('Aktarıldı', 'Yeni ürün onaylandı ve envantere eklendi.');
                                            }}
                                            className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-white bg-emerald-500 hover:bg-emerald-600 text-xs font-bold transition-all shadow-sm shadow-emerald-500/20"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            ONAYLA & EKLE
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
