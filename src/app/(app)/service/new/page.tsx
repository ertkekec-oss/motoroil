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
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

export default function NewServiceIntakePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { appSettings } = useSettings();
    
    const assetTypes = appSettings?.asset_types_schema || [];
    
    // States for form
    const [selectedType, setSelectedType] = useState<any>(null);
    const [primaryIdentifier, setPrimaryIdentifier] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [complaint, setComplaint] = useState('');
    const [currentKm, setCurrentKm] = useState('');
    
    const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
    
    // Select customer & staff mock states
    const [customerId, setCustomerId] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    
    useEffect(() => {
        // Fetch customers to populate dropdown
        fetch('/api/customers')
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    setCustomers(data.customers || []);
                    // Removed auto-selection of the first customer to prevent accidental wrong assignments
                }
            })
            .catch(() => {});
    }, []);

    // Set default selected type if there is one
    useEffect(() => {
        if (assetTypes.length > 0 && !selectedType) {
            setSelectedType(assetTypes[0]);
        }
    }, [assetTypes]);

    // Update dynamic fields state when selectedType changes
    useEffect(() => {
        if (selectedType) {
            const initialFields: Record<string, string> = {};
            selectedType.fields?.forEach((f: any) => {
                initialFields[f.label] = '';
            });
            setDynamicFields(initialFields);
        }
    }, [selectedType]);

    const handleDynamicFieldChange = (key: string, value: string) => {
        setDynamicFields(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!primaryIdentifier || !customerId) {
            toast.error("Lütfen Referans (Plaka/Seri No) ve Müşteri alanlarını doldurun.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/service-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    assetType: selectedType?.name || 'VEHICLE',
                    primaryIdentifier: primaryIdentifier.toUpperCase(),
                    brand,
                    model,
                    complaint,
                    currentKm,
                    customFields: dynamicFields
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
                            CİHAZ / TÜR KİMLİĞİ VE KARNESİ
                        </h3>
                        
                        <div className="space-y-4">
                            {/* DYNAMIC TYPE SELECTOR */}
                            {assetTypes.length > 0 && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">
                                        Kabul Edilen Cihaz / Taşıt Türü
                                    </label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={selectedType?.id || ''}
                                        onChange={(e) => {
                                            const type = assetTypes.find((t: any) => t.id === e.target.value);
                                            setSelectedType(type);
                                        }}
                                    >
                                        {assetTypes.map((type: any) => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">
                                    Ana Referans No (Plaka / Cihaz Seri No / IMEI) (Zorunlu)
                                </label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-indigo-700 text-lg uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-300" 
                                    placeholder="Örn: 34ABC12 veya SN:12345"
                                    value={primaryIdentifier}
                                    onChange={e => setPrimaryIdentifier(e.target.value)}
                                    required
                                />
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Sistemde daha önce işlem gördüyse arıza geçmişi otomatik eklenecektir.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Aygıt Markası</label>
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-indigo-500"
                                        placeholder="Örn: Bosch, Apple"
                                        value={brand} onChange={e => setBrand(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Model Serisi</label>
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-indigo-500"
                                        placeholder="Örn: Serisi X / iPhone 13"
                                        value={model} onChange={e => setModel(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* DYNAMIC FIELDS GENERATION */}
                            {selectedType?.fields?.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-slate-100">
                                    <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3">TüRe ÖZEL KARNE KUTULARI</h4>
                                    <div className="space-y-3">
                                        {selectedType.fields.map((f: any) => (
                                            <div key={f.id}>
                                                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">{f.label}</label>
                                                <input 
                                                    className="w-full bg-slate-100 border-none rounded-lg px-4 py-2 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                    placeholder={`${f.label} değerini girin`}
                                                    value={dynamicFields[f.label] || ''}
                                                    onChange={(e) => handleDynamicFieldChange(f.label, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                TEŞHİS VE MÜŞTERİ ŞİKAYETİ
                            </h3>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Kabul Notu / Belirtilen Arıza</label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-rose-500 min-h-[170px]"
                                    placeholder="Örn: Makine su almıyor, alttan damlatıyor veya cihaz şarj takılıyken kapanıyor..."
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
                        {isLoading ? 'OLUŞTURULUYOR...' : 'YENİ SERVİS FORMU AÇ'} <IconCheck className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
