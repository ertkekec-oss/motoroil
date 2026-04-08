import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell } from "@/components/ui/enterprise";
import { Plus, Users, Target, Activity, Filter, Settings, Search, Edit3, Trash2, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function CMSSegments() {
  const sessionResult: any = await getSession();
  const session = sessionResult?.user || sessionResult;
  if (!session) redirect("/auth/login");

  // Dummy segments data for modern enterprise look
  const segments = [
    {
      id: "seg_1",
      name: "Tüm Ziyaretçiler",
      description: "Siteye giriş yapan anonim veya üye tüm ziyaretçiler.",
      audienceCount: "1.2M",
      status: "ACTIVE",
      type: "DEFAULT",
      rules: ["Cihaz: Tümü", "Oturum: Tümü"],
      conversion: "%2.4",
      lastUpdate: "Bugün"
    },
    {
      id: "seg_2",
      name: "VIP / Sadık Müşteriler",
      description: "Son 6 ayda 5'ten fazla sipariş veren veya 10.000₺ üzeri harcama yapan üyeler.",
      audienceCount: "14.2K",
      status: "ACTIVE",
      type: "CUSTOM",
      rules: ["Sipariş Sayısı > 5", "Toplam Harcama > 10.000₺"],
      conversion: "%18.2",
      lastUpdate: "2 saat önce"
    },
    {
      id: "seg_3",
      name: "Sepeti Terk Edenler",
      description: "Sepetine ürün eklemiş ancak son 24 saat içinde ödeme işlemini tamamlamamış kullanıcılar.",
      audienceCount: "8.5K",
      status: "ACTIVE",
      type: "DYNAMIC",
      rules: ["Sepette Ürün Var = Evet", "Son Etkileşim < 24 Saat", "Sipariş = Hayır"],
      conversion: "%0.0",
      lastUpdate: "Az önce"
    },
    {
      id: "seg_4",
      name: "B2B Bayiler (Toptan)",
      description: "Kurumsal e-posta ile kayıtlı, vergi levhası onaylanmış bayiler.",
      audienceCount: "850",
      status: "ACTIVE",
      type: "B2B",
      rules: ["Kullanıcı Tipi = Bayi", "Durum = Onaylı"],
      conversion: "%42.8",
      lastUpdate: "Dün"
    },
    {
      id: "seg_5",
      name: "Mobil Kullanıcılar",
      description: "Sadece akıllı telefon veya tablet üzerinden giriş yapan kitle.",
      audienceCount: "840K",
      status: "DRAFT",
      type: "DEVICE",
      rules: ["Cihaz Tipi = Mobil"],
      conversion: "%1.8",
      lastUpdate: "1 hafta önce"
    }
  ];

  return (
    <EnterprisePageShell
      title="Kitle ve Segmentler"
      description="Kullanıcı kitlelerinizi tanımlayın, davranışlara göre segmentler oluşturun ve kişiselleştirilmiş içerik kuralları belirleyin."
      actions={
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-sm font-semibold rounded-lg transition-all shadow-sm">
             <Filter className="w-4 h-4" />
             <span>Filtrele</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Yeni Segment Oluştur</span>
          </button>
        </div>
      }
    >
      <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto space-y-6">
        
        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Toplam İzlenen Kitle", value: "1.25M+", sub: "Aktif Cihaz", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Özel Segment Sayısı", value: "12", sub: "Yayında", icon: Target, color: "text-indigo-500", bg: "bg-indigo-50" },
            { label: "Dinamik Hedefleme", value: "%34", sub: "Dönüşüm Oranı Artışı", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Yapay Zeka Tarafından", value: "3", sub: "Önerilmiş Segment", icon: Activity, color: "text-amber-500", bg: "bg-amber-50" }
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

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
           <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Segment adı veya kural ara..." 
                className="w-full bg-white border border-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder-slate-400"
              />
           </div>
           
           <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-bold bg-white text-blue-700 shadow-sm border border-slate-200/60 rounded-md">Tümü</button>
              <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-md transition-all">Dinamik</button>
              <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-md transition-all">Statik B2B</button>
           </div>
        </div>

        {/* Segment Grid List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
           {segments.map((segment) => (
             <div key={segment.id} className="group relative bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden">
                <div className="p-5 flex-1 relative">
                   {/* Status Badge */}
                   <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                      <div className={`w-2 h-2 rounded-full ${segment.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600">{segment.status === 'ACTIVE' ? 'Aktif' : 'Taslak'}</span>
                   </div>

                   <h3 className="text-lg font-bold text-slate-900 pr-20">{segment.name}</h3>
                   <p className="text-xs font-semibold text-blue-600 mb-3 uppercase tracking-wider">{segment.type} SEGMENT</p>
                   
                   <p className="text-sm text-slate-500 font-medium leading-relaxed mb-5 min-h-[40px]">
                     {segment.description}
                   </p>

                   {/* Rules List */}
                   <div className="space-y-2 mb-6">
                     <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Kurallar</p>
                     <div className="flex flex-wrap gap-2">
                       {segment.rules.map((rule, idx) => (
                          <span key={idx} className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded relative overflow-hidden group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                             <CheckCircle2 className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                             {rule}
                          </span>
                       ))}
                     </div>
                   </div>

                   {/* Analytics Box */}
                   <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-4 border border-slate-100 group-hover:border-blue-100 transition-colors">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Eşleşen Kitle</p>
                        <p className="text-lg font-extrabold text-slate-900">{segment.audienceCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Dönüşüm Oranı</p>
                        <p className="text-lg font-extrabold text-emerald-600">{segment.conversion}</p>
                      </div>
                   </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex justify-between items-center">
                   <div className="text-xs font-semibold text-slate-400">
                     Güncelleme: <span className="text-slate-600">{segment.lastUpdate}</span>
                   </div>
                   <div className="flex gap-1">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Segmenti Düzenle">
                         <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Sil">
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
           ))}

           {/* Add New Segment Card */}
           <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-xl flex flex-col items-center justify-center p-8 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group min-h-[350px]">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-4 group-hover:scale-110 transition-transform">
                 <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 mb-1">Yeni Segment Kur</h4>
              <p className="text-sm font-medium text-slate-500 text-center px-4 max-w-sm">
                Kullanıcı davranışları, sipariş geçmişi ve oturum verilerini kullanarak yepyeni bir hedef kitle tanımlayın.
              </p>
           </div>
        </div>

      </div>
    </EnterprisePageShell>
  );
}
