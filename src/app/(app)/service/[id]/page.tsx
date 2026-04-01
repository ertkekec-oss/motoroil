"use client";

import React, { useState, useEffect } from "react";
import { 
    EnterpriseSectionHeader, 
    EnterpriseButton, 
    EnterpriseCard
} from "@/components/ui/enterprise";
import { 
    IconWrench, 
    IconCheck, 
    IconAlertCircle, 
    IconActivity,
    IconSave,
    IconPrinter,
    IconFileText,
    IconSettings,
    IconCornerUpRight
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

const WORKFLOW = [
    { id: 'PENDING', label: 'Kabul' },
    { id: 'IN_PROGRESS', label: 'İşlemde' },
    { id: 'WAITING_APPROVAL', label: 'Onay Bekliyor' },
    { id: 'READY', label: 'Faturalanacak' },
];

export default function ServiceOrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [status, setStatus] = useState('PENDING');
    const [items, setItems] = useState<any[]>([]);
    const [orderData, setOrderData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!params || !params.id || params.id === 'new') return; // 'new' is handled by different page
        fetch(`/api/service-v2/${params.id}`)
            .then(res => res.json())
            .then(data => {
                if(data.success && data.order) {
                    setOrderData(data.order);
                    setStatus(data.order.status || 'PENDING');
                    setItems(data.order.items || []);
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [params.id]);

    const handleStatusUpdate = async (newStatus: string) => {
        setStatus(newStatus);
        await fetch(`/api/service-v2/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse font-bold text-slate-500">YÜKLENİYOR...</div>;
    if (!orderData) return <div className="p-10 text-center font-bold text-slate-500">Maaalesef iş emri bulunamadı.</div>;

    const totalAmount = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
    const taxAmount = totalAmount * 0.20;
    const finalAmount = totalAmount + taxAmount;

    return (
        <div className="max-w-[1400px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700 pb-40">
            <EnterpriseSectionHeader 
                title={`İŞ EMRİ: ${orderData.id.slice(0,8).toUpperCase()}`} 
                subtitle={`${orderData.asset?.brand || ''} ${orderData.asset?.model || ''} • ${orderData.customer?.name || ''}`}
                icon={<IconWrench />}
                rightElement={
                    <div className="flex gap-3 relative z-20">
                        <EnterpriseButton variant="secondary" className="flex items-center gap-2 bg-white rounded-xl">
                            <IconPrinter className="w-4 h-4 text-slate-500" /> Servis Fişi Yazdır
                        </EnterpriseButton>
                        <EnterpriseButton 
                            variant="primary" 
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl"
                            onClick={() => alert('Müşteri Ekstre Hesabına Fatura İşlendi')}
                        >
                            <IconFileText className="w-4 h-4" /> FATURAYA DÖNÜŞTÜR
                        </EnterpriseButton>
                    </div>
                } 
            />

            {/* Otonom Durum Çubuğu */}
            <EnterpriseCard className="p-6 bg-slate-900 !border-none text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Canlı Durumu (Workflow)</p>
                        <div className="flex bg-slate-800/80 p-1 rounded-[14px] ring-1 ring-white/10 shrink-0">
                            {WORKFLOW.map(wf => (
                                <button
                                    key={wf.id}
                                    onClick={() => handleStatusUpdate(wf.id)}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${status === wf.id ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {wf.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {status === 'WAITING_APPROVAL' && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1 animate-pulse">Onay Linki Gönderilmeye Hazır</span>
                            <button onClick={() => window.open(`/p/approval/${orderData.id}`, '_blank')} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl text-xs font-black uppercase tracking-tight shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                                <BrandWhatsappIcon /> MÜŞTERİDEN ONAY İSTE
                            </button>
                        </div>
                    )}
                </div>
            </EnterpriseCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* SOL: Cihaz ve Müşteri Karnesi */}
                <div className="space-y-6 lg:col-span-1">
                    <EnterpriseCard className="p-6 h-full border-t-4 border-indigo-500">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <IconActivity className="w-4 h-4 text-indigo-500" />
                            CİHAZ / ARAÇ KARNESİ
                        </h3>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <IconWrench className="w-8 h-8 opacity-50" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">{orderData.asset?.primaryIdentifier}</h4>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{orderData.asset?.brand} {orderData.asset?.model}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-xs text-slate-500 font-medium">Güncel Kilometre</span>
                                <span className="text-sm font-bold text-slate-900">{orderData.currentKm_or_Use?.toLocaleString() || 'Bilinmiyor'} KM</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-xs text-slate-500 font-medium">Yakıt Durumu</span>
                                <span className="text-sm font-bold text-slate-900">-</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-xs text-slate-500 font-medium">Müşteri Şikayeti</span>
                                <span className="text-xs font-bold text-slate-800 text-right w-2/3">{orderData.complaint || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-xs text-slate-500 font-medium">Garanti Durumu</span>
                                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">GARANTİ KAPSAMINDA MÜMKÜN</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-slate-500 font-medium">Zimmetli Teknisyen</span>
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">{(items.length > 0 && items[0].technician?.name) || 'Henüz Atanmadı'}</span>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-slate-50 rounded-xl ring-1 ring-slate-200/60">
                            <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Hasar / Kozmetik Tespit</h4>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">Arka stop lambasında çatlak mevcut, sele altında kılcal çizikler kayıt altına alındı. Müşteriye aktarıldı.</p>
                        </div>
                    </EnterpriseCard>
                </div>

                {/* SAĞ: Reçete ve Yedek Parça */}
                <div className="space-y-6 lg:col-span-2">
                    <EnterpriseCard className="p-0 overflow-hidden flex flex-col h-full">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 block">
                                <IconSettings className="w-4 h-4 text-slate-500" />
                                SERVİS REÇETESİ (HİZMET MOTORU)
                            </h3>
                            <div className="flex gap-2">
                                <button className="text-[10px] font-black uppercase text-amber-600 bg-white ring-1 ring-amber-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1">
                                    + FASON HİZMET
                                </button>
                                <button className="text-[10px] font-black uppercase text-emerald-600 bg-white ring-1 ring-emerald-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1">
                                    + İŞÇİLİK (HR)
                                </button>
                                <button className="text-[10px] font-black uppercase text-indigo-600 bg-white ring-1 ring-indigo-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1">
                                    + STOK / PARÇA
                                </button>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto flex-1 p-2">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 bg-white">
                                        <th className="py-3 px-4">TÜR</th>
                                        <th className="py-3 px-4">ÜRÜN / AÇIKLAMA</th>
                                        <th className="py-3 px-4 text-center">MİKTAR</th>
                                        <th className="py-3 px-4 text-right">B.FİYATI</th>
                                        <th className="py-3 px-4 text-right">TUTAR</th>
                                        <th className="py-3 px-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-4">
                                                <span className={`text-[9px] font-black uppercase py-1 px-2 rounded tracking-widest ${
                                                    item.type === 'PART' ? 'bg-indigo-50 text-indigo-700' : 
                                                    item.type === 'LABOR' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {item.type === 'PART' ? 'PARÇA' : item.type === 'LABOR' ? 'İŞÇİLİK' : 'FASON'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm font-bold text-slate-800">{item.name}</td>
                                            <td className="py-4 px-4 text-center text-sm font-semibold text-slate-600">{Number(item.quantity || 1)}</td>
                                            <td className="py-4 px-4 text-right text-sm font-medium text-slate-500">{Number(item.unitPrice || 0).toLocaleString()} ₺</td>
                                            <td className="py-4 px-4 text-right text-sm font-black text-slate-900">{Number(item.totalPrice || 0).toLocaleString()} ₺</td>
                                            <td className="py-4 px-4 text-right"><span className="text-red-400 hover:text-red-600 cursor-pointer text-xl">×</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Toplam Matrisi */}
                        <div className="bg-slate-50 border-t border-slate-200 p-6">
                            <div className="flex flex-col gap-2 items-end">
                                <div className="flex justify-between w-64 text-sm font-bold text-slate-500">
                                    <span>Ara Toplam</span>
                                    <span>{totalAmount.toLocaleString()} ₺</span>
                                </div>
                                <div className="flex justify-between w-64 text-sm font-bold text-slate-500">
                                    <span>KDV (%20)</span>
                                    <span>{taxAmount.toLocaleString()} ₺</span>
                                </div>
                                <div className="w-64 h-px bg-slate-300 my-1" />
                                <div className="flex justify-between w-64 text-lg font-black text-slate-900">
                                    <span>GENEL TOPLAM</span>
                                    <span className="text-indigo-600">{finalAmount.toLocaleString()} ₺</span>
                                </div>
                            </div>
                        </div>
                    </EnterpriseCard>
                </div>
            </div>
        </div>
    );
}

function BrandWhatsappIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
    );
}
