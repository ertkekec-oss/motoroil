"use client";

import React from 'react';

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
}

export default function TransactionDetailModal({ isOpen, onClose, transaction }: TransactionDetailModalProps) {
    if (!isOpen || !transaction) return null;

    const items = transaction.items || [];
    const isManual = items.length === 0;
    
    // Güvenli Tutar Formatı
    const safeAmount = Number(transaction.amount || transaction.totalAmount || 0);

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                    <h3 className="text-[16px] font-black text-slate-800 dark:text-white flex items-center gap-2">
                        📄 İşlem Detayı
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-[12px] border border-slate-100 dark:border-white/5">
                            <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 block mb-1">İŞLEM TARİHİ</label>
                            <div className="text-[13px] font-bold text-slate-800 dark:text-white">{transaction.date || transaction.invoiceDate || '-'}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-[12px] border border-slate-100 dark:border-white/5">
                            <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 block mb-1">FATURA / REF NO</label>
                            <div className="text-[13px] font-bold text-slate-800 dark:text-white">{transaction.method || transaction.invoiceNo || transaction.desc?.split('-')?.[0]?.trim() || '-'}</div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 block mb-1.5 px-1">AÇIKLAMA</label>
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-[12px] border border-slate-100 dark:border-white/5 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                            {transaction.desc || transaction.description || '-'}
                        </div>
                    </div>

                    {isManual ? (
                        <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[16px] border border-slate-100 dark:border-white/5 flex flex-col items-center">
                            <p className="text-[12px] font-bold text-slate-500 mb-2">Bu işlem manuel tutar girişi olarak kaydedilmiştir.</p>
                            <div className="text-[28px] font-black tracking-tight" style={{ color: safeAmount < 0 ? '#ef4444' : '#10b981' }}>
                                {Math.abs(safeAmount).toLocaleString('tr-TR')} ₺
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-800 dark:text-white mb-3">Ürün Kalemleri</h4>
                            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto custom-scroll pr-2">
                                {items?.map((item: any, idx: number) => {
                                    const parsedPrice = Number(item.price || 0);
                                    const parsedQty = Number(item.qty || 1);
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-[10px] border border-slate-100 dark:border-white/5">
                                            <div className="flex flex-col">
                                                <div className="text-[13px] font-bold text-slate-800 dark:text-white">{item.name || 'İsimsiz Ürün'}</div>
                                                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{parsedQty} adet x {parsedPrice.toLocaleString('tr-TR')} ₺</div>
                                            </div>
                                            <div className="text-[13px] font-black text-slate-800 dark:text-white">{(parsedQty * parsedPrice).toLocaleString('tr-TR')} ₺</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-between mt-4 p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-[12px] border border-slate-700">
                                <span className="text-[11px] font-black tracking-widest uppercase">TOPLAM TUTAR</span>
                                <span className="text-[20px] font-black" style={{ color: safeAmount < 0 ? '#ef4444' : '#10b981' }}>
                                    {Math.abs(safeAmount).toLocaleString('tr-TR')} ₺
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-8 h-[42px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-[10px] font-bold text-[13px] transition-colors shadow-sm"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
}
