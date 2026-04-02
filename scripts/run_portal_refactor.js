const fs = require('fs');

// 1. Write the new ApprovalClient.tsx
const clientCode = `"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ApprovalClient({ orderId, data }: { orderId: string, data: any }) {
    const [actionStatus, setActionStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>(data.status === 'WAITING_APPROVAL' || data.status === 'PENDING' ? 'PENDING' : data.status === 'CANCELLED' ? 'REJECTED' : 'APPROVED');
    const [loading, setLoading] = useState(false);

    const totalAmount = data.items.reduce((sum: number, item: any) => sum + Number(item.totalPrice), 0);
    const taxAmount = 0; // Tax is inside totalAmount or not calculated here. Using order.totalAmount
    const finalAmount = Number(data.totalAmount || totalAmount);

    const handleAction = async (status: 'IN_PROGRESS' | 'CANCELLED') => {
        setLoading(true);
        try {
            const res = await fetch(\`/api/services/work-orders/\${orderId}\`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setActionStatus(status === 'IN_PROGRESS' ? 'APPROVED' : 'REJECTED');
            }
        } finally {
            setLoading(false);
        }
    };

    if (actionStatus !== 'PENDING') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans space-y-6">
                <div className={\`w-24 h-24 rounded-full flex items-center justify-center border-[6px] \${
                    actionStatus === 'APPROVED' ? 'border-emerald-100 bg-emerald-50 text-emerald-500' : 'border-rose-100 bg-rose-50 text-rose-500'
                }\`}>
                    {actionStatus === 'APPROVED' ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {actionStatus === 'APPROVED' ? 'Servis Talebi Onaylandı' : 'Talebi Reddettiniz'}
                </h1>
                <p className="text-slate-500 font-medium max-w-md">
                    {actionStatus === 'APPROVED' ? 'Müşteri onayı sisteme isledi. Ustalarımız hemen işlemlere başlıyor.' : 'Servis işlemi durduruldu ve fiş iptal edildi.'}
                </p>
                <button className="text-sm font-bold text-slate-500 mt-4 px-4 py-2 border rounded-full" onClick={() => window.close()}>Sekmeyi Kapat</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4 font-sans">
            <div className="max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-1">{data.companyName}</h1>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">DİJİTAL ONAY FORMU</h2>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
                    {/* Hero Strip */}
                    <div className="bg-slate-900 p-6 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-xl rounded-full" />
                        <span className="bg-white/10 text-[10px] font-bold px-2.5 py-1 rounded-full text-indigo-200">#{orderId.split('-')[0].slice(-6).toUpperCase()}</span>
                        <h3 className="mt-4 text-xl sm:text-2xl font-black leading-tight flex items-center justify-between">
                            {data.assetTitle}
                        </h3>
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-2">Müşteri: {data.customerName}</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Complaint */}
                        <div className="bg-slate-50 p-4 rounded-xl ring-1 ring-slate-100 border border-slate-200 shadow-sm border-l-4 border-l-amber-400">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Onarıma Neden Olan Şikayet</span>
                            <p className="text-sm font-semibold text-slate-700 leading-snug">{data.complaint || "Belirtilmedi"}</p>
                        </div>

                        {data.technicianNotes && (
                        <div className="bg-blue-50/50 p-4 rounded-xl ring-1 ring-blue-100 border border-blue-200 shadow-sm border-l-4 border-l-blue-400">
                            <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 block mb-1">Uzman Notu (Teşhis)</span>
                            <p className="text-sm font-semibold text-slate-700 leading-snug whitespace-pre-wrap">{data.technicianNotes}</p>
                        </div>
                        )}

                        {/* Items */}
                        <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Planlanan İşlemler ve Tutarlar</h4>
                            <div className="space-y-4">
                                {data.items.length === 0 && <span className="text-xs text-slate-500">İşlem kalemi eklenmemiş.</span>}
                                {data.items.map((item:any) => (
                                    <div key={item.id} className="flex justify-between items-start border-b border-slate-50 border-dashed pb-3 last:border-0 last:pb-0">
                                        <div className="max-w-[70%]">
                                            <p className="text-[13px] font-bold text-slate-800 leading-tight">{item.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest text-indigo-600/80">{item.type === 'LABOR' ? 'İşçilik' : 'Yedek Parça'} • {Number(item.quantity)} Adet</p>
                                        </div>
                                        <div className="text-sm font-black text-slate-900 shrink-0">
                                            {Number(item.totalPrice).toLocaleString('tr-TR')} <span className="text-xs">₺</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total Matrix */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-black text-indigo-900 tracking-tight">GENEL TOPLAM</span>
                                <span className="text-2xl font-black text-indigo-600">{finalAmount.toLocaleString('tr-TR')} <span className="text-base text-indigo-400">₺</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="pt-2 flex flex-col gap-3">
                    <button 
                        disabled={loading}
                        onClick={() => handleAction('IN_PROGRESS')} 
                        className="w-full bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] py-4 rounded-xl text-white font-black uppercase text-[15px] tracking-widest shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'İşleniyor...' : 'TUTARI ONAYLIYORUM'}
                    </button>
                    <button 
                        disabled={loading}
                        onClick={() => handleAction('CANCELLED')}
                        className="w-full bg-white hover:bg-rose-50 py-3 rounded-xl text-rose-500 font-black uppercase text-xs tracking-widest border border-rose-200 transition-all font-sans disabled:opacity-50"
                    >
                        TUTARI REDDEDİYORUM
                    </button>
                </div>

                <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-6">
                    Müşteri IP Onay Kayıt Altına Alınmaktadır • {new Date(data.date).toLocaleDateString('tr-TR')}
                </p>
            </div>
        </div>
    );
}
`;
fs.writeFileSync('c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/p/approval/[id]/ApprovalClient.tsx', clientCode, 'utf8');

// 2. Rewrite page.tsx as a Server Component
const pageCode = `import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ApprovalClient from './ApprovalClient';

export default async function ApprovalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const order = await prisma.serviceOrder.findUnique({
        where: { id },
        include: { customer: true, asset: true, company: true, items: true }
    });

    if (!order) {
        return notFound();
    }

    const data = {
        companyName: order.company.name,
        customerName: order.customer.name,
        phone: order.customer.phone,
        complaint: order.complaint,
        technicianNotes: order.technicianNotes,
        assetTitle: order.asset ? \`\${order.asset.brand} - \${order.asset.primaryIdentifier}\` : 'Genel Servis Bakımı',
        date: order.createdAt,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items
    };

    return <ApprovalClient orderId={id} data={data} />;
}
`;
fs.writeFileSync('c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/p/approval/[id]/page.tsx', pageCode, 'utf8');

console.log("Replaced approval portal UI");
