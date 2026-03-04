import React, { useState } from 'react';
import { CreditCard, Banknote, Landmark, ArrowRight, User, Clock } from 'lucide-react';

export default function CheckoutPanel({
    cart, subtotal, finalTotal, vatExcludedTotal, totalDiscount,
    selectedCustomer, customers, activePriceListName, setIsCustomerModalOpen,
    paymentMode, setPaymentMode, handleFinalize, handleSuspend, isProcessing, isOnline
}: any) {

    return (
        <div className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col shadow-sm flex-1 min-h-0 overflow-hidden">
            <h2 className="text-[10px] font-black opacity-40 mb-6 tracking-widest text-center shrink-0 uppercase">SATIŞ ÖZETİ</h2>

            <div className="flex-1 overflow-y-auto pr-0 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Customer Select */}
                <div>
                    <label className="text-[10px] font-bold opacity-50 block mb-2 uppercase tracking-widest">Müşteri / Cari</label>
                    <div
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all shadow-sm group"
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
                            <div className="text-[10px] text-indigo-500 font-bold tracking-tighter">F8 / SEÇ</div>
                            {activePriceListName && (
                                <div className="text-[9px] text-indigo-600 mt-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 uppercase font-bold dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300">
                                    {activePriceListName}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Totals */}
                <div className="space-y-3 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Ara Toplam</span>
                        <span>₺{subtotal.toLocaleString()}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <span>İndirim</span>
                            <span>-₺{totalDiscount.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>KDV Hariç Tutar</span>
                        <span>₺{vatExcludedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-end pt-3 border-t border-slate-100 dark:border-white/10 mt-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">GENEL TOPLAM</span>
                        <span className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">₺{finalTotal.toLocaleString()}</span>
                    </div>
                </div>

                {/* Payment Methods */}
                <div>
                    <label className="text-[10px] font-bold opacity-50 block mb-2 uppercase tracking-widest">ÖDEME YÖNTEMİ</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setPaymentMode('cash')}
                            className={`p-4 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-[#0f172a] ${paymentMode === 'cash'
                                ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                                }`}
                        >
                            <Banknote size={18} /> Nakit <span className="text-[9px] opacity-60 ml-auto hidden sm:inline-block">F11</span>
                        </button>
                        <button
                            onClick={() => setPaymentMode('card')}
                            className={`p-4 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-[#0f172a] ${paymentMode === 'card'
                                ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                                }`}
                        >
                            <CreditCard size={18} /> Kredi Kartı <span className="text-[9px] opacity-60 ml-auto hidden sm:inline-block">F12</span>
                        </button>
                        <button
                            onClick={() => setPaymentMode('transfer')}
                            className={`p-4 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-[#0f172a] ${paymentMode === 'transfer'
                                ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                                }`}
                        >
                            <Landmark size={18} /> Havale/EFT
                        </button>
                        <button
                            disabled={selectedCustomer === 'Perakende Müşteri'}
                            onClick={() => setPaymentMode('account')}
                            className={`p-4 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-[#0f172a] ${selectedCustomer === 'Perakende Müşteri'
                                ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : paymentMode === 'account'
                                    ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
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
                    className={`w-full h-16 rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 transition-all shadow-md focus:ring-4 focus:ring-offset-2 focus:ring-rose-500/50 dark:focus:ring-offset-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed ${cart.length > 0
                        ? (!isOnline
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                        )
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-none'
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
