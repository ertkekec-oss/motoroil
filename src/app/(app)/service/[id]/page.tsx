"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        fetch(`/api/services/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setService(data.service);
                } else {
                    setError(data.error || 'Servis kaydı bulunamadı.');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'Geçersiz Tarih';
        }
    };

    if (loading) {
        return (
            <div className="container flex-center min-h-[80vh]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-subtle border-t-primary animate-spin"></div>
                    <span className="text-[11px] font-black text-muted uppercase tracking-[0.3em] animate-pulse">Detaylar Yükleniyor...</span>
                </div>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="container flex-center min-h-[80vh]">
                <div className="bg-subtle border border-main rounded-[40px] p-12 text-center max-w-lg shadow-2xl">
                    <div className="text-6xl mb-6">⚠️</div>
                    <h2 className="text-2xl font-black text-main mb-2">Eyvah! Bir Sorun Var</h2>
                    <p className="text-muted font-medium mb-8 leading-relaxed">{error || 'İstediğiniz servis kaydına şu an ulaşamıyoruz.'}</p>
                    <button onClick={() => router.back()} className="px-8 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Geri Dön</button>
                </div>
            </div>
        );
    }

    const items = service.items || [];
    const partsTotal = items.reduce((acc: number, item: any) => acc + (item.isWarranty ? 0 : item.price * item.quantity), 0);
    const totalAmount = parseFloat(service.totalAmount);
    // If labor is not in items, we can try to show it as the remainder if it makes sense
    // But usually it's better to just show "Parts" and "Total"

    const [isActionsOpen, setIsActionsOpen] = useState(false);

    return (
        <div className="container p-8 max-w-[1400px] mx-auto min-h-screen">

            {/* TOP BAR / NAVIGATION */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-subtle border border-main flex items-center justify-center text-muted hover:text-main hover:bg-hover transition-all">←</button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black text-main tracking-tight">Servis Detayı</h1>
                                <span className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mt-1">
                                    SRV-{service.id.toString().slice(-6).toUpperCase()}
                                </span>
                            </div>
                            <p className="text-muted font-bold text-sm ml-1 uppercase tracking-[0.2em]">{service.status} İşlemi</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => window.print()} className="px-6 py-3 rounded-2xl bg-subtle border border-main text-muted font-black text-xs uppercase tracking-widest hover:bg-hover hover:text-main transition-all flex items-center gap-3">
                        <span>🖨️</span>
                        Yazdır
                    </button>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setIsActionsOpen(!isActionsOpen)} 
                            className="px-6 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-sm shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            EYLEMLER
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform ${isActionsOpen ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {isActionsOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsActionsOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                                    <button 
                                        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        E-Fatura Gönder
                                    </button>
                                    <button 
                                        onClick={() => {
                                            router.push(`/offers?customerId=${service.customerId}&serviceId=${service.id}`);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                    >
                                        Teklif Oluştur
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">

                {/* LEFT COLUMN: INFORMATION */}
                <div className="space-y-8">

                    {/* INFO GRID: CUSTOMER & VEHICLE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* CUSTOMER CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none text-9xl">👤</div>
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">👤</div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Müşteri Bilgileri</h3>
                                        <div className="text-xl font-black text-white">{service.customer?.name}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Telefon</div>
                                        <div className="text-sm font-bold text-white/80">{service.customer?.phone || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Müşteri No</div>
                                        <div className="text-sm font-bold text-white/40">#{service.customerId}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* VEHICLE CARD */}
                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none text-9xl">🏍️</div>
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-2xl">{service.vehicleType === 'bike' ? '🚲' : '🏍️'}</div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Araç Bilgileri</h3>
                                        <div className="text-xl font-black text-white">{service.plate || 'Plakasız'}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Marka / Model</div>
                                        <div className="text-sm font-bold text-white/80 line-clamp-1">{service.vehicleBrand || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Mevcut Kilometre</div>
                                        <div className="text-sm font-bold text-secondary">{service.km ? `${service.km.toLocaleString()} KM` : '-'}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Şasi / Seri No</div>
                                        <div className="text-sm font-mono font-bold text-white/40 character-variant">{service.vehicleSerial || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PARTS & LABOR TABLE */}
                    <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-primary"></span>
                                Yapılan İşlemler ve Kalemler
                            </h3>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{items.length} Kalem Kayıtlı</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#1a1c2e]/30">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest">Açıklama</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest text-center">Miktar</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Birim Fiyat</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Toplam</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map((item: any, i: number) => (
                                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">{item.type === 'Labor' ? '🔧' : '📦'}</div>
                                                    <div>
                                                        <div className="text-sm font-black text-white group-hover:text-primary transition-colors">{item.name}</div>
                                                        {item.isWarranty && <div className="text-[9px] font-black text-success uppercase tracking-widest mt-1">🛡️ Garanti Kapsamında</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-sm font-bold text-white/60">x{item.quantity}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`text-sm font-bold ${item.isWarranty ? 'text-white/20 line-through' : 'text-white/80'}`}>
                                                    ₺{parseFloat(item.price).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`text-base font-black ${item.isWarranty ? 'text-success/60' : 'text-white'}`}>
                                                    {item.isWarranty ? 'ÜCRETSİZ' : `₺${(item.price * item.quantity).toLocaleString()}`}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-12 text-center">
                                                <div className="text-white/10 italic font-bold">Herhangi bir işlem kalemi bulunamadı.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* NOTES FOOTER */}
                        {service.notes && (
                            <div className="p-8 bg-black/20 border-t border-white/5">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Teknik Notlar / Şikayet</h4>
                                <p className="text-sm font-medium text-white/60 leading-relaxed italic border-l-2 border-primary/30 pl-4">
                                    {service.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: SUMMARY & STATUS */}
                <div className="space-y-6">

                    {/* SUMMARY CARD */}
                    <div className="bg-[#1a1c2e] rounded-[40px] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full  -translate-y-1/2 translate-x-1/2"></div>

                        <h3 className="text-lg font-black text-white mb-8 border-b border-white/5 pb-4">Finansal Özet</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center group">
                                <span className="text-sm font-bold text-white/30 italic">Servis Tarihi</span>
                                <span className="text-sm font-black text-white">{formatDate(service.createdAt)}</span>
                            </div>

                            {service.nextDate && (
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm font-bold text-success/40 italic">Sonraki Bakım</span>
                                    <span className="px-3 py-1 bg-success/10 border border-success/20 rounded-lg text-xs font-black text-success">
                                        {formatDate(service.nextDate)}
                                    </span>
                                </div>
                            )}

                            {service.nextKm && (
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm font-bold text-secondary/40 italic">Sonraki KM</span>
                                    <span className="text-sm font-black text-secondary">
                                        {service.nextKm.toLocaleString()} KM
                                    </span>
                                </div>
                            )}

                            <div className="my-6 border-t border-white/5"></div>

                            <div className="flex justify-between items-center group">
                                <span className="text-sm font-bold text-white/30 italic">Kalem Toplamı</span>
                                <span className="font-black text-white">₺{partsTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-sm font-bold text-white/30 italic">KDV (%20 dahil)</span>
                                <span className="font-black text-white/40 italic">₺{(totalAmount * 1.2 * 0.1666).toFixed(0).toLocaleString()}</span>
                            </div>

                            <div className="pt-6 mt-6 border-t border-white/10 flex flex-col gap-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Genel Toplam</span>
                                    <div className="flex flex-col items-end">
                                        <div className="text-4xl font-black text-white tracking-tighter">₺{totalAmount.toLocaleString()}</div>
                                        <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none mt-1 text-right">Tahsil Edilen Tutar</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 space-y-3">
                            <button className="w-full py-5 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-sm uppercase tracking-widest transition-all">
                                📑 Fatura Detayı
                            </button>
                            <button className="w-full py-4 rounded-2xl bg-danger/10 text-danger/60 font-black text-[11px] uppercase tracking-widest hover:bg-danger/20 hover:text-danger transition-all">
                                🗑️ Kaydı Sil
                            </button>
                        </div>
                    </div>

                    {/* STATUS TIMELINE (MINI) */}
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Süreç Takibi</h4>
                        <div className="space-y-6 relative ml-2">
                            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-white/5"></div>

                            <div className="flex gap-4 items-start relative z-10">
                                <div className="w-4 h-4 rounded-full bg-success border-4 border-[#080911] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <div>
                                    <div className="text-xs font-black text-white">Bakım Tamamlandı</div>
                                    <div className="text-[10px] font-bold text-white/20 uppercase mt-0.5">{formatDate(service.createdAt)}</div>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start relative z-10">
                                <div className="w-4 h-4 rounded-full bg-white/10 border-4 border-[#080911]"></div>
                                <div>
                                    <div className="text-xs font-black text-white/30 italic">Teslim Edildi</div>
                                    <div className="text-[10px] font-bold text-white/10 uppercase mt-0.5">-</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
