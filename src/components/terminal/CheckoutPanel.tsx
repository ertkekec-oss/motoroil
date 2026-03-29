import React, { useState } from 'react';
import { CreditCard, Banknote, Landmark, ArrowRight, User, Clock, Gift } from 'lucide-react';

export default function CheckoutPanel({
    cart, subtotal, finalTotal, vatExcludedTotal, totalDiscount,
    selectedCustomer, customers, activePriceListName, setIsCustomerModalOpen,
    paymentMode, setPaymentMode, handleFinalize, handleSuspend, isProcessing, isOnline,
    applicableCampaigns, computedCampaignDiscount, computedPromoItems, computedEarnedPoints
}: any) {

    return (
        <div className="w-full bg-surface-secondary dark:bg-[#0f172a] border border-default dark:border-white/10 rounded-2xl p-4 lg:p-6 flex flex-col shadow-enterprise flex-1 min-h-0 overflow-hidden">
            <h2 className="text-[10px] font-black opacity-40 mb-4 tracking-widest text-center shrink-0 uppercase">SATIŞ ÖZETİ</h2>

            <div className="flex-1 overflow-y-auto pr-0 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Customer Select */}
                <div>
                    <label className="text-[10px] font-bold opacity-50 block mb-2 uppercase tracking-widest">Müşteri / Cari</label>
                    <div
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="flex justify-between items-center bg-surface dark:bg-slate-900 p-3 lg:p-4 rounded-xl border border-default dark:border-white/5 cursor-pointer hover:border-primary/40 dark:hover:border-indigo-500/30 transition-all shadow-enterprise group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {selectedCustomer === 'Perakende Müşteri' ? <User size={16} /> : selectedCustomer.charAt(0)}
                            </div>
                            <span className="font-bold text-sm truncate max-w-[180px] text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {selectedCustomer}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-[10px] text-[#2563EB] font-bold tracking-tighter">F8 / SEÇ</div>
                            {activePriceListName && (
                                <div className="text-[9px] text-indigo-600 mt-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 uppercase font-bold dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300">
                                    {activePriceListName}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Totals */}
                <div className="space-y-3 bg-surface dark:bg-slate-900/50 p-4 rounded-xl border border-muted dark:border-white/5 shadow-enterprise">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Ara Toplam</span>
                        <span>₺{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <span>İndirim</span>
                            <span>-₺{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>KDV Hariç Tutar</span>
                        <span>₺{vatExcludedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 px-3 bg-state-alert-bg dark:bg-rose-950/20 border-t border-default dark:border-white/10 mt-2 rounded-lg">
                        <span className="font-bold text-sm text-text-primary dark:text-slate-200">GENEL TOPLAM</span>
                        <span className="text-3xl font-black text-state-alert-text dark:text-rose-400 tracking-tight">₺{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Smart Cashier Assistant (Campaigns Summary) */}
                {(computedCampaignDiscount > 0 || computedEarnedPoints > 0 || (computedPromoItems && computedPromoItems.length > 0)) && (
                    <div className="relative overflow-hidden bg-surface-tertiary dark:from-indigo-900/40 dark:via-purple-900/20 dark:to-rose-900/30 p-4 rounded-xl border border-default dark:border-indigo-400/20 shadow-inner group">
                        <div className="relative text-[10px] font-black text-[#111827] dark:text-indigo-300 mb-3 uppercase tracking-widest flex items-center gap-1.5">
                            <div className="p-1.5 bg-[#2563EB] text-white rounded-md shadow-sm">
                                <Gift size={12} className="animate-pulse" />
                            </div>
                            Akıllı Kasiyer Kazanımları
                        </div>
                        <div className="relative space-y-2.5 text-xs">
                            {computedCampaignDiscount > 0 && (
                                <div className="flex justify-between items-center font-bold text-state-success-text dark:text-emerald-400 bg-surface/60 dark:bg-slate-900/60 p-2 rounded-lg border border-white/20 dark:border-white/5 backdrop-blur-sm">
                                    <span className="flex items-center gap-1.5">🎁 Ödeme İndirimi</span>
                                    <span className="text-sm">-₺{computedCampaignDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {computedEarnedPoints > 0 && (
                                <div className="flex justify-between items-center font-bold text-amber-700 dark:text-amber-400 bg-surface/60 dark:bg-slate-900/60 p-2 rounded-lg border border-white/20 dark:border-white/5 backdrop-blur-sm">
                                    <span className="flex items-center gap-1.5">💎 Kazanılan Parapuan</span>
                                    <span className="text-sm">+{computedEarnedPoints.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {computedPromoItems?.map((pItem: any, i: number) => (
                                <div key={i} className="flex justify-between items-center font-bold text-primary dark:text-blue-400 bg-surface/60 dark:bg-slate-900/60 p-2 rounded-lg border border-white/20 dark:border-white/5 backdrop-blur-sm">
                                    <span className="truncate pr-2 flex items-center gap-1.5 w-full">✨ <span className="truncate">{pItem.qty}x {pItem.campName}</span></span>
                                    <span className="shrink-0 text-[10px] uppercase bg-state-info-bg dark:bg-blue-500/20 px-2 py-0.5 rounded text-state-info-text dark:text-blue-300">BEDELSİZ</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Methods */}
                <div>
                    <label className="text-[10px] font-bold opacity-50 block mb-2 uppercase tracking-widest">ÖDEME YÖNTEMİ</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setPaymentMode('cash')}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-xs lg:text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-[#0f172a] ${paymentMode === 'cash'
                                ? 'bg-primary border-primary text-white dark:bg-indigo-500 dark:border-indigo-500'
                                : 'bg-surface dark:bg-slate-800 border-default dark:border-white/5 text-text-secondary dark:text-slate-300 hover:border-border-strong dark:hover:border-white/20'
                                }`}
                        >
                            <Banknote size={16} /> Nakit <span className="text-[9px] opacity-60 ml-auto hidden xl:inline-block">F11</span>
                        </button>
                        <button
                            onClick={() => setPaymentMode('card')}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-xs lg:text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-[#0f172a] ${paymentMode === 'card'
                                ? 'bg-primary border-primary text-white dark:bg-indigo-500 dark:border-indigo-500'
                                : 'bg-surface dark:bg-slate-800 border-default dark:border-white/5 text-text-secondary dark:text-slate-300 hover:border-border-strong dark:hover:border-white/20'
                                }`}
                        >
                            <CreditCard size={16} /> Kredi Kartı <span className="text-[9px] opacity-60 ml-auto hidden xl:inline-block">F12</span>
                        </button>
                        <button
                            onClick={() => setPaymentMode('transfer')}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-xs lg:text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-[#0f172a] ${paymentMode === 'transfer'
                                ? 'bg-primary border-primary text-white dark:bg-indigo-500 dark:border-indigo-500'
                                : 'bg-surface dark:bg-slate-800 border-default dark:border-white/5 text-text-secondary dark:text-slate-300 hover:border-border-strong dark:hover:border-white/20'
                                }`}
                        >
                            <Landmark size={16} /> Havale/EFT
                        </button>
                        <button
                            disabled={selectedCustomer === 'Perakende Müşteri'}
                            onClick={() => setPaymentMode('account')}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-xs lg:text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-[#0f172a] ${selectedCustomer === 'Perakende Müşteri'
                                ? 'bg-sidebar-bg dark:bg-slate-900 border-default dark:border-white/5 text-text-disabled dark:text-slate-600 cursor-not-allowed'
                                : paymentMode === 'account'
                                    ? 'bg-primary border-primary text-white dark:bg-indigo-500 dark:border-indigo-500'
                                    : 'bg-surface dark:bg-slate-800 border-default dark:border-white/5 text-text-secondary dark:text-slate-300 hover:border-border-strong dark:hover:border-white/20'
                                }`}
                            title={selectedCustomer === 'Perakende Müşteri' ? 'Müşteri seçilmeli' : ''}
                        >
                            Açık Hesap (Veresiye)
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10 shrink-0 space-y-3">
                <button
                    onClick={handleSuspend}
                    disabled={isProcessing || cart.length === 0}
                    className="w-full h-12 rounded-xl font-bold border-2 border-amber-500/20 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-sm flex items-center justify-center gap-2 transition-all"
                >
                    <Clock size={16} /> BEKLEMEYE AL
                </button>
                <button
                    onClick={handleFinalize}
                    disabled={isProcessing || cart.length === 0}
                    className={`w-full h-16 rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 transition-all shadow-md focus:ring-4 focus:ring-offset-2 focus:ring-state-alert-text/50 dark:focus:ring-offset-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed ${cart.length > 0
                        ? (!isOnline
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                            : 'bg-state-alert-text hover:bg-rose-700 text-white shadow-state-alert-text/20'
                        )
                        : 'bg-action-secondary-bg dark:bg-slate-800 text-text-disabled dark:text-slate-500 shadow-none'
                        }`}
                >
                    {isProcessing ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>İŞLENİYOR...</span>
                        </>
                    ) : (
                        <>
                            <span>{isOnline ? 'ÖDEMEYİ TAMAMLA' : 'OFFLINE İŞLEME AL'}</span>
                            <ArrowRight size={20} strokeWidth={2.5} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
