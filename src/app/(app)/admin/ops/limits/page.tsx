"use client";
import React, { useState, useEffect } from 'react';
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";
import { Server, Zap, Shield, Save } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

export default function LimitsPage() {
    const { showSuccess, showError } = useModal();
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/system/limits")
            .then(r => r.json())
            .then(data => { setConfig(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        try {
            const res = await fetch("/api/admin/system/limits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });
            if (res.ok) showSuccess("Başarılı", "Limit kuralları güncellendi.");
            else showError("Hata", "Limitler kaydedilemedi.");
        } catch(e) {
            showError("Hata", "Sunucu bağlantı hatası.");
        }
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <EnterprisePageShell 
            title="Sistem ve API Limitleri (Rate Limiting)" 
            description="REST API, Webhook ve işlem limitlerini yöneterek kaynak tükenmesini önleyin."
            actions={<button onClick={handleSave} className="flex gap-2 items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl"><Save className="w-4 h-4"/> Değişiklikleri Kaydet</button>}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EnterpriseCard className="border border-indigo-100">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5"/>
                        <h3 className="font-bold text-slate-900 dark:text-white">Global İstek Oranları</h3>
                    </div>
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Kimliği Doğrulanmayanlar (IP/Saniye)</label>
                            <input type="number" value={config?.unauthRps || 10} onChange={e => setConfig({...config, unauthRps: parseInt(e.target.value)})} className="mt-2 w-full p-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Giriş Yapmış Kullanıcılar (IP/Saniye)</label>
                            <input type="number" value={config?.authRps || 100} onChange={e => setConfig({...config, authRps: parseInt(e.target.value)})} className="mt-2 w-full p-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard>
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5"/>
                        <h3 className="font-bold text-slate-900 dark:text-white">Finansal İşlem Kilidi (Idempotency)</h3>
                    </div>
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Idempotency Key Geçerlilik (Saat)</label>
                            <input type="number" value={config?.idempWindow || 24} onChange={e => setConfig({...config, idempWindow: parseInt(e.target.value)})} className="mt-2 w-full p-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Finansal yönlendirmelerde ve satın alımlarda aynı isteklerin mükerrer işlenmesini önlemek için tutulan anahtarların ömrü.</p>
                    </div>
                </EnterpriseCard>
            </div>
        </EnterprisePageShell>
    );
}

// Quick inline stub for Activity icon
function Activity(props: any) { return <Server {...props}/>; }
