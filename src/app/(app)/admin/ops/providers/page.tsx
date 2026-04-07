import { prisma } from "@/lib/prisma";
import {  Server, Zap, Globe, Package, RefreshCw, Layers  } from "lucide-react";
import { EnterprisePageShell } from "@/components/ui/enterprise";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
    // In a real app these would be fetched from a dedicated Config model or environment
    // For MVP, we'll list the architectural placeholders and health status

    const paymentProviders = [
        { id: "MOCK", name: "Sanal Test Havuzu (Mock Escrow)", status: "INACTIVE", lastSync: "Kapatıldı", errorCount: 0 },
        { id: "IYZICO", name: "Iyzico Canlı Entegrasyonu", status: "HEALTHY", lastSync: "Aktif / Live", errorCount: 0 },
        { id: "PAYTR", name: "PayTR Sanal POS", status: "HEALTHY", lastSync: "Aktif / Live", errorCount: 0 },
    ];

    const carriers = [
        { id: "MANUAL", name: "Manuel / Elden Teslimat", active: false, sync: "Kapalı" },
        { id: "MOCK", name: "Lojistik Simülasyonu (Test)", active: false, sync: "Kapalı (Eski)" },
        { id: "HEPSIJET", name: "HepsiJet Canlı API", active: true, sync: "Canlı Beklemede" },
        { id: "SENDEO", name: "Sendeo Canlı API", active: true, sync: "Canlı Beklemede" },
        { id: "KOLAYGELSINMP", name: "KolayGelsin Canlı API", active: true, sync: "Canlı Beklemede" }
    ];

    return (
        <EnterprisePageShell
        title="Yönetim Paneli"
        description="Sistem detaylarını yapılandırın."
    >
        <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <Server className="w-6 h-6 text-indigo-500" />
                            Ana Altyapı Şalter Odası (Switchboard)
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Periodya B2B Ağının dış sistemlerle (Ödeme & Lojistik API'leri) veri alışverişini sağlayan temel protokol anahtarları.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* Payment Gateways */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#111c30] flex justify-between items-center">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Zap className="w-4 h-4 text-emerald-500" />
                                1. Ödeme Sağlayıcıları (PSPs)
                            </h2>
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                                SİSTEM SAĞLIKLI
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {paymentProviders?.map(p => {
                                const isHealthy = p.status === "HEALTHY";
                                return (
                                    <div key={p.id} className="p-6 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="flex gap-4 items-center">
                                            <div className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</div>
                                                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase tracking-wider">Adaptör ID: {p.id}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[11px] font-bold tracking-wider uppercase ${isHealthy ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-500"}`}>{p.status}</div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Senk: {p.lastSync}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Logistics Carriers */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#111c30] flex justify-between items-center">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Package className="w-4 h-4 text-indigo-500" />
                                2. Lojistik Taşıyıcı Adaptörleri (3PL)
                            </h2>
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
                                4 Adaptör Yüklü
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {carriers?.map(c => (
                                <div key={c.id} className="p-6 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <div className="flex gap-4 items-center">
                                        <div className={`relative inline-flex items-center cursor-pointer ${c.active ? 'opacity-100' : 'opacity-60'}`}>
                                            <div className={`w-10 h-5 md:w-11 md:h-6 rounded-full peer transition-colors ${c.active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-[16px] w-[16px] md:h-[20px] md:w-[20px] transition-transform ${c.active ? 'translate-x-full border-white' : ''}`}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm ${c.active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}>{c.name}</div>
                                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase tracking-wider">Adaptör ID: {c.id}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[11px] font-bold tracking-wider uppercase ${c.active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                                            {c.active ? "ŞALTER AÇIK" : "ŞALTER KAPALI"}
                                        </div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Durum: {c.sync}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </EnterprisePageShell>
    );
}
