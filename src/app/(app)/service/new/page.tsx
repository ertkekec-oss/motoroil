"use client";

import React, { useState, useEffect } from "react";
import { 
    EnterpriseSectionHeader, 
    EnterpriseButton, 
    EnterpriseCard,
    EnterpriseInput
} from "@/components/ui/enterprise";
import { IconWrench, IconCheck, IconSearch, IconActivity, IconUsers } from "@/components/icons/PremiumIcons";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner is used

export default function NewServiceIntakePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    // States for form
    const [primaryIdentifier, setPrimaryIdentifier] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [complaint, setComplaint] = useState('');
    const [currentKm, setCurrentKm] = useState('');
    
    // Select customer & staff mock states (In real implementation, these would be select dropdowns from separate APIs)
    const [customerId, setCustomerId] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    
    useEffect(() => {
        // Fetch customers to populate dropdown
        fetch('/api/customers')
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    setCustomers(data.customers || []);
                    if(data.customers.length > 0) setCustomerId(data.customers[0].id);
                }
            })
            .catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!primaryIdentifier || !customerId) {
            toast.error("Lütfen Plaka/Seri No ve Müşteri alanlarını doldurun.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/service-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    assetType: 'VEHICLE', // Assuming Vehicle for now, logic can expand
                    primaryIdentifier: primaryIdentifier.toUpperCase(),
                    brand,
                    model,
                    complaint,
                    currentKm
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Servis İş Emri Oluşturuldu!');
                router.push(`/service/${data.orderId}`);
            } else {
                toast.error(data.error || 'Hata oluştu');
            }
        } catch (error) {
            toast.error("Bağlantı hatası");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-[1000px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700 pb-40 font-sans">
            <EnterpriseSectionHeader 
                title="YENİ SERVİS KABUL (INTAKE)" 
                subtitle="Cihaz/Araç Kaydı Oluşturma ve Teşhis Bildirimi"
                icon={<IconWrench />}
                onBack={() => router.push('/service')}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ASSET (CİHAZ/ARAÇ) BİLGİLERİ */}
                    <EnterpriseCard className="p-6 space-y-6 border-t-4 border-indigo-500">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                            <IconActivity className="w-4 h-4 text-indigo-500" />
                            CİHAZ / TASIT KİMLİĞİ
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">
                                    Plaka / Cihaz Seri No / IMEI (Zorunlu)
                                </label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-indigo-700 text-lg uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-300" 
                                    placeholder="Örn: 34ABC12 veya SN:12345"
                                    value={primaryIdentifier}
                                    onChange={e => setPrimaryIdentifier(e.target.value)}
                                    required
                                />
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Bu seri numarası veya plaka önceden kayıtlıysa cihaz karnesi otomatik eklenecektir.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Marka (Opsiyonel)</label>
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-indigo-500"
                                        placeholder="Örn: Bosch, Apple, Yamaha"
                                        value={brand} onChange={e => setBrand(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Model Bilgisi</label>
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-indigo-500"
                                        placeholder="Örn: Çamaşır Mak. Serisi X / iPhone 13"
                                        value={model} onChange={e => setModel(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Gösterge / Sayaç (KM, Kopya, Çalışma Saati)</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-indigo-500"
                                    type="number"
                                    placeholder="Opsiyonel"
                                    value={currentKm} onChange={e => setCurrentKm(e.target.value)}
                                />
                            </div>
                        </div>
                    </EnterpriseCard>

                    {/* MÜŞTERİ VE ŞİKAYET BİLGİLERİ */}
                    <div className="space-y-6">
                        <EnterpriseCard className="p-6">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                <IconUsers className="w-4 h-4 text-emerald-500" />
                                MÜŞTERİ SEÇİMİ
                            </h3>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Cari Hesap (Zorunlu)</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 text-slate-700"
                                    value={customerId}
                                    onChange={e => setCustomerId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Müşteri Seçin --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </EnterpriseCard>

                        <EnterpriseCard className="p-6">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                <IconSearch className="w-4 h-4 text-rose-500" />
                                TEŞHİS VE ŞİKAYET
                            </h3>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Müşteri Şikayeti / Kabul Notu</label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-rose-500 min-h-[120px]"
                                    placeholder="Örn: Makine su almıyor, alttan damlatıyor veya Cihaz şarj takılıyken kapanıyor..."
                                    value={complaint}
                                    onChange={e => setComplaint(e.target.value)}
                                />
                            </div>
                        </EnterpriseCard>
                    </div>
                </div>
                
                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-sm px-10 py-4 rounded-xl shadow-xl flex items-center gap-2 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'OLUŞTURULUYOR...' : 'İŞ EMRİ OLUŞTUR'} <IconCheck className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
