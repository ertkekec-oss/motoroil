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
            { id: 'profitability', title: 'Şirket Kârlılık ve Büyüme Analizi', desc: 'Brüt/Net Kâr, Ciro, Gider Karşılaştırması', icon: <TrendingUp />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { id: 'aging', title: 'Cari Yaşlandırma ve Risk', desc: 'Kim ne kadar borçlu, tahsilat gecikmeleri', icon: <Calculator />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { id: 'reconciliation', title: 'Mutabakat Performansı', desc: 'BA/BS Onay Oranları, İhtilaflı Bakiyeler', icon: <Briefcase />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { id: 'anomalies', title: 'Sistem Anomalileri', desc: 'Olağandışı iskontolar, silinen fişler', icon: <ShieldAlert />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' }
        ]
    },
    {
        category: 'Operasyon & Satış',
        items: [
            { id: 'personnel', title: 'Personel Satış Performansı', desc: 'Hangi personel ne kadar sattı?', icon: <Users />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
            { id: 'conversion', title: 'Teklif Dönüşüm Oranları', desc: 'Verilen tekliflerin kazanma kaybetme analizi', icon: <FileText />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
            { id: 'salesx', title: 'SalesX Saha Zekası', desc: 'Saha ekipleri rotaya uyum, check-in raporu', icon: <Map />, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10' },
            { id: 'campaigns', title: 'Kampanya Etkililiği', desc: 'Kupon ve promosyonların ciroya etkisi', icon: <Presentation />, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10' }
        ]
    },
    {
        category: 'Servis & Müşteri İletişimi',
        items: [
            { id: 'service', title: 'Servis Masası & SLA Panosu', desc: 'Kapanan bilet süreleri, aşan SLA hedefleri', icon: <Clock />, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
            { id: 'calls', title: 'Çağrı İstatistikleri', desc: 'Müşteri hizmetleri çağrı yoğunlukları', icon: <PhoneCall />, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
            { id: 'mailing', title: 'Toplu İletişim', desc: 'SMS ve E-posta gönderim istatistikleri', icon: <Mail />, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' }
        ]
    },
    {
        category: 'Kaynak & Envanter Yönetimi',
        items: [
            { id: 'inventory', title: 'Stok Devir Hızı & Atıl Yük', desc: 'Hangi ürün depoda satılmadan bekliyor?', icon: <Package />, color: 'text-yellow-600 dark:text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
            { id: 'bom', title: 'Ürün Reçetesi (BOM) Maliyet', desc: 'Üretim maliyetlerindeki anlık sapmalar', icon: <Factory />, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-500/10' },
            { id: 'assets', title: 'Varlık ve Demirbaş Analizi', desc: 'Sabit kıymet zimmet ve amortisman durumu', icon: <Settings />, color: 'text-lime-600 dark:text-lime-500', bg: 'bg-lime-50 dark:bg-lime-500/10' },
            { id: 'hr', title: 'İnsan Kaynakları Puan Tablosu', desc: 'İzin, mesai, vardiya tolerans analizi', icon: <Workflow />, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10' }
        ]
    }
];

export default function ReportsCatalogPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1220] p-4 sm:p-6 lg:p-8 pb-32 animate-in fade-in duration-500">
            
            <div className="max-w-[1400px] mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-widest mb-4">
                        <BarChart3 className="w-3.5 h-3.5" strokeWidth={2.5} /> Analitik Çekirdeği
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Enterprise Raporlama
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-3 max-w-2xl leading-relaxed">
                        Sisteme kayıtlı 18 kurumsal modülün anlık rapor kataloğu. Drill-down yetenekleri ile organizasyon, şube ve tarih bazlı keskin analizler oluşturun.
                    </p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto space-y-12">
                {/* Executive Pin - Premium Zero Border Focus */}
                <button 
                    onClick={() => router.push('/reports/ceo')} 
                    className="w-full text-left group box-border relative overflow-hidden bg-slate-900 dark:bg-slate-800 rounded-[28px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1"
                >
                    <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/30 transition-all duration-500 pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-indigo-500/20 dark:bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-500 pointer-events-none translate-y-1/3 -translate-x-1/3"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-12 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 rounded-[20px] flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                                <Activity className="w-9 h-9 text-white" strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-[32px] font-black text-white tracking-tight mb-2">Strateji Merkezi</h2>
                                <p className="text-[14px] font-semibold text-slate-300 dark:text-slate-400 max-w-lg leading-relaxed">
                                    C-Level yöneticiler için şirketin finans, nakit ve büyüme özetini tek bir panelde birleştiren kokpit ekranı.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 px-6 py-3.5 bg-white text-slate-900 dark:bg-blue-600 dark:text-white rounded-full text-[13px] font-black uppercase tracking-widest shadow-xl group-hover:px-8 transition-all duration-300">
                            PANOYA GİT <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                        </div>
                    </div>
                </button>

                {/* Modules Grid - SoftContainer Pattern */}
                <div className="space-y-14">
                    {REPORT_MODULES.map((category, idx) => (
                        <div key={idx} className="animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}>
                            <div className="flex items-center gap-3 mb-6 px-1">
                                <div className="h-6 w-2 bg-blue-600 dark:bg-blue-500 rounded-full shadow-sm"></div>
                                <h3 className="text-[22px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {category.category}
                                </h3>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                                {category.items.map((report) => (
                                    <div 
                                        key={report.id}
                                        onClick={() => router.push(report.path)}
                                        className="bg-white dark:bg-[#111827] rounded-[24px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[170px] border-0 ring-1 ring-slate-200/60 dark:ring-white/5 hover:ring-blue-200 dark:hover:ring-blue-500/30 relative overflow-hidden"
                                    >
                                        <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-slate-50 dark:from-slate-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tr-[24px]"></div>
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center ${report.bg} ${report.color} group-hover:scale-110 group-hover:rotate-[-3deg] transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]`}>
                                                    {React.cloneElement(report.icon as any, { className: "w-6 h-6 stroke-[2.5px]" })}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" strokeWidth={3} />
                                                </div>
                                            </div>
                                            
                                            <h4 className="text-[16px] font-black text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {report.title}
                                            </h4>
                                        </div>
                                        <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed relative z-10">
                                            {report.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}