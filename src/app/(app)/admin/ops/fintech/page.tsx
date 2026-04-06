"use client";
import React, { useState, useEffect } from 'react';
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";
import { CreditCard, Route, Save } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

export default function FintechPage() {
    const { showSuccess, showError } = useModal();
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/ops/fintech")
            .then(r => r.json())
            .then(data => { setConfig(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        try {
            const res = await fetch("/api/admin/ops/fintech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });
            if (res.ok) showSuccess("Başarılı", "Routing kuralları güncellendi.");
            else showError("Hata", "Kurallar kaydedilemedi.");
        } catch(e) {
            showError("Hata", "Kayıt başarısız.");
        }
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <EnterprisePageShell 
            title="Fintech Routing (İşlem Yönlendirme)" 
            description="Kredi kartı tahsilatlarını farklı POS sağlayıcılarına tutar ve risk profiline göre akıllı yönlendirin."
            actions={<button onClick={handleSave} className="flex gap-2 items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl"><Save className="w-4 h-4"/> Kuralları Yürürlüğe Al</button>}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EnterpriseCard title="Dinamik POS Yönlendirme" icon={<Route className="w-5 h-5"/>}>
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Varsayılan Sağlayıcı</label>
                            <select value={config?.defaultProvider || 'PAYTR'} onChange={e => setConfig({...config, defaultProvider: e.target.value})} className="mt-2 w-full p-2 border border-slate-200 rounded-lg text-sm bg-white">
                                <option value="PAYTR">PayTR Sanal POS</option>
                                <option value="IYZICO">Iyzico</option>
                                <option value="PARAM">Param Pos</option>
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer mt-4">
                                <input type="checkbox" checked={config?.useFallback || true} onChange={e=>setConfig({...config, useFallback: e.target.checked})} className="w-4 h-4" />
                                <span className="text-sm font-bold">POS Çökmesinde (Timeout) Yedek Sağlayıcıya Geç</span>
                            </label>
                            <p className="text-[10px] text-slate-500 mt-1 ml-6">Bir işlem üst üste başarısız olursa akıllı rotalama motoru yedeği devreye alır.</p>
                        </div>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard title="Komisyon & Masraf Dağılımı" icon={<CreditCard className="w-5 h-5"/>}>
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer mt-4">
                                <input type="checkbox" checked={config?.absorbCommissions || false} onChange={e=>setConfig({...config, absorbCommissions: e.target.checked})} className="w-4 h-4" />
                                <span className="text-sm font-bold">Ödeme geçidi komisyonlarını alıcıdan (B2B) kes</span>
                            </label>
                            <p className="text-[10px] text-slate-500 mt-1 ml-6">Eğer kapalıysa, komisyon platformun 'Platform Finance' hazinesinden karşılanır.</p>
                        </div>
                    </div>
                </EnterpriseCard>
            </div>
        </EnterprisePageShell>
    );
}
