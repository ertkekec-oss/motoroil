import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell } from "@/components/ui/enterprise";
import { Plus, Globe, MonitorSmartphone, Settings, Zap, History, MousePointerClick, Users } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function CMSDashboard() {
  const sessionResult: any = await getSession();
  const session = sessionResult?.user || sessionResult;
  if (!session) redirect("/auth/login");

  // Fetch or Auto-create the main site
  let mainSite = await prisma.cmsSite.findFirst({
    where: { tenantId: null },
    include: { pages: true }
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
      include: { pages: true }
    });
  }

  return (
    <EnterprisePageShell
      title="İçerik Stüdyosu (CMS V2)"
      description="Yapay Zeka Destekli Büyüme ve İçerik Motoru"
      actions={
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all shadow-sm">
            <Globe className="w-4 h-4" />
            <span>Site Ayarları</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Yeni Sayfa Oluştur</span>
          </button>
        </div>
      }
    >
      <div className="animate-in fade-in duration-500">
        
        {/* KPI Dashboard - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Aktif A/B Testleri", value: "0", sub: "Gelişim Bekleniyor", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Kişiselleştirilmiş Bloklar", value: "0", sub: "Aktif Segmentler", icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
            { label: "Toplam Sayfa", value: mainSite.pages.length.toString(), sub: "TR", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Son Revizyon", value: "Bugün", sub: "Oto-Yedekleme", icon: History, color: "text-emerald-500", bg: "bg-emerald-500/10" }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-colors">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  <span className="text-xs text-slate-500">{stat.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Site Selector */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{mainSite.name}</h2>
              <p className="text-sm text-slate-400 font-medium">{mainSite.domain} • Ana Yapı</p>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex">
            <button className="px-4 py-1.5 text-sm font-semibold rounded-md bg-slate-800 text-white shadow-sm">Sayfalar (Pages)</button>
            <button className="px-4 py-1.5 text-sm font-semibold rounded-md text-slate-400 hover:text-white">Çoklu Dil (i18n)</button>
            <button className="px-4 py-1.5 text-sm font-semibold rounded-md text-slate-400 hover:text-white">Medya (Assets)</button>
          </div>
        </div>

        {/* Pages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {mainSite.pages.map((page) => (
            <Link href={`/admin/cms/editor/${page.id}`} key={page.id} className="group relative block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                
                {/* Visual Preview Header (Mock) */}
                <div className="h-32 border-b border-slate-800 bg-slate-950 flex flex-col p-4 relative overflow-hidden">
                  {/* Decorative Elements matching page type */}
                  <div className="absolute top-2 left-2 right-2 h-4 rounded bg-slate-800/50" />
                  <div className="absolute top-8 left-2 w-2/3 h-12 rounded bg-slate-800/30" />
                  <div className="absolute bottom-2 right-2 h-6 w-20 rounded bg-blue-600/30" />
                  
                  {/* Live Status Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/80 backdrop-blur-sm border border-slate-700/50">
                    <div className={`w-2 h-2 rounded-full ${page.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-[10px] font-bold text-slate-300 tracking-wider">
                      {page.status === 'PUBLISHED' ? 'CANLI' : 'TASLAK'}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {page.title}
                      </h3>
                      <p className="text-sm text-slate-400 font-mono mt-1">/{page.slug === 'index' ? '' : page.slug}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-6 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5" title="Kullanılan Blok Sayısı">
                      <MonitorSmartphone className="w-4 h-4 text-slate-400" />
                      <span>0 Blok</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Aktif A/B Testi Var mı?">
                      <Zap className="w-4 h-4 text-slate-400" />
                      <span>Test Yok</span>
                    </div>
                    <div className="text-xs ml-auto bg-slate-800 px-2 py-1 rounded text-slate-400 font-bold uppercase">
                      {page.locale}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* New Page Button inside Grid */}
          <button className="bg-transparent border-2 border-dashed border-slate-800 rounded-xl hover:border-slate-600 hover:bg-slate-900/50 transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[220px]">
             <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
               <Plus className="w-6 h-6" />
             </div>
             <p className="text-slate-300 font-semibold mb-1">Yeni Sayfa Oluştur</p>
             <p className="text-sm text-slate-500 text-center px-4">Boş bir şablon veya yapay zeka taslağı ile başlayın.</p>
          </button>
        </div>

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
