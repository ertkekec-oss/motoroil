import React, { useState } from 'react';
import { CreditCard, Banknote, Landmark, ArrowRight, User, Clock, Gift } from 'lucide-react';

export default function CheckoutPanel({
    cart, subtotal, finalTotal, vatExcludedTotal, totalDiscount,
    selectedCustomer, customers, activePriceListName, setIsCustomerModalOpen,
    paymentMode, setPaymentMode, handleFinalize, handleSuspend, isProcessing, isOnline,
    applicableCampaigns, computedCampaignDiscount, computedPromoItems, computedEarnedPoints
}: any) {

    return (
        <div className="w-full bg-white dark:bg-[#0f172a] rounded-2xl p-4 lg:p-5 flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm border border-slate-200/60 dark:border-white/10">
            <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 pb-4 tracking-widest text-center shrink-0 uppercase">SATIŞ ÖZETİ</h2>

            <div className="flex-1 overflow-y-auto space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Customer Select */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-widest px-1">Müşteri / Cari</label>
                    <div
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 lg:p-4 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white shadow-sm dark:bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                                {selectedCustomer === 'Perakende Müşteri' ? <User size={16} /> : selectedCustomer.charAt(0)}
                            </div>
                            <span className="font-bold text-[13px] truncate max-w-[180px] text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {selectedCustomer}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-[9px] text-indigo-600/60 font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">SEÇ</div>
                            {activePriceListName && (
                                <div className="text-[9px] text-indigo-600 mt-1 bg-white shadow-sm px-2 py-0.5 rounded-md uppercase font-bold dark:bg-indigo-500/20 dark:text-indigo-300">
                                    {activePriceListName}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Totals */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl">
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
                    <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-200 dark:border-white/5">
                        <span className="font-bold text-[13px] text-slate-800 dark:text-slate-200 mt-1">GENEL TOPLAM</span>
                        <span className="text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight mt-1">₺{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Smart Cashier Assistant (Campaigns Summary) */}
                {(computedCampaignDiscount > 0 || computedEarnedPoints > 0 || (computedPromoItems && computedPromoItems.length > 0)) && (
                    <div className="relative overflow-hidden bg-surface-tertiary dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-rose-900/10 p-4 rounded-[14px] shadow-sm group">
                        <div className="relative text-[9px] font-bold text-indigo-600/80 dark:text-indigo-300 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                            <Gift size={10} className="animate-pulse" />
                            Akıllı Kasiyer Kazanımları
                        </div>
                        <div className="relative space-y-1.5 text-[11px]">
                            {computedCampaignDiscount > 0 && (
                                <div className="flex justify-between items-center font-bold text-state-success-text dark:text-emerald-400 bg-surface/60 dark:bg-slate-900/60 p-2 rounded-lg backdrop-blur-sm">
                                    <span>🎁 Ödeme İndirimi</span>
                                    <span>-₺{computedCampaignDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {computedEarnedPoints > 0 && (
                                <div className="flex justify-between items-center font-bold text-amber-700 dark:text-amber-400 bg-surface/60 dark:bg-slate-900/60 p-2 rounded-lg backdrop-blur-sm">
                                    <span>💎 Kazanç Puanı</span>
                                    <span>+{computedEarnedPoints.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {computedPromoItems?.map((pItem: any, i: number) => (
                                <div key={i} className="flex justify-between items-center font-bold text-primary dark:text-blue-400 bg-surface/60 dark:bg-slate-900/60 p-2 rounded-lg backdrop-blur-sm">
                                    <span className="truncate pr-2 w-full">✨ {pItem.qty}x {pItem.campName}</span>
                                    <span className="shrink-0 text-[9px] uppercase bg-state-info-bg dark:bg-blue-500/20 px-1.5 py-0.5 rounded text-state-info-text dark:text-blue-300">BEDELSİZ</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Methods */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-widest px-1">ÖDEME YÖNTEMİ</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setPaymentMode('cash')}
                            className={`px-3 py-2.5 rounded-xl flex flex-row items-center justify-center gap-2 transition-all text-[11px] font-bold outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 dark:focus:ring-offset-[#0f172a] ${paymentMode === 'cash'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 dark:bg-indigo-500'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Banknote size={14} /> Nakit
                        </button>
                        <button
                            onClick={() => setPaymentMode('card')}
                            className={`px-3 py-2.5 rounded-xl flex flex-row items-center justify-center gap-2 transition-all text-[11px] font-bold outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 dark:focus:ring-offset-[#0f172a] ${paymentMode === 'card'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 dark:bg-indigo-500'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <CreditCard size={14} /> Kredi Kartı
                        </button>
                        <button
                            onClick={() => setPaymentMode('transfer')}
                            className={`px-3 py-2.5 rounded-xl flex flex-row items-center justify-center gap-2 transition-all text-[11px] font-bold outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 dark:focus:ring-offset-[#0f172a] ${paymentMode === 'transfer'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 dark:bg-indigo-500'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Landmark size={14} /> Havale
                        </button>
                        <button
                            disabled={selectedCustomer === 'Perakende Müşteri'}
                            onClick={() => setPaymentMode('account')}
                            className={`px-3 py-2.5 rounded-xl flex flex-row items-center justify-center gap-2 transition-all text-[11px] font-bold outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 dark:focus:ring-offset-[#0f172a] ${selectedCustomer === 'Perakende Müşteri'
                                ? 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-700 cursor-not-allowed'
                                : paymentMode === 'account'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 dark:bg-indigo-500'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            title={selectedCustomer === 'Perakende Müşteri' ? 'Müşteri seçilmeli' : ''}
                        >
                            Açık Hesap
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-white/5 shrink-0 space-y-3">
                <button
                    onClick={handleSuspend}
                    disabled={isProcessing || cart.length === 0}
                    className={`w-full h-12 rounded-xl font-bold border-2 border-amber-500/20 text-sm flex items-center justify-center gap-2 transition-all ${cart.length === 0 ? 'bg-slate-50 text-slate-400 border-transparent dark:bg-slate-900 dark:text-slate-600' : 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 shadow-sm'}`}
                >
                    <Clock size={16} /> BEKLEMEYE AL
                </button>
                <button
                    onClick={handleFinalize}
                    disabled={isProcessing || cart.length === 0}
                    className={`w-full h-16 rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 transition-all shadow-md focus:ring-4 focus:ring-offset-2 focus:ring-indigo-600/50 dark:focus:ring-offset-[#0f172a] disabled:cursor-not-allowed ${cart.length > 0
                        ? (!isOnline
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                        )
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 shadow-none'
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
