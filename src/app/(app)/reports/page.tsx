"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
    Activity, BarChart3, Presentation, Users, Briefcase, 
    Factory, Package, FileText, Settings, ShieldAlert,
    TrendingUp, Calculator, Clock, Map, PhoneCall,
    Mail, Workflow, ArrowRight
} from 'lucide-react';

const REPORT_MODULES = [
    {
        category: 'Finans & Kârlılık',
        items: [
            { id: 'profitability', title: 'Şirket Kârlılık ve Büyüme Analizi', desc: 'Brüt/Net Kâr, Ciro, Gider Karşılaştırması', icon: <TrendingUp />, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { id: 'aging', title: 'Cari Yaşlandırma ve Risk', desc: 'Kim ne kadar borçlu, tahsilat gecikmeleri', icon: <Calculator />, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { id: 'reconciliation', title: 'Mutabakat Performansı', desc: 'BA/BS Onay Oranları, İhtilaflı Bakiyeler', icon: <Briefcase />, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { id: 'anomalies', title: 'Sistem Anomalileri', desc: 'Olağandışı iskontolar, silinen fişler', icon: <ShieldAlert />, color: 'text-red-600 dark:text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' }
        ]
    },
    {
        category: 'Operasyon & Satış',
        items: [
            { id: 'personnel', title: 'Personel Satış Performansı', desc: 'Hangi personel ne kadar sattı?', icon: <Users />, color: 'text-indigo-600 dark:text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
            { id: 'conversion', title: 'Teklif Dönüşüm Oranları', desc: 'Verilen tekliflerin kazanma analizi', icon: <FileText />, color: 'text-purple-600 dark:text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
            { id: 'salesx', title: 'SalesX Saha Zekası', desc: 'Saha ekipleri rotaya uyum, analizi', icon: <Map />, color: 'text-sky-600 dark:text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10' },
            { id: 'campaigns', title: 'Kampanya Etkililiği', desc: 'Kupon ve promosyonların ciroya etkisi', icon: <Presentation />, color: 'text-pink-600 dark:text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10' }
        ]
    },
    {
        category: 'Servis & Müşteri',
        items: [
            { id: 'service', title: 'Servis Masası & SLA', desc: 'Kapanan bilet süreleri, SLA hedefleri', icon: <Clock />, color: 'text-cyan-600 dark:text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
            { id: 'calls', title: 'Çağrı İstatistikleri', desc: 'Müşteri hizmetleri çağrı yoğunlukları', icon: <PhoneCall />, color: 'text-teal-600 dark:text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
            { id: 'mailing', title: 'Toplu İletişim', desc: 'SMS ve E-posta gönderim istatistikleri', icon: <Mail />, color: 'text-orange-600 dark:text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' }
        ]
    },
    {
        category: 'Kaynak & Envanter',
        items: [
            { id: 'inventory', title: 'Stok Devir Hızı & Yük', desc: 'Hangi ürün depoda bekliyor?', icon: <Package />, color: 'text-yellow-700 dark:text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
            { id: 'bom', title: 'Ürün Reçetesi (BOM)', desc: 'Üretim maliyetlerindeki anlık sapmalar', icon: <Factory />, color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-500/10' },
            { id: 'assets', title: 'Varlık ve Demirbaş', desc: 'Sabit kıymet zimmet ve amortisman', icon: <Settings />, color: 'text-lime-700 dark:text-lime-500', bg: 'bg-lime-50 dark:bg-lime-500/10' },
            { id: 'hr', title: 'İnsan Kaynakları Panosu', desc: 'İzin, mesai, tolerans analizi', icon: <Workflow />, color: 'text-fuchsia-600 dark:text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10' }
        ]
    }
];

export default function ReportsCatalogPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1220] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
            
            <div className="max-w-[1400px] mx-auto">
                {/* Clean, Compact Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <BarChart3 strokeWidth={2.5} size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                Enterprise Raporlama Panosu
                            </h1>
                            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                Tüm kurumsal modüllerin bütünleşik veri ve analitik raporları
                            </p>
                        </div>
                    </div>
                </div>

                {/* Light & Clean Executive Banner */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 mb-10 flex flex-col md:flex-row items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                            <Activity size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Strateji Merkezi (Executive Dashboard)</h2>
                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">C-Level yöneticiler için şirketin finans, nakit ve büyüme özetini tek bir panelde birleştiren kokpit ekranı.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => router.push('/reports/ceo')}
                        className="mt-4 md:mt-0 w-full md:w-auto whitespace-nowrap bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-[13px] font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        Detaylı Panoya Git
                        <ArrowRight size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {/* High Density Modules Grid */}
                <div className="space-y-8">
                    {REPORT_MODULES.map((category, idx) => (
                        <div key={idx}>
                            {/* Category Title with Line */}
                            <h3 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-3">
                                {category.category}
                                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {category.items.map((report) => (
                                    <button 
                                        key={report.id}
                                        onClick={() => router.push(report.path)}
                                        className="text-left w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm flex items-start gap-4 group"
                                    >
                                        <div className={`shrink-0 w-10 h-10 rounded-[10px] flex items-center justify-center ${report.bg} ${report.color} group-hover:scale-110 transition-transform duration-200`}>
                                            {React.cloneElement(report.icon as any, { size: 18, strokeWidth: 2.5 })}
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {report.title}
                                            </h4>
                                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                {report.desc}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                
            </div>
        </div>
    );
}