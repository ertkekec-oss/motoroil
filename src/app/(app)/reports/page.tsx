"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
    Activity, BarChart3, Presentation, Users, Briefcase, 
    Factory, Package, FileText, Settings, ShieldAlert,
    TrendingUp, Calculator, Clock, Map, PhoneCall,
    Mail, Workflow
} from 'lucide-react';

const REPORT_MODULES = [
    {
        category: 'Finans & Kârlılık',
        items: [
            { id: 'profitability', title: 'Şirket Kârlılık ve Büyüme Analizi', desc: 'Brüt/Net Kâr, Ciro, Gider Karşılaştırması', icon: <TrendingUp />, path: '/reports/finance/profitability', color: 'text-emerald-500' },
            { id: 'aging', title: 'Cari Yaşlandırma ve Risk', desc: 'Kim ne kadar borçlu, tahsilat gecikmeleri', icon: <Calculator />, path: '/reports/finance/aging', color: 'text-amber-500' },
            { id: 'reconciliation', title: 'Mutabakat Performansı', desc: 'BA/BS Onay Oranları, İhtilaflı Bakiyeler', icon: <Briefcase />, path: '/reports/finance/reconciliation', color: 'text-blue-500' },
            { id: 'anomalies', title: 'Sistem Anomalileri', desc: 'Olağandışı iskontolar, silinen fişler', icon: <ShieldAlert />, path: '/reports/finance/anomalies', color: 'text-red-500' }
        ]
    },
    {
        category: 'Operasyon & Satış',
        items: [
            { id: 'personnel', title: 'Personel Satış Performansı', desc: 'Hangi personel ne kadar sattı?', icon: <Users />, path: '/reports/sales/personnel', color: 'text-indigo-500' },
            { id: 'conversion', title: 'Teklif Dönüşüm Oranları', desc: 'Verilen tekliflerin kazanma kaybetme analizi', icon: <FileText />, path: '/reports/sales/conversion', color: 'text-purple-500' },
            { id: 'salesx', title: 'SalesX Saha Zekası', desc: 'Saha ekipleri rotaya uyum, check-in raporu', icon: <Map />, path: '/reports/sales/salesx', color: 'text-sky-500' },
            { id: 'campaigns', title: 'Kampanya Etkililiği', desc: 'Kupon ve promosyonların ciroya etkisi', icon: <Presentation />, path: '/reports/sales/campaigns', color: 'text-pink-500' }
        ]
    },
    {
        category: 'Servis & Müşteri İletişimi',
        items: [
            { id: 'service', title: 'Servis Masası & SLA Panosu', desc: 'Kapanan bilet süreleri, aşan SLA hedefleri', icon: <Clock />, path: '/reports/service/sla', color: 'text-cyan-500' },
            { id: 'calls', title: 'Çağrı İstatistikleri', desc: 'Müşteri hizmetleri çağrı yoğunlukları', icon: <PhoneCall />, path: '/reports/service/calls', color: 'text-teal-500' },
            { id: 'mailing', title: 'Toplu İletişim', desc: 'SMS ve E-posta gönderim istatistikleri', icon: <Mail />, path: '/reports/service/mailing', color: 'text-orange-500' }
        ]
    },
    {
        category: 'Kaynak & Envanter Yönetimi',
        items: [
            { id: 'inventory', title: 'Stok Devir Hızı & Atıl Yük', desc: 'Hangi ürün depoda satılmadan bekliyor?', icon: <Package />, path: '/reports/resources/inventory', color: 'text-yellow-600' },
            { id: 'bom', title: 'Ürün Reçetesi (BOM) Maliyet', desc: 'Üretim maliyetlerindeki anlık sapmalar', icon: <Factory />, path: '/reports/resources/bom', color: 'text-slate-600' },
            { id: 'assets', title: 'Varlık ve Demirbaş Analizi', desc: 'Sabit kıymet zimmet ve amortisman durumu', icon: <Settings />, path: '/reports/resources/assets', color: 'text-lime-600' },
            { id: 'hr', title: 'İnsan Kaynakları Puan Tablosu', desc: 'İzin, mesai, vardiya tolerans analizi', icon: <Workflow />, path: '/reports/resources/hr', color: 'text-fuchsia-500' }
        ]
    }
];

export default function ReportsCatalogPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            
            {/* Page Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                    Enterprise İş Zekası ve Raporlama Motoru
                </h1>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                    Sisteme kayıtlı 18 kurumsal modülün anlık rapor kataloğu. Rapor üretirken üst bardan Tarih, Organizasyon Şubesi ve Personel bazlı keskin (drill-down) filtrelemeler kullanabilirsiniz.
                </p>
            </div>

            {/* CEO Executive Pin */}
            <div className="mb-10">
                <button 
                    onClick={() => router.push('/reports/ceo')} 
                    className="w-full bg-gradient-to-r from-slate-900 to-slate-800 dark:from-blue-600 dark:to-blue-800 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between transition-all hover:scale-[1.01]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                            <Activity className="w-8 h-8 text-blue-300 dark:text-white" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-xl font-black mb-1">Strateji Merkezi (Executive Dashboard)</h2>
                            <p className="text-sm font-semibold text-slate-300 dark:text-blue-100">C-Level yöneticiler için şirketin finans, nakit ve büyüme özetini tek bir panelde birleştiren kokpit ekranı.</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex px-6 py-2 bg-white/10 rounded-xl text-sm font-bold uppercase tracking-widest border border-white/20">
                        PANOYA GİT →
                    </div>
                </button>
            </div>

            {/* Modules Grid */}
            <div className="space-y-12">
                {REPORT_MODULES.map((category, idx) => (
                    <div key={idx}>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 tracking-tight flex items-center gap-3">
                            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                            {category.category}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {category.items.map((report) => (
                                <div 
                                    key={report.id}
                                    onClick={() => router.push(report.path)}
                                    className="bg-white dark:bg-[#151f32] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col items-start gap-4"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${report.color} group-hover:scale-110 transition-transform`}>
                                        {React.cloneElement(report.icon as any, { className: "w-6 h-6" })}
                                    </div>
                                    <div className="w-full">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {report.title}
                                        </h4>
                                        <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                            {report.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}