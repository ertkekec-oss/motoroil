import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell } from "@/components/ui/enterprise";
import { Plus, Globe, MonitorSmartphone, Settings, Zap, History, MousePointerClick, Users, Edit3, Trash2, Languages, Link as LinkIcon, Image as ImageIcon, UploadCloud } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function CMSDashboard(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
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

  async function deletePage(formData: FormData) {
    "use server"
    const pageId = formData.get("pageId") as string;
    if(!pageId) return;
    
    await prisma.cmsBlock.deleteMany({ where: { pageId } });
    await prisma.cmsPage.delete({ where: { id: pageId } });
    revalidatePath("/admin/cms");
  }

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
              <div key={page.id} className="group relative block">
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform group-hover:-translate-y-1">
                  
                  {/* Clean Page Preview Area */}
                  <Link href={`/admin/cms/editor/${page.id}`}>
                    <div className="h-24 bg-gradient-to-br from-slate-50 to-blue-50/30 border-b border-slate-100 flex items-center justify-center p-5 relative cursor-pointer group-hover:bg-blue-50/50">
                      <Globe className="w-10 h-10 text-blue-200 group-hover:text-blue-400 transition-colors" />
                      {/* Live Status Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white shadow-sm border border-slate-200/60 backdrop-blur-sm z-10">
                        <div className={`w-2 h-2 rounded-full ${page.status === 'PUBLISHED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-[10px] font-extrabold text-slate-900 tracking-wider">
                          {page.status === 'PUBLISHED' ? 'CANLI' : 'TASLAK'}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link href={`/admin/cms/editor/${page.id}`}>
                          <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer">
                            {page.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-slate-500 font-medium mt-1 group-hover:text-blue-500 transition-colors">/{page.slug === 'index' ? '' : page.slug}</p>
                      </div>
                      
                      {/* Delete Action Form */}
                      {page.slug !== 'index' && (
                         <form action={deletePage}>
                           <input type="hidden" name="pageId" value={page.id} />
                           <button type="submit" className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors" title="Sayfayı Sil">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </form>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-6 text-[13px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100" title="Kullanılan Blok Sayısı">
                        <MonitorSmartphone className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-900 font-bold">{page.blocks?.length || 0}</span> Blok
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100" title="Aktif A/B Testi Var mı?">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="text-slate-900 font-bold">Yok</span>
                      </div>
                      <div className="ml-auto bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-md text-slate-900 font-extrabold uppercase flex items-center gap-1">
                        <Languages className="w-3 h-3 text-slate-400" />
                        {page.locale}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Edit Footer */}
                  <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-slate-400">Son Güncelleme: Az Önce</span>
                      <Link href={`/admin/cms/editor/${page.id}`} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800">
                        <Edit3 className="w-3 h-3" /> Editöre Git
                      </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* New Page Button inside Grid */}
            <Link href="/admin/cms/new" className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[220px] group cursor-pointer">
               <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-4 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all">
                 <Plus className="w-6 h-6 stroke-[2.5]" />
               </div>
               <p className="text-slate-900 font-bold mb-1 group-hover:text-blue-700 transition-colors text-lg">Yeni Sayfa Oluştur</p>
               <p className="text-sm text-slate-500 text-center px-4 font-medium">Sitenize yeni bir alan eklemek için boş bir sayfa ile başlayın.</p>
            </Link>
          </div>
        )}

        {/* Tab Placeholders - Improved and Functional Mocks */}
        {activeTab === 'i18n' && (
           <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-6 h-6 text-blue-500" />
                    Çoklu Dil (i18n) Yönetimi
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Sitenizin dil seçeneklerini yapılandırın ve çevirileri yönetin.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> Yeni Dil Ekle
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Existing Locale Card */}
                 <div className="border border-slate-200 bg-slate-50 rounded-lg p-5">
                    <div className="flex justify-between items-start mb-4">
                       <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                         🇹🇷 Türkçe
                         <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Varsayılan</span>
                       </h4>
                       <span className="text-xs font-bold text-slate-400">tr-TR</span>
                    </div>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between text-sm">
                         <span className="text-slate-500">Ana Sayfa:</span>
                         <span className="font-bold text-emerald-600">Tamamlandı (100%)</span>
                       </div>
                       <div className="flex items-center justify-between text-sm">
                         <span className="text-slate-500">Özellikler:</span>
                         <span className="font-bold text-amber-600">Kısmi (25%)</span>
                       </div>
                    </div>
                    <button className="w-full mt-6 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-blue-50 hover:text-blue-700 transition-colors">Çevirileri Yönet</button>
                 </div>
                 
                 {/* Empty / Setup Locale Card */}
                 <div className="border border-dashed border-slate-300 rounded-lg p-5 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Globe className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">🌍 İngilizce (EN)</p>
                    <p className="text-xs text-slate-500 mb-4 px-2">Global ağınız için İngilizce alt yapısı henüz aktif değil.</p>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded shadow-sm hover:bg-blue-700 transition">
                      <Zap className="w-3 h-3" />
                      Yapay Zeka ile Çevir (Kur)
                    </button>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'assets' && (
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-0 overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-amber-500" />
                    Medya (Assets) Kütüphanesi
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Sitende kullanılan tüm görseller, dökümanlar ve statik dosyalar.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm">
                  <UploadCloud className="w-4 h-4" /> Dosya Yükle
                </button>
              </div>
              
              <div className="p-6 flex-1 bg-slate-50/50">
                 <div className="grid grid-cols-2 lg:grid-cols-5 md:grid-cols-4 gap-4">
                    {/* Simulated Images */}
                    {[
                      { url: "https://images.unsplash.com/photo-1542596594-649edbc13630", name: "eticaret-yonetimi.jpg", size: "1.2 MB", type: "IMAGE" },
                      { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2", name: "focus-bg.png", size: "840 KB", type: "IMAGE" },
                      { url: "https://flagcdn.com/w160/tr.png", name: "tr-flag.png", size: "12 KB", type: "IMAGE" },
                      { url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", name: "hero-dashboard.jpg", size: "2.1 MB", type: "IMAGE" },
                      { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71", name: "data-chart.jpg", size: "450 KB", type: "IMAGE" },
                    ].map((asset, i) => (
                      <div key={i} className="group border border-slate-200 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-amber-300">
                         <div className="aspect-square relative overflow-hidden bg-slate-100 flex items-center justify-center">
                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <button className="bg-white text-slate-900 p-2 rounded-full shadow hover:bg-slate-100"><LinkIcon className="w-4 h-4"/></button>
                            </div>
                         </div>
                         <div className="p-3">
                            <h4 className="text-xs font-bold text-slate-700 truncate" title={asset.name}>{asset.name}</h4>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{asset.size} • {asset.type}</p>
                         </div>
                      </div>
                    ))}
                    
                    {/* Upload Placeholder Tile */}
                    <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-lg aspect-square flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-amber-500 hover:border-amber-300 cursor-pointer transition-all">
                       <UploadCloud className="w-8 h-8 mb-2" />
                       <span className="text-xs font-bold">Yeni Yükle</span>
                    </div>
                 </div>
              </div>
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
