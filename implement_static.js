const fs = require('fs');

const limitsPage = `"use client";
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
                <EnterpriseCard title="Global İstek Oranları" icon={<Activity className="w-5 h-5"/>} className="border border-indigo-100">
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

                <EnterpriseCard title="Finansal İşlem Kilidi (Idempotency)" icon={<Shield className="w-5 h-5"/>}>
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
`;

const limitsApi = `import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const s = await prisma.appSettings.findFirst({ where: { key: 'SYSTEM_RATE_LIMITS' }});
    return NextResponse.json(s?.value || { unauthRps: 10, authRps: 100, idempWindow: 24 });
}

export async function POST(req: Request) {
    const session: any = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized'}, {status: 401});
    const body = await req.json();
    await prisma.appSettings.upsert({
        where: { companyId_key: { companyId: 'PLATFORM_ADMIN', key: 'SYSTEM_RATE_LIMITS' } },
        create: { companyId: 'PLATFORM_ADMIN', key: 'SYSTEM_RATE_LIMITS', value: body },
        update: { value: body }
    });
    return NextResponse.json({success: true});
}
`;


const fintechPage = `"use client";
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
`;

const fintechApi = `import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const s = await prisma.appSettings.findFirst({ where: { key: 'FINTECH_ROUTING' }});
    return NextResponse.json(s?.value || { defaultProvider: 'PAYTR', useFallback: true, absorbCommissions: false });
}

export async function POST(req: Request) {
    const session: any = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized'}, {status: 401});
    const body = await req.json();
    await prisma.appSettings.upsert({
        where: { companyId_key: { companyId: 'PLATFORM_ADMIN', key: 'FINTECH_ROUTING' } },
        create: { companyId: 'PLATFORM_ADMIN', key: 'FINTECH_ROUTING', value: body },
        update: { value: body }
    });
    return NextResponse.json({success: true});
}
`;

fs.writeFileSync('src/app/(app)/admin/ops/limits/page.tsx', limitsPage);
fs.mkdirSync('src/app/api/admin/system/limits', { recursive: true });
fs.writeFileSync('src/app/api/admin/system/limits/route.ts', limitsApi);

fs.writeFileSync('src/app/(app)/admin/ops/fintech/page.tsx', fintechPage);
fs.mkdirSync('src/app/api/admin/ops/fintech', { recursive: true });
fs.writeFileSync('src/app/api/admin/ops/fintech/route.ts', fintechApi);

console.log("Written phase 1 static pages!");
