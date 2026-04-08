import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell } from "@/components/ui/enterprise";
import { Plus, Globe, MonitorSmartphone, Settings, Zap, History, MousePointerClick, Users } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function CMSDashboard({ searchParams }: { searchParams: { tab?: string }}) {
  const sessionResult: any = await getSession();
  const session = sessionResult?.user || sessionResult;
  if (!session) redirect("/auth/login");

  const activeTab = searchParams.tab || 'pages';

  // Fetch or Auto-create the main site
  let mainSite = await prisma.cmsSite.findFirst({
    where: { tenantId: null },
    include: { pages: { include: { blocks: true } } }
  });

  if (!mainSite) {
    mainSite = await prisma.cmsSite.create({
      data: {
        domain: "periodya.com",
        name: "Periodya Global Network",
        defaultLanguage: "tr",
        pages: {
          create: [
            { slug: "index", title: "Ana Sayfa", locale: "tr", status: "DRAFT" },
            { slug: "features", title: "Özellikler", locale: "tr", status: "DRAFT" }
          ]
        }
      },
      include: { pages: { include: { blocks: true } } }
    });
  }

  // Calculate totals
  const totalBlocks = mainSite.pages.reduce((acc, p) => acc + (p.blocks?.length || 0), 0);

  return (
    <EnterprisePageShell
      title="İçerik Stüdyosu (CMS V2)"
      description="Yapay Zeka Destekli Büyüme ve İçerik Motoru"
      actions={
        <div className="flex gap-3">
          <Link href="/admin/cms/settings" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-sm font-semibold rounded-lg transition-all shadow-sm">
            <Globe className="w-4 h-4" />
            <span>Site Ayarları</span>
          </Link>
          <Link href="/admin/cms/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Yeni Sayfa Oluştur</span>
          </Link>
        </div>
      }
    >
      <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto">
        
        {/* KPI Dashboard - High Density, Light Theme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Aktif A/B Testleri", value: "0", sub: "Gelişim Bekleniyor", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Kişiselleştirilmiş Bloklar", value: totalBlocks.toString(), sub: "Aktif Yapılar", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
            { label: "Toplam Sayfa", value: mainSite.pages.length.toString(), sub: "TR", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Son Revizyon", value: "Bugün", sub: "Oto-Yedekleme", icon: History, color: "text-emerald-500", bg: "bg-emerald-50" }
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

        {/* Global Site Selector & Tabs */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{mainSite.name}</h2>
              <p className="text-sm text-slate-500 font-medium">{mainSite.domain} • Ana Yapı</p>
            </div>
          </div>
          
          <div className="bg-slate-100/80 border border-slate-200/60 rounded-lg p-1.5 flex gap-1 shadow-inner">
            <Link href="/admin/cms?tab=pages" className={`px-5 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'pages' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}>Sayfalar (Pages)</Link>
            <Link href="/admin/cms?tab=i18n" className={`px-5 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'i18n' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}>Çoklu Dil (i18n)</Link>
            <Link href="/admin/cms?tab=assets" className={`px-5 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'assets' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}>Medya (Assets)</Link>
          </div>
        </div>

        {activeTab === 'pages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mainSite.pages.map((page) => (
              <Link href={`/admin/cms/editor/${page.id}`} key={page.id} className="group relative block">
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform group-hover:-translate-y-1">
                  
                  {/* Clean Page Preview Area */}
                  <div className="h-24 bg-gradient-to-br from-slate-50 to-blue-50/30 border-b border-slate-100 flex items-center justify-center p-5 relative">
                    <Globe className="w-10 h-10 text-blue-100 group-hover:text-blue-200 transition-colors" />
                    {/* Live Status Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white shadow-sm border border-slate-200/60 backdrop-blur-sm z-10">
                      <div className={`w-2 h-2 rounded-full ${page.status === 'PUBLISHED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                      <span className="text-[10px] font-extrabold text-slate-900 tracking-wider">
                        {page.status === 'PUBLISHED' ? 'CANLI' : 'TASLAK'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {page.title}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">/{page.slug === 'index' ? '' : page.slug}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-6 text-[13px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100" title="Kullanılan Blok Sayısı">
                        <MonitorSmartphone className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-900 font-bold">{page.blocks?.length || 0}</span> Blok
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100" title="Aktif A/B Testi Var mı?">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="text-slate-900 font-bold">Yok</span>
                      </div>
                      <div className="ml-auto bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-slate-900 font-extrabold uppercase">
                        {page.locale}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* New Page Button inside Grid */}
            <Link href="/admin/cms/new" className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[220px] group cursor-pointer">
               <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-4 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all">
                 <Plus className="w-6 h-6 stroke-[2.5]" />
               </div>
               <p className="text-slate-900 font-bold mb-1 group-hover:text-blue-700 transition-colors text-lg">Yeni Sayfa Oluştur</p>
               <p className="text-sm text-slate-500 text-center px-4 font-medium">Boş bir şablon veya yapay zeka taslağı ile sitenizi geliştirmeye devam edin.</p>
            </Link>
          </div>
        )}

        {/* Tab Placeholders */}
        {activeTab === 'i18n' && (
           <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
              <Globe className="w-12 h-12 text-blue-200 mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Çoklu Dil (i18n) Yönetimi</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">Sitenizin dil seçeneklerini yapılandırın, çevirileri AI ile otomatik oluşturun veya manuel olarak düzenleyin.</p>
              <button disabled className="px-6 py-2.5 bg-blue-600/50 text-white font-bold rounded-lg cursor-not-allowed">Yakında Eklenecek</button>
           </div>
        )}

        {activeTab === 'assets' && (
           <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-12 h-12 text-amber-200 mb-4 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Medya (Assets) Havuzu</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">Görseller, videolar ve belgeler için merkezi kütüphane. Tüm site medyalarınızı buradan yönetin.</p>
              <button disabled className="px-6 py-2.5 bg-blue-600/50 text-white font-bold rounded-lg cursor-not-allowed">Yakında Eklenecek</button>
           </div>
        )}
      </div>
    </EnterprisePageShell>
  );
}

function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}
