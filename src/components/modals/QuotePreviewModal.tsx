"use client";

import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { createPortal } from 'react-dom';

interface QuotePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    quote: any;
    branches?: any[];
}

export default function QuotePreviewModal({ isOpen, onClose, quote, branches = [] }: QuotePreviewModalProps) {
    const [mounted, setMounted] = useState(false);
    const { appSettings } = useSettings();

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen || !quote || !mounted) return null;

    const items = Array.isArray(quote.items) ? quote.items : [];

    // Find branch details
    const branchName = quote.branch || 'Merkez';
    const branchInfo = branches.find(b => b.name === branchName) || branches.find(b => b.type === 'Merkez') || branches[0];

    const companyName = appSettings?.company_name || "MOTOROIL";
    const companySlogan = appSettings?.company_slogan || "Profesyonel Oto Servis ve Bakım";
    const address = branchInfo?.address || appSettings?.company_address || "İkitelli OSB, Dolapdere Sanayi Sitesi, 22. Ada No: 45 Başakşehir / İSTANBUL";
    const phone = branchInfo?.phone || appSettings?.company_phone || "+90 (212) 549 00 00";
    const email = appSettings?.company_email || "info@motoroil.com.tr";

    const handlePrint = () => {
        window.print();
    };

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-10 no-print">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-300">
                {/* MODAL HEADER */}
                <div className="flex-none p-6 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-xl">
                            📄
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Teklif Önizleme</h2>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{quote.quoteNo} • {formatDate(quote.date)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="btn btn-primary btn-sm rounded-xl">🖨️ Yazdır / PDF</button>
                        <button onClick={onClose} className="btn btn-square btn-ghost btn-sm rounded-xl text-white/50 hover:text-white hover:bg-white/10">✕</button>
                    </div>
                </div>

                {/* PREVIEW CONTENT */}
                <div className="flex-1 overflow-auto p-4 sm:p-10 custom-scrollbar bg-white">
                    {/* THIS SECTION IS DESIGNED TO LOOK LIKE A PRINTED DOCUMENT */}
                    <div className="print-section text-black font-sans max-w-[800px] mx-auto p-8 border border-gray-100 shadow-inner rounded-sm" id="printable-quote">
                        {/* COMPANY HEADER */}
                        <div className="flex justify-between items-start mb-10 border-b-2 border-primary pb-8">
                            <div>
                                <h1 className="text-4xl font-black text-primary tracking-tighter mb-1">{companyName}</h1>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{companySlogan}</p>
                                <div className="mt-4 text-[11px] text-gray-600 space-y-0.5 font-medium leading-relaxed">
                                    <p>{address}</p>
                                    <p>Tel: {phone}</p>
                                    <p>E-posta: {email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-black text-gray-900 border-b border-gray-100 pb-2 mb-4">TEKLİF</h2>
                                <div className="space-y-1.5">
                                    <div className="flex justify-end gap-3">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">No:</span>
                                        <span className="text-sm font-mono font-bold text-gray-900">{quote.quoteNo}</span>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Tarih:</span>
                                        <span className="text-sm font-bold text-gray-900">{formatDate(quote.date)}</span>
                                    </div>
                                    {quote.validUntil && (
                                        <div className="flex justify-end gap-3">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Geçerlilik:</span>
                                            <span className="text-sm font-bold text-red-600">{formatDate(quote.validUntil)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CUSTOMER INFO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">TEKLİF SUNULAN</h3>
                                <div className="space-y-1">
                                    <p className="text-lg font-black text-gray-900">{quote.customer?.name}</p>
                                    <p className="text-sm text-gray-600 font-medium">{quote.customer?.phone || '—'}</p>
                                    <p className="text-sm text-gray-600 font-medium">{quote.customer?.email || '—'}</p>
                                    {quote.customer?.address && (
                                        <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed italic">{quote.customer.address}</p>
                                    )}
                                </div>
                            </div>
                            {quote.description && (
                                <div className="p-6">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">ÖZEL NOTLAR</h3>
                                    <p className="text-sm text-gray-700 italic leading-relaxed whitespace-pre-wrap font-medium">
                                        {quote.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ITEMS TABLE */}
                        <table className="w-full mb-10 border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-900">
                                    <th className="py-4 px-2 text-left text-[10px] font-black uppercase text-gray-400">#</th>
                                    <th className="py-4 px-2 text-left text-[10px] font-black uppercase text-gray-900 tracking-widest w-1/2">Hizmet / Ürün Tanımı</th>
                                    <th className="py-4 px-2 text-center text-[10px] font-black uppercase text-gray-900 tracking-widest">Miktar</th>
                                    <th className="py-4 px-2 text-right text-[10px] font-black uppercase text-gray-900 tracking-widest">Birim Fiyat</th>
                                    <th className="py-4 px-2 text-right text-[10px] font-black uppercase text-gray-900 tracking-widest">KDV</th>
                                    <th className="py-4 px-2 text-right text-[10px] font-black uppercase text-gray-900 tracking-widest">Toplam</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item: any, idx: number) => {
                                    const lineTotal = Number(item.quantity) * Number(item.price);
                                    return (
                                        <tr key={idx}>
                                            <td className="py-4 px-2 text-xs font-mono text-gray-400">{idx + 1}</td>
                                            <td className="py-4 px-2 text-sm font-bold text-gray-900">{item.name}</td>
                                            <td className="py-4 px-2 text-center text-sm font-medium text-gray-600">{item.quantity}</td>
                                            <td className="py-4 px-2 text-right text-sm font-medium text-gray-600">{formatCurrency(Number(item.price))}</td>
                                            <td className="py-4 px-2 text-right text-xs font-medium text-gray-400">%{item.taxRate}</td>
                                            <td className="py-4 px-2 text-right text-sm font-black text-gray-900">{formatCurrency(lineTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* TOTALS */}
                        <div className="flex justify-end mb-20">
                            <div className="w-full max-w-[300px] space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                    <span>Ara Toplam</span>
                                    <span>{formatCurrency(Number(quote.totalAmount) - Number(quote.taxAmount))}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-gray-500 border-b border-gray-100 pb-3">
                                    <span>Toplam KDV</span>
                                    <span>{formatCurrency(Number(quote.taxAmount))}</span>
                                </div>
                                <div className="flex justify-between items-center px-4 py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Genel Toplam</span>
                                    <span className="text-xl font-black">{formatCurrency(Number(quote.totalAmount))}</span>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="grid grid-cols-2 gap-10 text-[10px] text-gray-400 font-bold uppercase tracking-widest border-t border-gray-100 pt-10">
                            <div>
                                <p className="mb-8">Müşteri Onayı</p>
                                <div className="w-48 h-[1px] bg-gray-200"></div>
                            </div>
                            <div className="text-right">
                                <p className="mb-8">{companyName} Servis Yetkilisi</p>
                                <div className="w-48 h-[1px] bg-gray-200 ml-auto"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    .print-section { 
                        box-shadow: none !important; 
                        border: none !important; 
                        width: 100% !important; 
                        max-width: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>,
        document.body
    );
}
