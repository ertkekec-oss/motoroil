"use client";
import React from 'react';
import Link from "next/link";
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";
import { ShieldCheck, FileText, Settings, Webhook, Activity } from "lucide-react";

export default function AdminSignaturesPage() {
    const modules = [
        { title: 'Şablon Yönetimi', route: '/admin/signatures/templates', desc: 'Sözleşme taslakları ve dinamik alan haritaları.', icon: <FileText className="w-5 h-5 text-indigo-500" /> },
        { title: 'Sağlayıcılar', route: '/admin/signatures/providers', desc: 'e-İmza ve OTP servis sağlayıcı entegrasyonları.', icon: <Settings className="w-5 h-5 text-indigo-500" /> },
        { title: 'Politika & SLA', route: '/admin/signatures/policies', desc: 'Son geçerlilik tarihleri ve otomatik hatırlatıcı kuralları.', icon: <ShieldCheck className="w-5 h-5 text-indigo-500" /> },
        { title: 'Webhook Alıcısı', route: '/admin/signatures/webhooks', desc: 'Dış servislerden gelen imza durum bildirimlerini dinler.', icon: <Webhook className="w-5 h-5 text-indigo-500" /> },
        { title: 'Sistem Denetimi', route: '/admin/signatures/audit', desc: 'Tüm imza aktivitelerinin detaylı sistem günlüğü.', icon: <Activity className="w-5 h-5 text-indigo-500" /> }
    ];

    return (
        <EnterprisePageShell 
            title="İmza Motoru Yönetimi" 
            description="Platform genelindeki imza kurallarını, sağlayıcıları ve kalıpları yönetin."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {modules.map((c, i) => (
                    <Link href={c.route} key={i}>
                        <EnterpriseCard className="h-full group hover:border-indigo-500 transition-all cursor-pointer flex flex-col items-start gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                                {c.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{c.title}</h3>
                                <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
                            </div>
                        </EnterpriseCard>
                    </Link>
                ))}
            </div>

            <EnterpriseCard title="Güvenlik Durumu" icon={<ShieldCheck className="w-5 h-5 text-rose-500" />}>
                <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-500/5 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-medium border border-rose-100 dark:border-rose-500/20">
                    Tüm imza bağlantıları tenant izoleli uç noktalardan geçmekte olup, atanan tokenler varsayılan olarak 7 gün sonra geçersiz kılınmaktadır. Dış API rate threshold seviyeleri "Sıkı" (100 req/min) profilindedir.
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}

