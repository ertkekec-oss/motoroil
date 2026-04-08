import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell } from "@/components/ui/enterprise";
import { Plus, Activity, ArrowRight, BarChart2, MousePointerClick, Zap, HelpCircle, CheckCircle2, Play, Pause, Target, DivideSquare } from "lucide-react";

export default async function CMSAbTests() {
  const sessionResult: any = await getSession();
  const session = sessionResult?.user || sessionResult;
  if (!session) redirect("/auth/login");

  // Dummy AB Test data for the enterprise look
  const abTests = [
    {
      id: "test_1",
      name: "Ana Sayfa Hero Buton Rengi (Mavi vs Yeşil)",
      status: "ACTIVE",
      type: "DÜĞME (BTN)",
      page: "Ana Sayfa (/index)",
      visitors: "14,502",
      variants: [
        { name: "Varyant A (Mavi - Kontrol)", conversion: "%4.2", leads: "304", isWinner: false },
        { name: "Varyant B (Yeşil - Test)", conversion: "%5.8", leads: "420", isWinner: true }
      ],
      improvement: "+%38.0",
      startDate: "12 Mart 2026",
      endDate: "Devam Ediyor"
    },
    {
      id: "test_2",
      name: "Fiyatlandırma Tablosu Sıralaması (Pro Önce)",
      status: "COMPLETED",
      type: "BLOK (COMP)",
      page: "Fiyatlar (/pricing)",
      visitors: "28,210",
      variants: [
        { name: "Sıralama: Başlangıç > Pro > VIP", conversion: "%2.1", leads: "296", isWinner: false },
        { name: "Sıralama: Pro (Öne Çıkarılan) > Başlangıç > VIP", conversion: "%3.9", leads: "549", isWinner: true }
      ],
      improvement: "+%85.7",
      startDate: "01 Mart 2026",
      endDate: "10 Mart 2026"
    },
    {
      id: "test_3",
      name: "E-Fatura Upsell Afişi Metni Varyasyonları",
      status: "ACTIVE",
      type: "METİN",
      page: "Satış Paneli (/sales)",
      visitors: "8,920",
      variants: [
        { name: "İhtiyacınız Olan Kontörleri Alın", conversion: "%8.4", leads: "374", isWinner: false },
        { name: "Kontörünüz Bitiyor! Faturada Yarı Yolda Kalmayın", conversion: "%8.1", leads: "361", isWinner: false }
      ],
      improvement: "Belirsiz",
      startDate: "15 Mart 2026",
      endDate: "Devam Ediyor"
    },
    {
      id: "test_4",
      name: "B2B Müşteri İçin Basitleştirilmiş Footer",
      status: "DRAFT",
      type: "BLOK (COMP)",
      page: "Tüm Sayfalar (Global)",
      visitors: "0",
      variants: [
        { name: "Tam Genişlik Footer (Standart)", conversion: "-", leads: "-", isWinner: false },
        { name: "Minimal Footer (Gezinme Hızı için)", conversion: "-", leads: "-", isWinner: false }
      ],
      improvement: "-",
      startDate: "Planlanmadı",
      endDate: "-"
    }
  ];

  return (
    <EnterprisePageShell
      title="A/B Test ve Analiz"
      description="Sayfalarınızdaki farklı varyasyonları gerçek kullanıcılarla test edin, veri odaklı kararlar alarak dönüşüm oranlarınızı maksimize edin."
      actions={
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-sm font-semibold rounded-lg transition-all shadow-sm">
             <HelpCircle className="w-4 h-4" />
             <span>Nasıl Çalışır?</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Yeni Deney Başlat</span>
          </button>
        </div>
      }
    >
      <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto space-y-6">
        
        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Aktif Deneyler", value: "2", sub: "Eşzamanlı test ediliyor", icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Kazanan Varyantlar", value: "14", sub: "Bugüne kadar", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Ortalama Dönüşüm Artışı", value: "%32.4", sub: "Son 30 günde", icon: ArrowRight, color: "text-indigo-500", bg: "bg-indigo-50" },
            { label: "Bölünen (Test) Trafiği", value: "54K+", sub: "Toplam ziyaretçi", icon: DivideSquare, color: "text-amber-500", bg: "bg-amber-50" }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                  <span className="text-xs text-slate-400 font-medium">{stat.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
           <div className="flex gap-2 w-full sm:w-auto">
              <button className="px-4 py-2 text-sm font-bold bg-white text-blue-700 shadow-sm border border-slate-200/60 rounded-md">Tümü</button>
              <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-md transition-all">Devam Edenler (2)</button>
              <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-md transition-all">Tamamlananlar</button>
           </div>
           
           <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
             <span>Sırala:</span>
             <select className="bg-white border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500">
               <rect>Son Eklenenler</rect>
               <option>Duruma Göre</option>
               <option>En Yüksek Artış</option>
             </select>
           </div>
        </div>

        {/* A/B Tests List */}
        <div className="space-y-4">
           {abTests.map((test) => (
             <div key={test.id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Section - Meta & Info */}
                <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 w-full md:w-2/5 flex flex-col justify-between bg-slate-50/30">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        test.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 
                        test.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-slate-200 text-slate-600'
                      }`}>
                         {test.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                         {test.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                         {test.status === 'ACTIVE' ? 'Yayında' : test.status === 'COMPLETED' ? 'Tamamlandı' : 'Taslak'}
                      </div>
                      <div className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                         {test.type}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{test.name}</h3>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                      <Target className="w-4 h-4" /> Hedef Sayfa: <span className="text-slate-800">{test.page}</span>
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-slate-400" /> Toplam Ziyaretçi: <span className="text-slate-900">{test.visitors}</span>
                    </div>
                    <div>
                      Başlangıç: <span className="text-slate-900">{test.startDate}</span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Variants & Results */}
                <div className="p-6 w-full md:w-3/5 relative flex flex-col justify-center">
                   
                   {/* Giant Improvement Watermark */}
                   {test.improvement !== 'Belirsiz' && test.improvement !== '-' && (
                     <div className="absolute right-6 top-6 opacity-5 flex flex-col items-end pointer-events-none">
                        <Zap className="w-24 h-24 text-emerald-500" />
                     </div>
                   )}

                   <div className="space-y-4 relative z-10">
                     {test.variants.map((v, idx) => (
                        <div key={idx} className={`relative p-4 rounded-lg border-2 flex items-center justify-between ${
                          v.isWinner ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}>
                           {v.isWinner && (
                             <div className="absolute -top-3 -right-2 bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                               <Zap className="w-3 h-3 fill-white" /> Kazanan
                             </div>
                           )}
                           
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${v.isWinner ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {idx === 0 ? 'A' : 'B'}
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${v.isWinner ? 'text-emerald-900' : 'text-slate-700'}`}>{v.name}</p>
                                <p className="text-xs font-semibold text-slate-400 mt-0.5">Dönüşüm Alan: {v.leads} Kişi</p>
                              </div>
                           </div>

                           <div className="text-right">
                              <p className={`text-2xl font-extrabold ${v.isWinner ? 'text-emerald-600' : 'text-slate-900'}`}>{v.conversion}</p>
                              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Dönüşüm</p>
                           </div>
                        </div>
                     ))}
                   </div>

                   <div className="mt-5 flex items-center justify-between pt-5 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Performans Farkı:</span>
                        <span className={`text-sm font-extrabold px-2 py-0.5 rounded ${
                          test.improvement.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 
                          test.improvement === '-' ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {test.improvement}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {test.status === 'ACTIVE' ? (
                           <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded transition-colors">
                             <Pause className="w-3.5 h-3.5" /> Testi Durdur
                           </button>
                        ) : test.status === 'DRAFT' ? (
                           <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded transition-colors">
                             <Play className="w-3.5 h-3.5" /> Testi Başlat
                           </button>
                        ) : (
                           <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold rounded transition-colors">
                             <MousePointerClick className="w-3.5 h-3.5" /> Raporu İncele
                           </button>
                        )}
                      </div>
                   </div>
                </div>

             </div>
           ))}
        </div>

      </div>
    </EnterprisePageShell>
  );
}
