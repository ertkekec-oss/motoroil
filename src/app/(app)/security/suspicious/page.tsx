"use client";

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useModal } from '@/contexts/ModalContext';

export default function SuspiciousActivityPage() {
    const {
        suspiciousEvents: events,
        clearSuspiciousEvents,
        branches,
        currentUser
    } = useApp();
    const {
        pendingProducts,
        approveProduct,
        rejectProduct,
    } = useInventory();
    const { showSuccess, showError } = useModal();
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
        <div className="p-6 pb-32 animate-fade-in min-h-screen bg-[#080911]">
            <style jsx>{`
                .glass-card {
                    background: rgba(15, 17, 30, 0.4);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .glass-card:hover {
                    border-color: var(--primary);
                    background: rgba(15, 17, 30, 0.6);
                }
                .security-badge {
                    background: linear-gradient(135deg, #FF4B2B, #FF416C);
                    padding: 2px 8px;
                    border-radius: 99px;
                    font-size: 10px;
                    font-weight: 900;
                    color: white;
                    text-transform: uppercase;
                }
                .pulse {
                    width: 8px;
                    height: 8px;
                    background: #FF416C;
                    border-radius: 50%;
                    box-shadow: 0 0 0 rgba(255, 65, 108, 0.4);
                    animation: pulse-ring 1.5s infinite;
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 65, 108, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 65, 108, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 65, 108, 0); }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>

            <header className="flex justify-between items-end mb-10">
                <div className="animate-in slide-in-from-left duration-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF416C]">Canlı Güvenlik Monitörü</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-1">Satış Monitörü</h1>
                    <p className="text-white/40 font-medium">Şüpheli işlemler ve onay bekleyen talepler için merkezi kontrol.</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 animate-in slide-in-from-right duration-700">
                    <button
                        onClick={() => setActiveSecurityTab('suspicious')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all relative ${activeSecurityTab === 'suspicious' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
                    >
                        🚨 ŞÜPHELİ İŞLEMLER
                        {stats.today > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF416C] rounded-full text-[8px] flex items-center justify-center border-2 border-[#080911]">{stats.today}</span>}
                    </button>
                    <button
                        onClick={() => setActiveSecurityTab('approvals')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all relative ${activeSecurityTab === 'approvals' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
                    >
                        📋 ONAY BEKLEYENLER
                        {stats.pendingApprovals > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[8px] flex items-center justify-center border-2 border-[#080911]">{stats.pendingApprovals}</span>}
                    </button>
                </div>
            </header>

            {activeSecurityTab === 'suspicious' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-in fade-in duration-1000">
                        <div className="glass-card p-6 border-l-4 border-l-[#FF416C]">
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Bugün</div>
                            <div className="text-3xl font-black text-white">{stats.today}</div>
                            <div className="text-[10px] font-bold text-[#FF416C]/60 mt-1 uppercase">Tespit Edilen Olay</div>
                        </div>
                        <div className="glass-card p-6 border-l-4 border-l-amber-500">
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Son 7 Gün</div>
                            <div className="text-3xl font-black text-white">{stats.week}</div>
                            <div className="text-[10px] font-bold text-amber-500/60 mt-1 uppercase">Haftalık Toplam</div>
                        </div>
                        <div className="glass-card p-6">
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Tüm Zamanlar</div>
                            <div className="text-3xl font-black text-white">{stats.total}</div>
                            <div className="text-[10px] font-bold text-white/20 mt-1 uppercase">Kayıtlı Olay</div>
                        </div>
                        <div className="glass-card p-4 flex flex-col justify-center">
                            <select
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-primary transition-colors mb-2"
                            >
                                <option value="all" className="bg-[#1a1c2e]">Tüm Şubeler</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.name} className="bg-[#1a1c2e]">{b.name}</option>
                                ))}
                            </select>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-primary transition-colors"
                            >
                                <option value="today" className="bg-[#1a1c2e]">Bugün</option>
                                <option value="week" className="bg-[#1a1c2e]">Son 7 Gün</option>
                                <option value="all" className="bg-[#1a1c2e]">Tümü</option>
                            </select>
                        </div>
                        {events.length > 0 && (
                            <div className="md:col-span-4 flex justify-end">
                                <button
                                    onClick={() => {
                                        if (confirm('Tüm olay kayıtlarını silmek istediğinize emin misiniz?')) {
                                            clearSuspiciousEvents();
                                            showSuccess('Bşarılı', 'Tüm olaylar temizlendi.');
                                        }
                                    }}
                                    className="px-6 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold transition-all"
                                >
                                    🗑️ TÜMÜNÜ TEMİZLE
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="glass-card overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center group/header">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xl font-black text-white tracking-tight group-hover/header:text-primary transition-colors">Olay Günlüğü</h3>
                                <div className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-black text-white/30 uppercase tracking-widest">Canlı Yayın</div>
                            </div>
                            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Sıralama: En Yeni</div>
                        </div>

                        <div className="max-h-[600px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {filteredEvents.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-white/10 italic">
                                    <span className="text-6xl mb-4">🛡️</span>
                                    <p className="text-sm font-black uppercase tracking-widest">Kayıtlı olay bulunamadı.</p>
                                </div>
                            ) : (
                                filteredEvents.map((event, idx) => (
                                    <div key={event.id} className="group p-5 rounded-[20px] bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-[#FF416C]/30 transition-all animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-12 h-12 rounded-2xl bg-[#FF416C]/10 flex items-center justify-center text-2xl border border-[#FF416C]/20">
                                                    🚨
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-white group-hover:text-[#FF416C] transition-colors line-clamp-1">"{event.detectedPhrase}"</div>
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">
                                                        <span>{new Date(event.timestamp).toLocaleDateString('tr-TR')}</span>
                                                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                        <span>{new Date(event.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-white/20 uppercase mb-1">Tespit Güveni</div>
                                                <div className={`text-xl font-black ${event.confidence > 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    %{Math.round(event.confidence * 100)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                                            <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Şube</p>
                                                <p className="text-xs font-bold text-white/80 flex items-center gap-2">
                                                    <span className="text-primary truncate">📍 {event.branch}</span>
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Personel</p>
                                                <p className="text-xs font-bold text-white/80 flex items-center gap-2">
                                                    <span className="truncate">👤 {event.staff}</span>
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Satış Kontrolü</p>
                                                <p className={`text-xs font-black ${event.hasSaleInLast5Min ? 'text-emerald-400' : 'text-[#FF416C]'}`}>
                                                    {event.hasSaleInLast5Min ? '✓ KAYITLI SATIŞ VAR' : '⚠️ SATIŞ KAYDI YOK!'}
                                                </p>
                                            </div>
                                            <div className="flex justify-end items-center">
                                                <button
                                                    onClick={() => {
                                                        clearSuspiciousEvents(event.id);
                                                        showSuccess('Başarılı', 'Olay kaydı temizlendi.');
                                                    }}
                                                    className="px-4 py-2 bg-white/5 hover:bg-emerald-500/20 rounded-lg text-[10px] font-black text-white/40 hover:text-emerald-400 transition-all border border-transparent hover:border-emerald-500/30"
                                                >
                                                    İNCELENDİ / KAPAT
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-white tracking-tight px-2">Bekleyen Onay Talepleri</h3>
                        <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-[10px] font-black text-amber-500 uppercase tracking-widest">
                            {pendingProducts.filter(p => p.status === 'pending').length} Talep Aktif
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pendingProducts.filter(p => p.status === 'pending').length === 0 ? (
                            <div className="col-span-full glass-card py-32 flex flex-col items-center justify-center text-white/10">
                                <span className="text-6xl mb-4">✨</span>
                                <p className="text-sm font-black uppercase tracking-widest">Tüm talepler işlendi.</p>
                            </div>
                        ) : (
                            pendingProducts.filter(p => p.status === 'pending').map((pending, idx) => (
                                <div key={pending.id} className="glass-card p-8 group border-t-4 border-t-amber-500/50 hover:border-t-amber-500 transition-all animate-in zoom-in-95 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex gap-5 items-center">
                                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl border border-amber-500/20 shadow-lg shadow-amber-500/5 group-hover:scale-110 transition-transform">
                                                📦
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors uppercase">{pending.productData.name}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Talep: {pending.requestedBy}</span>
                                                    <span className="text-[10px] font-bold text-white/40">{new Date(pending.requestedAt || "").toLocaleString('tr-TR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    approveProduct(pending.id);
                                                    showSuccess('Başarılı', 'Ürün kartı onaylandı.');
                                                }}
                                                className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20" title="Onayla">
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => {
                                                    rejectProduct(pending.id);
                                                    showError('Reddedildi', 'Talep reddedildi.');
                                                }}
                                                className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-red-500/20" title="Reddet">
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-6 gap-x-8 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">KOD / BARKOD</p>
                                            <p className="text-xs font-bold text-white">{pending.productData.code} <span className="text-white/30 ml-2">|</span> <span className="text-white/40 ml-2">{pending.productData.barcode || 'Yok'}</span></p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">KATEGORİ</p>
                                            <p className="text-xs font-bold text-white">{pending.productData.category} <span className="text-white/30 text-[10px] mx-2">➤</span> {pending.productData.type}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">FİYATLANDIRMA</p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] text-white/40 font-bold uppercase">ALIŞ</span>
                                                    <span className="text-sm font-black text-amber-500">₺ {Number(pending.productData.buyPrice).toLocaleString()}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] text-white/40 font-bold uppercase">SATIŞ</span>
                                                    <span className="text-sm font-black text-emerald-400">₺ {Number(pending.productData.price).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">STOK / MARKA</p>
                                            <p className="text-xs font-bold text-white">{pending.productData.stock} Adet <span className="text-white/30 ml-2">|</span> <span className="text-amber-500 ml-2">{pending.productData.brand || 'Belirsiz'}</span></p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
