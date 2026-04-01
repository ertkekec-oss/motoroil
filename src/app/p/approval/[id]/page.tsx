"use client";

import React, { useState } from "react";

// MOCK DATA for layout tests
const APPROVAL_DATA = {
    id: "SRO-8002",
    companyName: "Periodya Motors Center",
    phone: "0850 333 22 11",
    complaint: "Motor Yağ Kaçağı ve Soğutma Fanı Çalışmıyor",
    assetTitle: "34 ABC 212 - Yamaha Tracer 900",
    date: "01.04.2026",
    technician: "Yalçın Usta",
    items: [
        { id: 1, name: "Yamalube 10W-40 Tam Sentetik Motor Yağı", quantity: 3, unitPrice: 450, total: 1350 },
        { id: 2, name: "Orijinal Yağ Filtresi", quantity: 1, unitPrice: 320, total: 320 },
        { id: 3, name: "Periyodik Bakım ve Fan Tespiti İşçiliği", quantity: 1, unitPrice: 1500, total: 1500 },
        { id: 4, name: "Radyatör Kaynağı (Dış Servis Bedeli)", quantity: 1, unitPrice: 850, total: 850 },
    ]
};

export default function MobileApprovalPortal({ params }: { params: { id: string } }) {
    const [actionStatus, setActionStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    const totalAmount = APPROVAL_DATA.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = totalAmount * 0.20;
    const finalAmount = totalAmount + taxAmount;

    if (actionStatus !== 'PENDING') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans space-y-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-[6px] ${
                    actionStatus === 'APPROVED' ? 'border-emerald-100 bg-emerald-50 text-emerald-500' : 'border-rose-100 bg-rose-50 text-rose-500'
                }`}>
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        {actionStatus === 'APPROVED' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        )}
                    </svg>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {actionStatus === 'APPROVED' ? 'Servis Talebi Onaylandı' : 'Talebi Reddettiniz'}
                </h1>
                <p className="text-slate-500 font-medium">
                    {actionStatus === 'APPROVED' ? 'Ustalarımız hemen işlemlere başlıyor. Çayımızı içmeye bekleriz.' : 'İşlemi durdurduk. Ustanız sizinle iletişime geçecek.'}
                </p>
                <button className="text-sm font-bold text-indigo-600 outline-none" onClick={() => window.close()}>Sekmeyi Kapat</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4 font-sans">
            <div className="max-w-md mx-auto space-y-4">
                
                {/* Header (Company Identity) */}
                <div className="text-center mb-6">
                    <h1 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-1">{APPROVAL_DATA.companyName}</h1>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">DİJİTAL ONAY FORMU</h2>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
                    {/* Hero Strip */}
                    <div className="bg-slate-900 p-6 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-xl rounded-full" />
                        <span className="bg-white/10 text-[10px] font-bold px-2.5 py-1 rounded-full text-indigo-200">{APPROVAL_DATA.id}</span>
                        <h3 className="mt-4 text-2xl font-black leading-tight">{APPROVAL_DATA.assetTitle}</h3>
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-2">Teknisyen: {APPROVAL_DATA.technician}</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Teşhis */}
                        <div className="bg-slate-50 p-4 rounded-xl ring-1 ring-slate-100 border border-slate-200/60 shadow-sm border-l-4 border-l-amber-400">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Onarıma Neden Olan Şikayet</span>
                            <p className="text-sm font-semibold text-slate-700 leading-snug">{APPROVAL_DATA.complaint}</p>
                        </div>

                        {/* Kalemler */}
                        <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Yapılacak İşlemler Olarak Planlandı</h4>
                            <div className="space-y-4">
                                {APPROVAL_DATA.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-start border-b border-slate-50 border-dashed pb-3 last:border-0 last:pb-0">
                                        <div className="max-w-[70%]">
                                            <p className="text-sm font-bold text-slate-700 leading-tight">{item.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.quantity} Adet / {item.unitPrice.toLocaleString()} ₺</p>
                                        </div>
                                        <div className="text-sm font-black text-slate-900 shrink-0">
                                            {item.total.toLocaleString()} <span className="text-xs">₺</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Toplam Matris */}
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                <span>Ara Toplam Parça+İşçilik</span>
                                <span>{totalAmount.toLocaleString()} ₺</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                <span>KDV (20%)</span>
                                <span>{taxAmount.toLocaleString()} ₺</span>
                            </div>
                            <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between items-center">
                                <span className="text-sm font-black text-indigo-900 tracking-tight">ÖDENECEK TUTAR</span>
                                <span className="text-2xl font-black text-indigo-600">{finalAmount.toLocaleString()} <span className="text-base text-indigo-400">₺</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Butonlar */}
                <div className="pt-4 flex flex-col gap-3">
                    <button 
                        onClick={() => setActionStatus('APPROVED')} 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 py-4 rounded-2xl text-white font-black uppercase text-base tracking-widest shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all flex justify-center items-center gap-2"
                    >
                        TUTARI ONAYLIYORUM
                    </button>
                    <button 
                        onClick={() => setActionStatus('REJECTED')}
                        className="w-full bg-white hover:bg-rose-50 py-3 rounded-2xl text-rose-500 font-black uppercase text-xs tracking-widest border border-rose-200 transition-all font-sans"
                    >
                        TUTARI REDDEDİYORUM
                    </button>
                </div>

                <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-6">
                    Müşteri IP: 195.42.0.1 • Dijital İmzalanmıştır {APPROVAL_DATA.date}
                </p>
            </div>
        </div>
    );
}
